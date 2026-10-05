'use client';

import { Briefcase, Plus } from 'lucide-react';

import { ProfileBentoEmptyPanel } from '@/components/profile/ProfileSectionChrome';
import { profilePrimaryButtonSmClass } from '@/lib/profile-ui-classes';

interface ExperienceEmptyStateProps {
  onAdd: () => void;
}

export function ExperienceEmptyState({ onAdd }: ExperienceEmptyStateProps) {
  return (
    <ProfileBentoEmptyPanel
      emptyIcon={Briefcase}
      emptyTitle="No work experience yet"
      emptyBody="When you add a role, it appears here with duration, documents, and verification progress."
      actions={
        <button
          type="button"
          onClick={onAdd}
          className={`${profilePrimaryButtonSmClass} justify-center px-5 py-2.5 text-[13px]`}
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          Add Experience
        </button>
      }
    />
  );
}
