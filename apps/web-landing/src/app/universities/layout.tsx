import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

// The page is a client component, so its metadata lives in this server layout.
export const metadata = pageMetadata('universities');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
