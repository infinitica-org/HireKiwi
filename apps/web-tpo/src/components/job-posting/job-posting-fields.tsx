import { inputClass, labelClass } from '../../lib/tpo-ui';
import { labelFor } from '../../lib/job-posting';

function fieldId(label: string) {
  return `job-posting-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

export function JobPostingTextField({
  label,
  value,
  onChange,
  type,
  min,
  max,
  step,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: string | number;
  required?: boolean;
  placeholder?: string;
}) {
  const id = fieldId(label);
  return (
    <label className="grid gap-1.5" htmlFor={id}>
      <span className={labelClass}>
        {label}
        {required ? (
          <span className="text-[var(--ds-coral)]" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      <input
        id={id}
        aria-label={label}
        className={inputClass}
        type={type}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}

export function JobPostingSelectField({
  label,
  value,
  onChange,
  options,
  emptyLabel,
  optionLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  emptyLabel?: string;
  optionLabel?: (value: string) => string;
}) {
  const id = fieldId(label);
  const formatOption = optionLabel ?? labelFor;
  return (
    <label className="grid gap-1.5" htmlFor={id}>
      <span className={labelClass}>{label}</span>
      <select
        id={id}
        aria-label={label}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {emptyLabel ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function JobPostingTextArea({
  label,
  value,
  onChange,
  required,
  placeholder,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  const id = fieldId(label);
  return (
    <label className="grid gap-1.5" htmlFor={id}>
      <span className={labelClass}>
        {label}
        {required ? (
          <span className="text-[var(--ds-coral)]" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      <textarea
        id={id}
        aria-label={label}
        className={`${inputClass} min-h-[120px] resize-y py-3`}
        rows={rows}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}
