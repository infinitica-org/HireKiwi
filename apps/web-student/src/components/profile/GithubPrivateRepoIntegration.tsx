'use client';

import { useState, type SVGProps } from 'react';
import { isSmartApiError, queryKeys } from '@hirekiwi/api-client';
import { useQuery, useQueryClient } from '@hirekiwi/ui';
import { api } from '@/lib/api';
import { IntegrationCard } from '@/components/profile/CodingPlatformIntegrations';

// lucide-react dropped brand/logo glyphs — mirrors the GitHub icon already
// duplicated in SocialVerification.tsx / ProfessionalLinksSection.tsx.
function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

/**
 * Separate from the onboarding wizard's "paste your GitHub URL" self-attestation
 * (SocialVerification.tsx) — this is a real OAuth grant (`repo` scope) so
 * corroboration can read the student's private repos too, not just public ones.
 */
export function GithubPrivateRepoIntegration() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.signalConnections(),
    queryFn: () => api.signals.listConnections(),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connection = data?.connections.find(
    (c) => c.sourceId === 'GITHUB' && c.status !== 'REVOKED',
  );

  const handleConnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.users.githubOauthUrl();
      window.location.href = url;
    } catch (err) {
      setError(isSmartApiError(err) ? err.message : 'Could not start GitHub private-repo access.');
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.signals.disconnect('GITHUB');
      await queryClient.invalidateQueries({ queryKey: queryKeys.signalConnections() });
    } catch (err) {
      setError(isSmartApiError(err) ? err.message : 'Could not disconnect GitHub right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <IntegrationCard
        logo={<GithubIcon className="size-5" />}
        name="GitHub (private repos)"
        description="Grant read access to your private repos so verification can analyze them, not just public ones."
        connected={Boolean(connection)}
        link={
          connection
            ? {
                href: `https://github.com/${connection.externalAccountId}`,
                label: `@${connection.externalAccountId}`,
              }
            : null
        }
        onAction={() => void (connection ? handleDisconnect() : handleConnect())}
        disabled={isLoading || busy}
      />
      {error ? (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
