'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@hirekiwi/ui/card';
import { api, formatApiError } from '../lib/api';

type Stage = 'idle' | 'enrolling' | 'recovery-codes' | 'disabling';

const inputClass =
  'w-full max-w-[220px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium tracking-widest text-zinc-900 outline-none focus:border-zinc-400';

export function TwoFactorAuthCard() {
  const [status, setStatus] = useState<{ enabled: boolean; enabledAt: string | null } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
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

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      setStatus(await api.auth.mfaStatus());
    } catch (err) {
      setError(formatApiError(err, 'Could not load MFA status.'));
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  function reset() {
    setStage('idle');
    setSetup(null);
    setCode('');
    setError(null);
  }

  async function startEnroll() {
    setError(null);
    setBusy(true);
    try {
      setSetup(await api.auth.mfaSetup());
      setCode('');
      setStage('enrolling');
    } catch (err) {
      setError(formatApiError(err, 'Could not start MFA setup.'));
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
      await fetchStatus();
    } catch (err) {
      setError(formatApiError(err, 'That code is incorrect. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    setError(null);
    setBusy(true);
    try {
      await api.auth.mfaDisable({ code: code.trim() });
      await fetchStatus();
      reset();
    } catch (err) {
      setError(formatApiError(err, 'That code is incorrect.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border/70 bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-teal-600" />
          <CardTitle>Two-factor authentication</CardTitle>
        </div>
        <CardDescription>
          Add an authenticator app as a second step when your team signs in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {loadingStatus ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-48 rounded bg-zinc-100" />
          </div>
        ) : stage === 'idle' ? (
          status?.enabled ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">
                Enabled
                {status.enabledAt ? ` on ${new Date(status.enabledAt).toLocaleDateString()}` : ''}.
              </p>
              <button
                type="button"
                onClick={() => setStage('disabling')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                Disable two-factor authentication
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">Not enabled.</p>
              <button
                type="button"
                onClick={() => void startEnroll()}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Starting…' : 'Set up two-factor authentication'}
              </button>
            </div>
          )
        ) : stage === 'enrolling' && setup ? (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">
              Scan this QR code with your authenticator app, then enter the 6-digit code.
            </p>
            {/* A data: URI, not a remote image — next/image would gain nothing here. */}
            <img
              src={setup.qrCodeDataUrl}
              alt="Scan with your authenticator app"
              className="h-40 w-40 rounded-md border border-zinc-200"
            />
            <p className="font-mono text-xs break-all text-zinc-400">
              Can&apos;t scan? Enter this key manually: {setup.secret}
            </p>
            <input
              className={inputClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void confirmEnable()}
                disabled={busy || code.trim().length !== 6}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Confirming…' : 'Confirm & enable'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : stage === 'recovery-codes' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>Two-factor authentication is enabled.</span>
            </div>
            <p className="text-xs font-medium text-zinc-700">
              Save these recovery codes somewhere safe — each works once if you lose access to your
              authenticator app, and they won&apos;t be shown again.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-sm">
              {recoveryCodes.map((rc) => (
                <span key={rc}>{rc}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(recoveryCodes.join('\n'))}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
              >
                Copy codes
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : stage === 'disabling' ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              Enter a 6-digit code (or a recovery code) to confirm.
            </p>
            <input
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456 or XXXXX-XXXXX"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void confirmDisable()}
                disabled={busy || code.trim().length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Disabling…' : 'Disable'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
