import type { ReactNode } from 'react';

export const EDUCATION_MODAL_FIELD =
  'h-11 w-full min-w-0 rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3.5 text-sm text-[var(--ds-text)] shadow-sm placeholder:text-[var(--ds-text-subtle)] focus:border-[var(--ds-green)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-green-soft)]';

/** Prominent score entry — full width, easy to read while typing. */
export const EDUCATION_MODAL_SCORE_INPUT =
  'h-12 w-full min-w-[8rem] rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] px-4 text-lg font-semibold tabular-nums tracking-tight text-[var(--ds-text)] shadow-sm placeholder:text-[var(--ds-text-subtle)] placeholder:font-normal placeholder:text-base focus:border-[var(--ds-green)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-green-soft)]';

export function EducationFormField({
  id,
  label,
  required,
  optional,
  helper,
  children,
  className,
  error,
}: {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  children: ReactNode;
  className?: string;
  /** A friendly message; the box is outlined in red and the message shows under it. */
  error?: string;
}) {
  return (
    <div
      className={`${className ?? ''} ${
        error
          ? '[&_button]:!border-red-500 [&_button]:!ring-2 [&_button]:!ring-red-100 [&_input]:!border-red-500 [&_input]:!ring-2 [&_input]:!ring-red-100'
          : ''
      }`}
    >
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-[var(--ds-text)]">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
        {optional ? (
          <span className="font-normal text-[var(--ds-text-muted)]"> (Optional)</span>
        ) : null}
      </label>
      {helper ? (
        <p className="mb-1.5 text-[12px] leading-snug text-[var(--ds-text-muted)]">{helper}</p>
      ) : null}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
