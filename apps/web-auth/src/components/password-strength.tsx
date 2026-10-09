const LEVELS = [
  { label: 'Too short', color: '#ef4444' },
  { label: 'Weak', color: '#f59e0b' },
  { label: 'Fair', color: '#eab308' },
  { label: 'Good', color: '#22c55e' },
  { label: 'Strong', color: '#0f766e' },
] as const;

function scorePassword(password: string): number {
  if (password.length === 0) return -1;
  if (password.length < 8) return 0;

  let score = 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.min(score, LEVELS.length - 1);
}

/** Lightweight client-side strength hint — the 8-char minimum is enforced server-side regardless. */
export function PasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);
  if (score < 0) return null;

  const level = LEVELS[score] ?? LEVELS[0];

  return (
    <div className="mt-1.5" aria-live="polite">
      <div className="flex gap-1">
        {LEVELS.slice(1).map((l, i) => (
          <span
            key={l.label}
            className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{ backgroundColor: i <= score - 1 ? level.color : '#e5e7eb' }}
          />
        ))}
      </div>
      <p className="mt-1 text-[11px] font-medium" style={{ color: level.color }}>
        {level.label}
      </p>
    </div>
  );
}
