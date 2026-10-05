'use client';

import { useRouter } from 'next/navigation';
import { NotificationsMenu as SharedNotificationsMenu } from '@smart/ui';

/** Student top-bar bell — the shared menu with in-app (Next) navigation. */
export function NotificationsMenu() {
  const router = useRouter();
  return (
    <SharedNotificationsMenu
      onNavigate={(path) => router.push(path)}
      emptyHint="Updates on applications, verifications and messages show up here."
    />
  );
}
