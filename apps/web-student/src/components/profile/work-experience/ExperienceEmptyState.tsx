'use client';

import { Briefcase, CheckCircle2, Loader2, Plus } from 'lucide-react';

import { ProfileBentoEmptyPanel } from '@/components/profile/ProfileSectionChrome';
import {
  profilePrimaryButtonSmClass,
  profileSecondaryButtonSmClass,
} from '@/lib/profile-ui-classes';

export interface ExperienceEmptyStateProps {
  onAdd: () => void;
  onDeclareNoExperience?: () => void;
  onChangeDeclaration?: () => void;
  isDeclaring?: boolean;
  hasDeclaredNoExperience?: boolean;
}

export function ExperienceEmptyState({
  onAdd,
  onDeclareNoExperience,
  onChangeDeclaration,
  isDeclaring = false,
  hasDeclaredNoExperience = false,
}: ExperienceEmptyStateProps) {
  if (hasDeclaredNoExperience) {
    return (
      <ProfileBentoEmptyPanel
        emptyIcon={CheckCircle2}
        emptyTitle="No work experience"
        emptyBody="You've indicated that you don't currently have any work experience."
        actions={
          <>
            <button
              type="button"
              onClick={onAdd}
              className={`${profilePrimaryButtonSmClass} justify-center px-5 py-2.5 text-[13px]`}
            >
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              Add experience
            </button>
            {onChangeDeclaration ? (
              <button
                type="button"
                onClick={onChangeDeclaration}
                disabled={isDeclaring}
                className={`${profileSecondaryButtonSmClass} justify-center px-5 py-2.5 text-[13px] disabled:opacity-50`}
              >
                {isDeclaring ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Change declaration
              </button>
            ) : null}
          </>
        }
      />
    );
  }

  return (
    <ProfileBentoEmptyPanel
      emptyIcon={Briefcase}
      emptyTitle="No work experience yet"
      emptyBody="When you add a role, it appears here with duration, documents, and verification progress."
      actions={
        <>
          <button
            type="button"
            onClick={onAdd}
            className={`${profilePrimaryButtonSmClass} justify-center px-5 py-2.5 text-[13px]`}
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Add experience
          </button>
          {onDeclareNoExperience ? (
            <button
              type="button"
              onClick={onDeclareNoExperience}
              disabled={isDeclaring}
              className={`${profileSecondaryButtonSmClass} justify-center px-5 py-2.5 text-[13px] disabled:opacity-50`}
            >
              {isDeclaring ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}I don't
              have work experience
            </button>
          ) : null}
        </>
      }
    />
  );
}
