'use client';

import { useEffect, useState } from 'react';

/**
 * True once a Vivi popup that was just asked to open is ready to show real content: it has been
 * "opening" for at least `minMs` (so the placeholder never just flashes) and nothing it needs is
 * still loading.
 */
export function useViviReady(open: boolean, busy = false, minMs = 500): boolean {
  const [minDone, setMinDone] = useState(false);
  useEffect(() => {
    if (!open) {
      setMinDone(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setMinDone(true), minMs);
    return () => window.clearTimeout(timer);
  }, [open, minMs]);
  return open && minDone && !busy;
}
