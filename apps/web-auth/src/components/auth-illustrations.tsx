/** Lightweight inline SVG illustrations for auth screens — no external image assets. */

export function WelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" className={className} aria-hidden="true">
      <ellipse cx="80" cy="104" rx="56" ry="8" fill="#f0fdf4" />
      <rect x="34" y="34" width="92" height="62" rx="10" fill="#ecfdf5" />
      <rect x="34" y="34" width="92" height="18" rx="10" fill="#0f766e" />
      <circle cx="44" cy="43" r="3" fill="#fff" opacity="0.6" />
      <circle cx="53" cy="43" r="3" fill="#fff" opacity="0.4" />
      <rect x="46" y="62" width="68" height="6" rx="3" fill="#99f6e4" />
      <rect x="46" y="74" width="46" height="6" rx="3" fill="#d1fae5" />
      <circle cx="118" cy="30" r="10" fill="#fef3c7" />
      <path
        d="M113 30l3.2 3.2L123 26"
        stroke="#d97706"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="70" r="7" fill="#dbeafe" />
    </svg>
  );
}

export function StudentIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="#f0fdfa" />
      <path d="M60 36 20 52l40 16 40-16-40-16z" fill="#0f766e" />
      <path
        d="M38 58v16c0 6 9.8 12 22 12s22-6 22-12V58"
        stroke="#0f766e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M100 52v18" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="74" r="3" fill="#0f766e" />
    </svg>
  );
}

export function CompanyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="#eef2ff" />
      <rect x="34" y="50" width="52" height="34" rx="4" fill="#312e81" />
      <rect x="48" y="40" width="24" height="12" rx="2" fill="#4338ca" />
      <rect x="55" y="62" width="10" height="22" rx="1.5" fill="#eef2ff" />
      <rect x="40" y="58" width="8" height="8" rx="1" fill="#818cf8" />
      <rect x="72" y="58" width="8" height="8" rx="1" fill="#818cf8" />
    </svg>
  );
}
