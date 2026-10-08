export interface PasswordRuleContext {
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface PasswordRuleResult {
  id: string;
  label: string;
  met: boolean;
}

/** Only flags a name/phone fragment once it's long enough to not false-positive on short input. */
const MIN_FRAGMENT_LENGTH = 3;

function containsFragment(password: string, fragment: string | undefined): boolean {
  const clean = (fragment ?? '').trim().toLowerCase();
  if (clean.length < MIN_FRAGMENT_LENGTH) return false;
  return password.toLowerCase().includes(clean);
}

export function evaluatePasswordRules({
  password,
  firstName,
  lastName,
  phoneNumber,
}: PasswordRuleContext): PasswordRuleResult[] {
  return [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'upper', label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { id: 'number', label: 'One number', met: /\d/.test(password) },
    {
      id: 'special',
      label: 'One special character',
      met: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: 'no-name',
      label: "Doesn't contain your name",
      met: !containsFragment(password, firstName) && !containsFragment(password, lastName),
    },
    {
      id: 'no-phone',
      label: "Doesn't contain your phone number",
      met: !containsFragment(password, phoneNumber),
    },
  ];
}

export function PasswordRulesChecklist({ rules }: { rules: PasswordRuleResult[] }) {
  return (
    <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2" aria-live="polite">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${rule.met ? 'text-[#0f766e]' : 'text-[#9ca3af]'}`}
        >
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
            {rule.met ? (
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <circle cx="12" cy="12" r="3.5" fill="currentColor" />
            )}
          </svg>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
