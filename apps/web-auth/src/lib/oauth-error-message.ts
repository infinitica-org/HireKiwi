const MESSAGES: Record<string, string> = {
  google_not_configured: 'Google sign-in is not set up on this environment yet.',
  google_cancelled: 'Google sign-in was cancelled.',
  google_state_expired: 'That Google sign-in link expired. Please try again.',
  google_token_exchange_failed: 'Google sign-in failed. Please try again.',
  google_userinfo_failed: 'Google sign-in failed. Please try again.',
  google_email_unverified: 'That Google account email is not verified.',
  google_role_mismatch: 'This email is registered under a different account type on HireKiwi.',
};

const DEFAULT_MESSAGE = 'Could not complete Google sign-in. Please try again.';

export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? DEFAULT_MESSAGE;
}
