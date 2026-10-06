'use client';

import { Suspense } from 'react';
import { useQuery } from '@hirekiwi/ui';

import { CertificatesSection } from '@/components/profile/CertificatesSection';
import { CredentialsSection } from '@/components/profile/CredentialsSection';
import { EducationSection } from '@/components/profile/EducationSection';
import { LanguagesSection } from '@/components/profile/LanguagesSection';
import { ProfessionalLinksSection } from '@/components/profile/ProfessionalLinksSection';
import { ProfileHeroBanner } from '@/components/profile/ProfileHeroBanner';
import { ProfileTopNav } from '@/components/profile/ProfileTopNav';
import { ProfileSurface } from '@/components/profile/ProfileSurface';
import { ProjectSubmissionForm } from '@/components/profile/ProjectSubmissionForm';
import { ResumeSection } from '@/components/profile/ResumeSection';
import { SkillsSection } from '@/components/profile/SkillsSection';
import { WorkExperienceSection } from '@/components/profile/WorkExperienceSection';
import { api } from '@/lib/api';
import { useCurrentUser } from '@/lib/candidate-identity';
import { PROFILE_AREA_IDS } from '@/lib/profile-progress';
import { type ProfileSectionId } from '@/lib/profile-sections';
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
  const { section, setSection } = useProfileSection();
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

  const sectionContent = renderSection(section);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-2 sm:px-4 md:px-6 py-6 pb-16 font-sans select-none">
      {/* SaaS Profile Identity & Readiness Hero Banner */}
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

      <ProfileTopNav activeSection={section} onSelect={setSection} />

      {error ? <p className={`mt-4 ${studentWarningBannerClass}`}>{error}</p> : null}

      {/* Active Section Content */}
      <div className="min-w-0 max-w-none">
        {section === 'experience' ||
        section === 'projects' ||
        section === 'education' ||
        section === 'certifications' ||
        section === 'credentials' ||
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
      return <CertificatesSection />;
    case 'credentials':
      return <CredentialsSection />;
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
