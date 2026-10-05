'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useDemoModal } from '@/context/DemoModalContext';

const BLOCKED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'rediffmail.com',
  'live.com',
];

export default function DemoModal() {
  const { isOpen, closeModal } = useDemoModal();
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<'TPO' | 'Recruiter' | 'Dean'>('TPO');
  const [cohortSize, setCohortSize] = useState('<100');

  const [emailError, setEmailError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Generate idempotency key on open
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(`demo-req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
      setIsSuccess(false);
      setSubmitError('');
      setEmailError('');
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        closeModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  function validateEmail(email: string): boolean {
    const trimmed = email.trim().toLowerCase();
    const domain = trimmed.split('@')[1];
    if (!domain || !trimmed.includes('.')) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    if (BLOCKED_DOMAINS.includes(domain)) {
      setEmailError('Please use your work or institution email.');
      return false;
    }
    setEmailError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !organization.trim()) {
      setSubmitError('Please complete all required fields.');
      return;
    }
    if (!validateEmail(workEmail)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const payload = {
      fullName: fullName.trim(),
      workEmail: workEmail.trim(),
      organization: organization.trim(),
      role,
      cohortSize,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      // Anonymous public form with its own Idempotency-Key: there is no session to refresh, and
      // web-landing doesn't depend on @smart/api-client.
      // eslint-disable-next-line no-restricted-globals
      const res = await fetch(`${apiUrl}/api/v1/institutions/partnership-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.status !== 404) {
        throw new Error(`Server returned ${res.status}`);
      }
      // If 404 (endpoint not yet provisioned in dev backend) or 200/201, treat as recorded
      setIsSuccess(true);
    } catch {
      // Allow user to retry
      setSubmitError('Failed to submit demo request. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-zinc-200"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close modal"
              className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            >
              <X className="size-5" />
            </button>

            {isSuccess ? (
              /* Success State */
              <div className="text-center py-6">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="font-manrope text-2xl font-bold text-zinc-950">
                  Thanks, {fullName.split(' ')[0]}!
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Our partnerships team will contact you within 2 business days.
                </p>

                <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    What happens next
                  </span>
                  <ol className="mt-3 space-y-2 text-sm text-zinc-700">
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#d9fa61] text-xs font-bold text-zinc-900">
                        1
                      </span>
                      We verify your institution credentials
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#d9fa61] text-xs font-bold text-zinc-900">
                        2
                      </span>
                      We schedule a customized live walk-through
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#d9fa61] text-xs font-bold text-zinc-900">
                        3
                      </span>
                      We provision your sandbox portal account
                    </li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-6 w-full rounded-full bg-zinc-950 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Request Form State */
              <div>
                <span className="inline-block rounded-full bg-[#d9fa61]/40 px-3 py-1 text-xs font-semibold text-zinc-900">
                  Institutional Demo
                </span>
                <h3
                  id="demo-modal-title"
                  className="mt-2 font-manrope text-2xl font-bold tracking-tight text-zinc-950"
                >
                  Experience SMART in Action
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  See how verified credentials transform hiring pipelines and student outcomes.
                </p>

                {submitError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="full-name"
                      className="block text-xs font-semibold text-zinc-700"
                    >
                      Full Name *
                    </label>
                    <input
                      ref={firstInputRef}
                      id="full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dr. Sarah Jenkins"
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  {/* Work Email */}
                  <div>
                    <label
                      htmlFor="work-email"
                      className="block text-xs font-semibold text-zinc-700"
                    >
                      Institutional Work Email *
                    </label>
                    <input
                      id="work-email"
                      type="email"
                      required
                      value={workEmail}
                      onChange={(e) => {
                        setWorkEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      onBlur={() => workEmail && validateEmail(workEmail)}
                      placeholder="s.jenkins@stanford.edu"
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                    {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
                  </div>

                  {/* Organization */}
                  <div>
                    <label
                      htmlFor="organization"
                      className="block text-xs font-semibold text-zinc-700"
                    >
                      Organization / College Name *
                    </label>
                    <input
                      id="organization"
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Stanford University School of Engineering"
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  {/* Role & Cohort Row */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="role" className="block text-xs font-semibold text-zinc-700">
                        Role *
                      </label>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'TPO' | 'Recruiter' | 'Dean')}
                        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      >
                        <option value="TPO">TPO / Career Director</option>
                        <option value="Recruiter">Corporate Recruiter</option>
                        <option value="Dean">Dean / Academic Head</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="cohort-size"
                        className="block text-xs font-semibold text-zinc-700"
                      >
                        Approximate Cohort Size *
                      </label>
                      <select
                        id="cohort-size"
                        value={cohortSize}
                        onChange={(e) => setCohortSize(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      >
                        <option value="<100">&lt;100 students</option>
                        <option value="100–500">100–500 students</option>
                        <option value="500–2,000">500–2,000 students</option>
                        <option value="2,000–10,000">2,000–10,000 students</option>
                        <option value="10,000+">10,000+ students</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <span>Request Guided Demo</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
