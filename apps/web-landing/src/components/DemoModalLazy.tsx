'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useDemoModal } from '@/context/DemoModalContext';

const DemoModal = dynamic(() => import('@/components/DemoModal'), { ssr: false });

/**
 * Keeps the demo modal out of the initial bundle: its chunk is fetched on the
 * first "Book Demo" click, then it stays mounted so close/open animate as before.
 */
export default function DemoModalLazy() {
  const { isOpen } = useDemoModal();
  const [hasOpened, setHasOpened] = useState(false);
  if (isOpen && !hasOpened) setHasOpened(true);
  return hasOpened ? <DemoModal /> : null;
}
