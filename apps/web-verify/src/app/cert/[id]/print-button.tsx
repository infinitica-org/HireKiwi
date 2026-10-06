'use client';

import { Button } from '@hirekiwi/ui';

export function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="print:hidden"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.print();
        }
      }}
    >
      Print / Save PDF
    </Button>
  );
}
