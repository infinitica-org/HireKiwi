'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, RefreshCw, Lock, ShieldCheck } from 'lucide-react';
import type { EmployerSubscriptionDto } from '@smart/contracts';
import { api, formatApiError } from '../../../lib/api';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CompanySettingsPage() {
  const [subscription, setSubscription] = useState<EmployerSubscriptionDto | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [replacing, setReplacing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setLoadingSub(true);
    try {
      const sub = await api.billing.getSubscription();
      setSubscription(sub);
    } catch (err) {
      setError(formatApiError(err, 'Failed to load subscription status.'));
    } finally {
      setLoadingSub(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleUpdatePaymentMethod = async () => {
    setError(null);
    setSuccess(null);
    setReplacing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway SDK. Check network connection.');
      }

      const session = await api.billing.replacePaymentMethod();

      if (typeof window.Razorpay !== 'function') {
        throw new Error('Razorpay SDK is not available in browser window.');
      }

      const options = {
        key: session.razorpayKeyId,
        subscription_id: session.razorpaySubscriptionId,
        name: session.companyName,
        description: 'Update Recurring Payment Method',
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          setVerifying(true);
          try {
            const updated = await api.billing.verifyPaymentMethodReplacement({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSubscription(updated);
            setSuccess(
              'Payment details updated successfully! Your recurring subscription mandate is active.',
            );
          } catch (err) {
            setError(formatApiError(err, 'Failed to verify updated payment details with server.'));
          } finally {
            setVerifying(false);
            setReplacing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setReplacing(false);
          },
        },
        theme: {
          color: '#0d9488',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(formatApiError(err, 'Failed to initiate payment method replacement session.'));
      setReplacing(false);
    }
  };

  const isEligibleForPaymentUpdate =
    subscription &&
    subscription.planCode !== 'FREE' &&
    ['ACTIVE', 'GRACE_PERIOD', 'PAST_DUE'].includes(subscription.status);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#172033]">Company Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your organization&apos;s credentials, security, and recurring billing payment
          details.
        </p>
      </div>

      {/* Payment Method Card */}
      <div className="rounded-2xl border border-[var(--ds-border,#e5e7eb)] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <CreditCard className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Payment Method & Mandate</h2>
              <p className="text-xs text-zinc-500">
                Razorpay recurring subscription payment mandate for automated billing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchSubscription}
            disabled={loadingSub}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className={`size-3.5 ${loadingSub ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <div className="mt-6 border-t border-zinc-100 pt-5">
          {loadingSub ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-48 rounded bg-zinc-100" />
              <div className="h-4 w-32 rounded bg-zinc-100" />
            </div>
          ) : !subscription ? (
            <div className="text-xs text-zinc-500">No active subscription found.</div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900">
                    {subscription.planName} ({subscription.billingInterval})
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      subscription.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : subscription.status === 'GRACE_PERIOD'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Subscription ID: {subscription.razorpaySubscriptionId ?? 'None'}
                </p>
              </div>

              {isEligibleForPaymentUpdate ? (
                <button
                  type="button"
                  onClick={handleUpdatePaymentMethod}
                  disabled={replacing || verifying}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50 transition-colors"
                >
                  <CreditCard className="size-4" />
                  {verifying
                    ? 'Verifying Payment Details...'
                    : replacing
                      ? 'Opening Razorpay Checkout...'
                      : 'Update Payment Details'}
                </button>
              ) : (
                <div className="text-xs text-zinc-400 italic">
                  {subscription.planCode === 'FREE'
                    ? 'Payment updates are only applicable to paid plans.'
                    : 'Subscription status does not permit payment method updates.'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center gap-4 text-[11px] text-zinc-400 border-t border-zinc-50 pt-4">
          <div className="flex items-center gap-1">
            <Lock className="size-3" />
            <span>256-bit SSL Provider Encryption</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="size-3" />
            <span>Razorpay PCI-DSS Compliant Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}
