'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@hirekiwi/ui';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import { api } from '@/lib/api';
import { fieldClass, primaryButtonClass, SettingsCard, StatusMessage } from './account-ui';

type Stage = 'idle' | 'enrolling' | 'recovery-codes' | 'disabling';

export function TwoFactorAuthCard() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me', 'mfa-status'] as const,
    queryFn: () => api.auth.mfaStatus(),
  });

  const [stage, setStage] = useState<Stage>('idle');
  const [setup, setSetup] = useState<{
    otpauthUri: string;
    secret: string;
    qrCodeDataUrl: string;
  } | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStage('idle');
    setSetup(null);
    setCode('');
    setError(null);
  }

  async function refetchStatus() {
    await queryClient.invalidateQueries({ queryKey: ['me', 'mfa-status'] });
  }

  async function startEnroll() {
    setError(null);
    setBusy(true);
    try {
      const result = await api.auth.mfaSetup();
      setSetup(result);
      setCode('');
      setStage('enrolling');
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not start MFA setup.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable() {
    setError(null);
    setBusy(true);
    try {
      const result = await api.auth.mfaEnable({ code: code.trim() });
      setRecoveryCodes(result.recoveryCodes);
      setStage('recovery-codes');
      await refetchStatus();
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'That code is incorrect. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    setError(null);
    setBusy(true);
    try {
      await api.auth.mfaDisable({ code: code.trim() });
      await refetchStatus();
      reset();
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'That code is incorrect.');
    } finally {
      setBusy(false);
    }
  }

  function copyRecoveryCodes() {
    void navigator.clipboard?.writeText(recoveryCodes.join('\n'));
  }

  return (
    <SettingsCard
      title="Two-factor authentication"
      description="Add an authenticator app as a second step when signing in."
    >
      {isLoading ? (
        <p className="text-xs text-zinc-500">Loading…</p>
      ) : isError ? (
        <StatusMessage kind="error">Could not load your MFA status.</StatusMessage>
      ) : stage === 'idle' ? (
        data?.enabled ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Enabled{data.enabledAt ? ` on ${new Date(data.enabledAt).toLocaleDateString()}` : ''}.
              You'll be asked for a code each time you sign in.
            </p>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-950/30"
              onClick={() => setStage('disabling')}
            >
              Disable two-factor authentication
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Not enabled. Use an app like Google Authenticator, Authy or 1Password.
            </p>
            <button
              type="button"
              className={primaryButtonClass}
              disabled={busy}
              onClick={() => void startEnroll()}
            >
              {busy ? 'Starting…' : 'Set up two-factor authentication'}
            </button>
          </div>
        )
      ) : stage === 'enrolling' && setup ? (
        <div className="space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
          </p>
          {/* A data: URI, not a remote image — next/image would gain nothing here. */}
          <img
            src={setup.qrCodeDataUrl}
            alt="Scan with your authenticator app"
            className="h-40 w-40 rounded-md border border-zinc-200 dark:border-zinc-700"
          />
          <p className="font-mono text-xs break-all text-zinc-500 dark:text-zinc-400">
            Can't scan? Enter this key manually: {setup.secret}
          </p>
          <label className="grid max-w-[220px] gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            6-digit code
            <input
              className={`${fieldClass} text-center tracking-widest`}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
          </label>
          {error && <StatusMessage kind="error">{error}</StatusMessage>}
          <div className="flex gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              disabled={busy || code.trim().length !== 6}
              onClick={() => void confirmEnable()}
            >
              {busy ? 'Confirming…' : 'Confirm & enable'}
            </button>
            <button
              type="button"
              className="rounded-md px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              onClick={reset}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : stage === 'recovery-codes' ? (
        <div className="space-y-4">
          <StatusMessage kind="success">Two-factor authentication is enabled.</StatusMessage>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Save these recovery codes somewhere safe. Each can be used once if you lose access to
            your authenticator app — they won't be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900">
            {recoveryCodes.map((rc) => (
              <span key={rc}>{rc}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className={primaryButtonClass} onClick={copyRecoveryCodes}>
              Copy codes
            </button>
            <button
              type="button"
              className="rounded-md px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              onClick={reset}
            >
              Done
            </button>
          </div>
        </div>
      ) : stage === 'disabling' ? (
        <div className="space-y-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Enter a 6-digit code (or a recovery code) to confirm disabling two-factor
            authentication.
          </p>
          <label className="grid max-w-[260px] gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Code
            <input
              className={`${fieldClass} text-center tracking-widest`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
          </label>
          {error && <StatusMessage kind="error">{error}</StatusMessage>}
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:bg-transparent dark:text-rose-400"
              disabled={busy || code.trim().length === 0}
              onClick={() => void confirmDisable()}
            >
              {busy ? 'Disabling…' : 'Disable'}
            </button>
            <button
              type="button"
              className="rounded-md px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              onClick={reset}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </SettingsCard>
  );
}
