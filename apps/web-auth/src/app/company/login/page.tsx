import { redirect } from 'next/navigation';

/**
 * /login now handles both student and company identify-first sign-in — this
 * route only exists to keep old links/bookmarks working.
 */
export default function EmployerLoginPage() {
  redirect('/login');
}
