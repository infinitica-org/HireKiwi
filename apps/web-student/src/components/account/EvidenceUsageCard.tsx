'use client';

import { EVIDENCE_TYPES, EVIDENCE_USAGE } from '@smart/contracts';
import { EvidenceUsageFacts } from '@/components/profile/EvidenceUsageNote';
import { SettingsCard } from './account-ui';

/** S6-VV-114 (#550): every evidence type's use, audience, retention and withdrawal in one place. */
export function EvidenceUsageCard() {
  return (
    <SettingsCard
      title="How your evidence is used"
      description="What each kind of evidence feeds, who sees it, how long it is kept, and how to take it back."
    >
      <div className="space-y-2">
        {EVIDENCE_TYPES.map((type) => (
          <details
            key={type}
            className="rounded-md border border-zinc-200/80 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
          >
            <summary className="cursor-pointer text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {EVIDENCE_USAGE[type].label}
            </summary>
            <EvidenceUsageFacts type={type} />
          </details>
        ))}
      </div>
    </SettingsCard>
  );
}
