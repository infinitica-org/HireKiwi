'use client';

import { Languages, Pencil, Trash2 } from 'lucide-react';
import type { CandidateLanguageDto } from '@hirekiwi/contracts';

import { proficiencyTier } from '@/lib/language-entry-presenters';
import {
  EntryBadge,
  EntryCard,
  EntryHeader,
  EntryIconButton,
  EntryIconTile,
  type EntryTone,
} from './entry-card-ui';

interface LanguageEntryCardProps {
  entry: CandidateLanguageDto;
  accentIndex?: number;
  onEdit: () => void;
  onDelete: () => void;
}

/** Quiet colour by how strong the language is; the words carry the meaning, not the colour. */
const TONE_BY_TIER: Record<number, EntryTone> = {
  1: 'neutral',
  2: 'neutral',
  3: 'info',
  4: 'success',
  5: 'success',
};

export function LanguageEntryCard({ entry, onEdit, onDelete }: LanguageEntryCardProps) {
  const tone = TONE_BY_TIER[proficiencyTier(entry.proficiency)] ?? 'neutral';

  return (
    <EntryCard>
      <div className="pb-1">
        <EntryHeader
          leading={<EntryIconTile icon={Languages} />}
          title={entry.language}
          badges={<EntryBadge tone={tone}>{entry.proficiency}</EntryBadge>}
          actions={
            <>
              <EntryIconButton label={`Edit ${entry.language}`} onClick={onEdit}>
                <Pencil className="size-4" strokeWidth={1.75} />
              </EntryIconButton>
              <EntryIconButton label={`Delete ${entry.language}`} onClick={onDelete} danger>
                <Trash2 className="size-4" strokeWidth={1.75} />
              </EntryIconButton>
            </>
          }
        />
      </div>
    </EntryCard>
  );
}
