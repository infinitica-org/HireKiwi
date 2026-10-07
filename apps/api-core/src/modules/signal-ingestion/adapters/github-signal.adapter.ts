import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ACTIVE_TAXONOMY_VERSION,
  type ConnectSignalSourceRequest,
  type RawSignalEnvelope,
} from '@hirekiwi/contracts';
import { env } from '../../../platform/config/env.js';
import { decryptSecret } from '../../../platform/crypto/secret-cipher.util.js';
import {
  extractGithubLogin,
  GithubApiClient,
} from '../../integrations/github/github-api.client.js';
import { GithubOnboardingService } from '../../integrations/github/github-onboarding.service.js';
import { SignalConnectionStore } from '../signal-connection.store.js';
import type {
  AdapterFetchContext,
  ConnectValidationResult,
  SignalSourceAdapter,
} from './signal-source.adapter.js';

const CONSENT_SCOPE = 'github.profile.public_refresh';
const OAUTH_CONSENT_SCOPE = 'github.oauth.repo';

/**
 * GitHub passive signal adapter — wraps existing onboarding client (S6-VB-01).
 *
 * Two connection modes share this one adapter: the original "paste a public
 * profile URL" connection (app-level token, public repos only), and the
 * OAuth-upgraded connection made via GithubOauthService (the student's own
 * `repo`-scope token, private repos included). `fetchRaw` looks up the
 * connection's stored encrypted token itself rather than trusting `ctx`,
 * since `ConnectableSignalSourceId` connections don't carry secrets in their
 * loosely-typed `metadata` bag.
 *
 * Owner: Vishal Bharath R.
 */
@Injectable()
export class GithubSignalAdapter implements SignalSourceAdapter {
  readonly sourceId = 'GITHUB' as const;
  readonly supportedConsentScopes = [CONSENT_SCOPE, OAUTH_CONSENT_SCOPE] as const;

  private readonly logger = new Logger(GithubSignalAdapter.name);

  constructor(
    @Inject(GithubOnboardingService) private readonly onboarding: GithubOnboardingService,
    @Inject(GithubApiClient) private readonly github: GithubApiClient,
    @Inject(SignalConnectionStore) private readonly connections: SignalConnectionStore,
  ) {}

  /** Decrypts the student's stored OAuth token, if this connection was upgraded via OAuth. */
  private async resolveAccessToken(userId: string): Promise<string | null> {
    const connection = await this.connections.get(userId, 'GITHUB');
    if (!connection?.encryptedAccessToken || !env.GITHUB_TOKEN_ENCRYPTION_KEY) return null;
    try {
      return decryptSecret(connection.encryptedAccessToken, env.GITHUB_TOKEN_ENCRYPTION_KEY);
    } catch (error) {
      this.logger.warn(
        `Failed to decrypt stored GitHub token for user ${userId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return null;
    }
  }

  async validateConnectInput(input: ConnectSignalSourceRequest): Promise<ConnectValidationResult> {
    if (!('githubUrl' in input)) {
      throw new BadRequestException({
        error: 'invalid_connect_body',
        message: 'GITHUB connect requires githubUrl.',
        statusCode: 400,
      });
    }
    const login = extractGithubLogin(input.githubUrl);
    if (!login) {
      throw new BadRequestException({
        error: 'invalid_github_url',
        message: 'That does not look like a github.com profile URL.',
        statusCode: 400,
      });
    }
    await this.onboarding.fetchProfile(input.githubUrl);
    return {
      externalAccountId: login,
      consentScope: CONSENT_SCOPE,
      metadata: {
        selectedRepoFullNames: input.selectedRepoFullNames ?? [],
        selectedSkillNames: input.selectedSkillNames ?? [],
      },
    };
  }

  async fetchRaw(ctx: AdapterFetchContext): Promise<RawSignalEnvelope> {
    const login = ctx.externalAccountId;
    const metadata = ctx.metadata ?? {};
    const accessToken = await this.resolveAccessToken(ctx.userId);
    let repoFullNames = Array.isArray(metadata.selectedRepoFullNames)
      ? (metadata.selectedRepoFullNames as string[])
      : [];

    if (repoFullNames.length === 0) {
      const repos = accessToken
        ? await this.github.listReposForAuthenticatedUser(accessToken)
        : await this.github.listRepos(login);
      repoFullNames = repos.slice(0, 5).map((repo) => repo.fullName);
    }

    const { languages } = await this.onboarding.repoLanguages(
      repoFullNames,
      accessToken ?? undefined,
    );
    const selectedSkillNames = Array.isArray(metadata.selectedSkillNames)
      ? (metadata.selectedSkillNames as string[])
      : [];

    return {
      userId: ctx.userId,
      sourceId: 'GITHUB',
      externalAccountId: login,
      fetchedAt: new Date().toISOString(),
      consentScope: ctx.consentScope,
      taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
      payload: {
        sourceId: 'GITHUB',
        languages,
        selectedSkillNames,
      },
    };
  }

  async checkHealth(): Promise<{ reachable: boolean; latencyMs: number }> {
    const started = Date.now();
    try {
      const response = await fetch('https://api.github.com/rate_limit', {
        signal: AbortSignal.timeout(4_000),
      });
      return { reachable: response.ok, latencyMs: Date.now() - started };
    } catch {
      return { reachable: false, latencyMs: Date.now() - started };
    }
  }
}
