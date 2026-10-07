import type {
  ConnectSignalSourceRequest,
  ConnectableSignalSourceId,
  RawSignalEnvelope,
  SignalProfilePreview,
} from '@hirekiwi/contracts';

export interface EncryptedCredentialsRef {
  readonly refId: string;
}

export interface AdapterFetchContext {
  readonly userId: string;
  readonly externalAccountId: string;
  readonly consentScope: string;
  readonly credentials?: EncryptedCredentialsRef;
  /** Source-specific metadata persisted at connect time (repo names, skill tags, …). */
  readonly metadata?: Record<string, unknown>;
}

export interface ConnectValidationResult {
  readonly externalAccountId: string;
  readonly consentScope: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Passive signal source adapter contract (S6-VB-01).
 *
 * Owner: Vishal Bharath R.
 */
export interface SignalSourceAdapter {
  readonly sourceId: ConnectableSignalSourceId;
  readonly supportedConsentScopes: readonly string[];

  validateConnectInput(input: ConnectSignalSourceRequest): Promise<ConnectValidationResult>;

  fetchRaw(ctx: AdapterFetchContext): Promise<RawSignalEnvelope>;

  /**
   * Optional: look a public profile up by username (existence + display name) without connecting.
   * Throws NotFoundException when there is no such public profile.
   */
  lookupProfile?(username: string): Promise<SignalProfilePreview>;

  checkHealth?(): Promise<{ reachable: boolean; latencyMs: number }>;
}
