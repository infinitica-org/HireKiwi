import type { ReactNode } from 'react';
import { AuthSplitShell } from '../../components/auth-split-shell';

const authFontClass =
  'font-[family-name:var(--auth-font-sans,-apple-system,BlinkMacSystemFont,"Segoe_UI",sans-serif)]';

export function LoginShell({ children }: { children: ReactNode }) {
  return (
    <AuthSplitShell>
      <div
        className={`flex min-h-dvh w-full flex-1 items-center justify-center p-4 text-[#172033] ${authFontClass}`}
      >
        <div className="relative flex min-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col items-center justify-center px-2 py-6">
          {children}
        </div>
      </div>
    </AuthSplitShell>
  );
}

export function LoginLoadingState() {
  return (
    <LoginShell>
      <div
        className="flex w-full max-w-[420px] flex-col items-center gap-4 text-center"
        role="status"
        aria-live="polite"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#172033]/15 border-t-[#172033]" />
        <p className="text-sm text-[#64748b]">Preparing sign-in…</p>
      </div>
    </LoginShell>
  );
}
