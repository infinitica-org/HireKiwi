import type { ReactNode } from 'react';

/** Cancel dashboard main padding so profile workspace sits flush under the navbar. */
export default function ProfileRouteLayout({ children }: { children: ReactNode }) {
  return <div className="profile-neutral-accent min-w-0">{children}</div>;
}
