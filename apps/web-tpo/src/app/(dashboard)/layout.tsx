import type { ReactNode } from 'react';
import { TpoShell } from '../../components/tpo-shell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <TpoShell>
      <div className="tpo-bento-theme min-h-full w-full bg-white bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(225,255,160,0.4)_0%,rgba(180,248,220,0.25)_45%,rgba(255,255,255,0)_80%)] text-[var(--ds-text)]">
        {children}
      </div>
    </TpoShell>
  );
}
