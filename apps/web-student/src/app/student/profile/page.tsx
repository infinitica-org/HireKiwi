'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@hirekiwi/ui';

import { CertificationsSection } from '@/components/profile/CertificationsSection';
import { EducationSection } from '@/components/profile/EducationSection';
import { LanguagesSection } from '@/components/profile/LanguagesSection';
import { ProfessionalLinksSection } from '@/components/profile/ProfessionalLinksSection';
import { ProfileHeroBanner } from '@/components/profile/ProfileHeroBanner';
import { ProfileSectionHeader } from '@/components/profile/ProfileSectionChrome';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileSurface } from '@/components/profile/ProfileSurface';
import { ProjectSubmissionForm } from '@/components/profile/ProjectSubmissionForm';
import { ResumeSection } from '@/components/profile/ResumeSection';
import { SkillsSection } from '@/components/profile/SkillsSection';
import { WorkExperienceSection } from '@/components/profile/WorkExperienceSection';
import { PROFILE_AREA_IDS } from '@/lib/profile-progress';
import { api } from '@/lib/api';
import { useCurrentUser } from '@/lib/candidate-identity';
import { profileSectionMeta, type ProfileSectionId } from '@/lib/profile-sections';
import { useProfileSection } from '@/lib/use-profile-section';
import { useProfileProgress } from '@/lib/use-profile-progress';
import { studentWarningBannerClass } from '@/lib/student-ui-classes';

function ProfilePageFallback() {
  return (
    <div className="min-h-[40vh] px-4 py-10 text-xs text-zinc-400">Loading candidate profile…</div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageFallback />}>
      <ProfileWorkspace />
    </Suspense>
  );
}

function ProfileWorkspace() {
  const { section } = useProfileSection();
  const { data: user } = useCurrentUser();
  const { data: usernameStatus } = useQuery({
    queryKey: ['me', 'username'] as const,
    queryFn: () => api.users.getUsernameStatus(),
  });
  const { data: publicLink } = useQuery({
    queryKey: ['me', 'public-profile-link'] as const,
    queryFn: () => api.users.getPublicProfileLink(),
  });
  const { loading, error, progress, input, linkedinVerified, githubVerified } =
    useProfileProgress();

  const completedCount = progress
    ? PROFILE_AREA_IDS.filter((id) => progress.areaStatus[id]).length
    : null;

  const meta = profileSectionMeta(section);

  const sectionContent =
    section === 'profile' ? (
      <ProfileHeroBanner
        user={user}
        education={input?.education ?? []}
        linkedinVerified={linkedinVerified}
        githubVerified={githubVerified}
        percent={progress?.percent ?? null}
        completedCount={completedCount}
        areaStatus={progress?.areaStatus}
        loading={loading}
        username={usernameStatus?.username ?? null}
        publicLinkUrl={publicLink?.url ?? null}
      />
    ) : (
      renderSection(section)
    );

  return (
    <div className="grid w-full gap-5 pb-16 font-sans select-none lg:grid-cols-[240px_minmax(0,1fr)]">
      <ProfileSidebar
        activeSection={section}
        user={user}
        username={usernameStatus?.username ?? null}
        publicLinkUrl={publicLink?.url ?? null}
        percent={progress?.percent ?? null}
      />

      <div className="min-w-0">
        <nav aria-label="Breadcrumb" data-testid="profile-breadcrumbs" className="mb-3">
          <ol className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <li>
              <Link
                href="/student/profile?section=profile"
                className="hover:text-zinc-950 dark:hover:text-white"
              >
                My profile
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3" />
            </li>
            <li aria-current="page" className="font-medium text-zinc-950 dark:text-white">
              {meta.label}
            </li>
          </ol>
        </nav>
        {section === 'profile' ? (
          <div className="mb-5">
            <ProfileSectionHeader title={meta.title} description={meta.description} />
          </div>
        ) : null}
        {error ? <p className={`mt-4 ${studentWarningBannerClass}`}>{error}</p> : null}

        {/* Active Section Content */}
        <div className="min-w-0 max-w-none">
          {section === 'profile' ||
          section === 'experience' ||
          section === 'projects' ||
          section === 'education' ||
          section === 'certifications' ||
          section === 'languages' ||
          section === 'skills' ||
          section === 'links' ||
          section === 'resume' ? (
            sectionContent
          ) : (
            <div className="max-w-3xl">
              <ProfileSurface>{sectionContent}</ProfileSurface>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderSection(section: ProfileSectionId) {
  switch (section) {
    case 'experience':
      return <WorkExperienceSection />;
    case 'projects':
      return <ProjectSubmissionForm />;
    case 'education':
      return <EducationSection />;
    case 'certifications':
      return <CertificationsSection />;
    case 'languages':
      return <LanguagesSection />;
    case 'skills':
      return <SkillsSection />;
    case 'links':
      return <ProfessionalLinksSection />;
    case 'resume':
      return <ResumeSection />;
    default:
      return <WorkExperienceSection />;
  }
}
