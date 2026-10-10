import { env } from '../config/env.js';

export type EmailTone = 'brand' | 'success' | 'warning' | 'danger' | 'info';
export type EmailBadgeTone = 'success' | 'warning' | 'danger' | 'info';

// A small, consistent illustration system: one line-icon per email "type",
// tinted with the same tone used for that template's status badge (where it
// has one) so the icon and the badge always agree with each other.
export type EmailIconName =
  'briefcase' | 'sparkles' | 'bell' | 'star' | 'trendingUp' | 'checkCircle' | 'refresh' | 'lock';

export interface EmailLayoutOptions {
  readonly previewText: string;
  readonly heading: string;
  readonly bodyHtml: string;
  readonly cta?: { readonly label: string; readonly url: string };
  readonly icon?: { readonly name: EmailIconName; readonly tone: EmailTone };
  /** A larger centered hero graphic for a template's own header; takes priority over `icon` when both are set. */
  readonly illustration?: string;
  readonly badge?: { readonly label: string; readonly tone: EmailBadgeTone };
  readonly footerNote?: string;
  readonly signoff?: string;
}

const BRAND = {
  name: 'HireKiwi',
  supportEmail: 'support@hirekiwi.local',
} as const;

// Brand tokens mirrored from packages/config-tailwind/theme.css so transactional
// email stays visually consistent with the product (single teal accent, warm
// paper canvas, rounded card — see that file's "Soft / minimal" design notes).
const TOKENS = {
  ink: '#18181b',
  paper: '#ffffff',
  line: '#e4e4e7',
  button: '#18181b',
  teal: '#2fbfae',
  lime: '#d4fc58',
  tealDeep: '#0f5c63',
  gray600: '#71717a',
  font: "'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif",
} as const;

const TONE: Record<EmailTone, { fg: string; bg: string }> = {
  brand: { fg: TOKENS.ink, bg: '#f3fed0' },
  success: { fg: '#1f9d55', bg: '#eafaf0' },
  warning: { fg: '#d97706', bg: '#fef6e7' },
  danger: { fg: '#dc2626', bg: '#fdecec' },
  info: { fg: TOKENS.ink, bg: '#f3fed0' },
};

// 24x24 line-icon glyphs (stroke-only, no fill) in a Feather/Lucide style —
// simple enough to hand-author reliably and to stay legible at ~26px.
const ICON_GLYPHS: Record<EmailIconName, string> = {
  briefcase:
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
  sparkles:
    '<path d="M12 3v4M12 17v4M5 12H3m18 0h-2M7.8 7.8 6.3 6.3m11.4 11.4-1.5-1.5M7.8 16.2l-1.5 1.5m11.4-11.4-1.5 1.5"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 4.2 1.5 5.5 1.5 5.5h-15S6 12.2 6 8Z"/><path d="M10 18a2 2 0 0 0 4 0"/>',
  star: '<path d="m12 3 2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1L6.6 19.4l1.3-6L3.3 9.2l6.1-.6L12 3Z" stroke-linejoin="round"/>',
  trendingUp: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 6h6v6"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.5 2.5L16 9"/>',
  refresh:
    '<path d="M21 12a9 9 0 0 1-15.3 6.3M3 12a9 9 0 0 1 15.3-6.3"/><path d="M21 3v6h-6M3 21v-6h6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/>',
};

function iconBadge(icon: { name: EmailIconName; tone: EmailTone }): string {
  const palette = TONE[icon.tone];
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;"><tr>
    <td width="56" height="56" style="width:56px;height:56px;border-radius:12px;background:${palette.bg};text-align:center;vertical-align:middle;">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${palette.fg}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_GLYPHS[icon.name]}</svg>
    </td>
  </tr></table>`;
}

// Header icons: one rounded tile per email type with a single line glyph, the way SaaS product
// emails do it. Lime tile and black glyph by default; status emails use their status colour.
const TILE_GLYPHS = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7.5 8.5 6 8.5-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  clipboard:
    '<rect x="6" y="4" width="12" height="17" rx="2.5"/><path d="M9.5 4h5v2.5h-5zM9 12l2 2 4-4"/>',
  medal:
    '<circle cx="12" cy="9" r="5.5"/><path d="m9 14 -1.5 7 4.5-2.5 4.5 2.5L15 14M12 6.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2L9.1 8.6l2-.3z"/>',
  chart: '<path d="M4 20V10M10 20V5M16 20v-7M22 20H2"/>',
  shield:
    '<path d="M12 3 5 6v6c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2.2 2.200L15.5 10"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V7.500a4 4 0 0 1 8 0V11"/>',
  fileSearch:
    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><circle cx="11" cy="14" r="2.5"/><path d="m13 16 2 2"/>',
} as const;

function iconTile(glyph: keyof typeof TILE_GLYPHS, label: string, tone?: EmailBadgeTone): string {
  const bg = tone ? TONE[tone].bg : '#f3fed0';
  const fg = tone ? TONE[tone].fg : TOKENS.ink;
  return `<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">
  <rect width="56" height="56" rx="14" fill="${bg}"/>
  <g transform="translate(16 16)" fill="none" stroke="${fg}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TILE_GLYPHS[glyph]}</g>
</svg>`;
}

export const WELCOME_ILLUSTRATION = iconTile('mail', 'An envelope');
export const REMINDER_ILLUSTRATION = iconTile('clock', 'A clock');
export const ADMIN_ILLUSTRATION = iconTile('clipboard', 'A checklist');
export const SHORTLISTED_ILLUSTRATION = iconTile('medal', 'A medal');
export const STAGE_CHANGED_ILLUSTRATION = iconTile('chart', 'A progress chart');
export const VERIFICATION_PASSED_ILLUSTRATION = iconTile(
  'shield',
  'A shield with a check',
  'success',
);
export const VERIFICATION_FAILED_ILLUSTRATION = iconTile('target', 'A target', 'danger');
export const VERIFICATION_LOCKED_ILLUSTRATION = iconTile('lock', 'A padlock', 'warning');
export const WORK_EXPERIENCE_ILLUSTRATION = iconTile('fileSearch', 'A document being checked');

function illustrationBlock(svg: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 20px;"><tr>
    <td align="left" style="line-height:0;">${svg}</td>
  </tr></table>`;
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const icon = options.illustration
    ? illustrationBlock(options.illustration)
    : options.icon
      ? iconBadge(options.icon)
      : '';

  const badge = options.badge
    ? `<span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;color:${TONE[options.badge.tone].fg};background:${TONE[options.badge.tone].bg};margin-bottom:16px;">${options.badge.label}</span><br/>`
    : '';

  const ctaBlock = options.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:8px;">
        <tr><td>
          <a href="${options.cta.url}" style="display:inline-block;background:${TOKENS.button};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;line-height:1;padding:14px 24px;border-radius:10px;">${options.cta.label}</a>
        </td></tr>
      </table>`
    : '';

  const footerNote = options.footerNote
    ? `<p style="margin:14px 0 0;color:${TOKENS.gray600};font-size:12.5px;line-height:1.6;">${options.footerNote}</p>`
    : '';

  const signoff = options.signoff
    ? `<p style="margin:22px 0 0;font-size:13.5px;line-height:1.6;color:${TOKENS.gray600};">${options.signoff}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${options.heading}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${TOKENS.paper};font-family:${TOKENS.font};color:${TOKENS.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${options.previewText}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${TOKENS.paper};padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;line-height:0;"><img src="${env.VERIFY_APP_URL}/email/hirekiwi-logo.png" width="36" height="36" alt="HireKiwi" style="display:block;width:36px;height:36px;border-radius:9px;" /></td>
                  <td style="vertical-align:middle;font-size:19px;font-weight:800;letter-spacing:-0.02em;color:${TOKENS.ink};">HireKiwi</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid ${TOKENS.line};border-radius:16px;padding:36px 36px 28px;">
              ${icon}
              ${badge}
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;color:${TOKENS.ink};letter-spacing:-0.01em;">${options.heading}</h1>
              ${options.bodyHtml}
              ${ctaBlock}
              ${footerNote}
              ${signoff}
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:24px 16px 0;">
              <p style="margin:0;color:${TOKENS.gray600};font-size:12px;line-height:1.7;">${BRAND.name} &middot; <a href="mailto:${BRAND.supportEmail}" style="color:${TOKENS.gray600};">${BRAND.supportEmail}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 10px;color:#3f3f46;font-size:15px;line-height:1.65;">${text}</p>`;
}

export function strong(text: string): string {
  return `<strong style="color:${TOKENS.ink};">${text}</strong>`;
}

export function bulletList(items: readonly string[]): string {
  const rows = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px;color:#44403c;font-size:15px;line-height:1.55;">${item}</li>`,
    )
    .join('');
  return `<ul style="margin:0 0 10px;padding-left:20px;">${rows}</ul>`;
}

export function detailRows(rows: readonly (readonly [string, string])[]): string {
  const tr = rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:8px 0;font-size:13px;color:${TOKENS.gray600};">${label}</td>
        <td align="right" style="padding:8px 0;font-size:13px;color:${TOKENS.ink};font-weight:600;">${value}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 24px;border:1px solid ${TOKENS.line};border-radius:12px;padding:6px 16px;">${tr}</table>`;
}
