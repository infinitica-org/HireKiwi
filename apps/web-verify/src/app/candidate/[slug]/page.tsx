'use client';

import { use, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import type { PublicCandidateProfileDto } from '@hirekiwi/contracts';
import { api } from '@/lib/api';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:3005';

/** The public profile is always light, whatever the visitor's theme, like a printed résumé. */
const LIGHT_VARS = {
  '--surface': '#ffffff',
  '--surface-muted': '#ffffff',
  '--surface-border': '#e4e4e7',
  '--text-primary': '#18181b',
  '--text-muted': '#71717a',
} as CSSProperties;

/** web-verify has no icon library dependency — small inline SVGs match its existing pages. */
function Icon({ path, className }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}
const ICON_PATH = {
  graduation: 'M12 14l9-5-9-5-9 5 9 5zm0 0v6m-6-3.5V12',
  checkCircle: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  code: 'M10 20l4-16M6 8l-4 4 4 4M18 8l4 4-4 4',
  briefcase:
    'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-4 6a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2H4a2 2 0 00-2 2v4z',
  folderGit: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
  link: 'M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5',
  externalLink: 'M14 5h5m0 0v5m0-5L10 14M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-5',
  award: 'M12 15a5 5 0 100-10 5 5 0 000 10zm-3.5 3.5L7 22l5-3 5 3-1.5-3.5M8.5 18.5L12 15l3.5 3.5',
  spinner:
    'M12 4V2m0 20v-2m8-8h2M2 12h2m14.14 6.14l1.42 1.42M4.44 4.44l1.42 1.42m0 12.28l-1.42 1.42M19.56 4.44l-1.42 1.42',
  searchX: 'M21 21l-4.35-4.35M10 17a7 7 0 100-14 7 7 0 000 14zM8 8l4 4m0-4l-4 4',
};

const VERIFICATION_METHOD_LABELS: Record<string, string> = {
  ENDORSEMENT: 'Endorsed',
  LLM: 'AI-verified',
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/u).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || '—';
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicCandidateProfilePage({ params }: PageProps) {
  const { slug } = use(params);
  const [profile, setProfile] = useState<PublicCandidateProfileDto | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.public
      .getCandidateProfile(slug)
      .then((res) => {
        if (!cancelled) setProfile(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isHireKiwiApiError(err) && err.statusCode === 404) {
          setNotFound(true);
        } else {
          setError('Could not load this profile right now.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 py-24 text-center">
        <Icon path={ICON_PATH.searchX} className="h-10 w-10 text-[var(--text-muted)]" />
        <h1 className="text-lg font-semibold">No profile at this link</h1>
        <p className="text-sm text-[var(--text-muted)]">
          This share link doesn&apos;t match a HireKiwi candidate profile. Double-check the link
          with whoever sent it to you.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center text-sm text-[var(--text-muted)]">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-[var(--text-muted)]">
        <Icon path={ICON_PATH.spinner} className="h-4 w-4 animate-spin" /> Loading profile…
      </div>
    );
  }

  const trackLabel = [profile.trackCategory === 'MBA' ? 'MBA' : null, profile.trackName]
    .filter(Boolean)
    .join(' · ');
  const headline = profile.headline ?? (trackLabel ? `${trackLabel} candidate` : null);
  const decodedSlug = decodeURIComponent(slug);
  const handle = decodedSlug.startsWith('@') ? decodedSlug : null;
  const verified = profile.skills.some((skill) => !skill.inProgress);

  // Professional links and connected accounts as one row of icons, each opening its profile page.
  const socialLabels: Record<string, string> = {
    github: 'GitHub',
    linkedin: 'LinkedIn',
    leetcode: 'LeetCode',
    hackerrank: 'HackerRank',
  };
  const socials: { key: string; label: string; url: string }[] = [];
  const addSocial = (key: string, url: string | null) => {
    if (!url || socials.some((item) => item.key === key)) return;
    socials.push({ key, label: socialLabels[key] ?? key, url });
  };
  for (const link of profile.links) addSocial(link.kind, link.url);
  for (const item of profile.integrations) addSocial(item.sourceId.toLowerCase(), item.url);

  const counts: [string, number][] = [
    ['Skills', profile.skills.length],
    ['Projects', profile.projects.length],
    ['Certificates', profile.externalCertificates.length],
    ['Experience', profile.workExperience.length],
  ];
  const isEmpty =
    profile.skills.length === 0 &&
    profile.workExperience.length === 0 &&
    profile.education.length === 0 &&
    profile.projects.length === 0 &&
    profile.externalCertificates.length === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white text-zinc-900" style={LIGHT_VARS}>
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/email/hirekiwi-logo.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8  "
            />
            <span className="text-[17px] font-bold tracking-tight text-zinc-950">HireKiwi</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${AUTH_URL}/login`}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Sign in
            </a>
            <a
              href={`${AUTH_URL}/register`}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Create account
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 pb-20 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Left: who this is. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="h-28 w-28 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 shadow-sm">
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={profile.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-700">
                {initialsOf(profile.fullName)}
              </div>
            )}
          </div>

          <h1 className="mt-5 flex items-center gap-2 text-3xl font-bold tracking-tight text-zinc-950">
            {profile.fullName}
            {verified ? (
              <span title="Verified on HireKiwi" className="shrink-0 text-emerald-600">
                <Icon path={ICON_PATH.checkCircle} className="h-6 w-6" />
              </span>
            ) : null}
          </h1>
          {handle ? <p className="mt-1 text-sm text-zinc-500">{handle}</p> : null}
          {headline ? (
            <p className="mt-4 text-[15px] leading-relaxed text-zinc-800">“{headline}”</p>
          ) : null}

          <dl className="mt-6 grid grid-cols-2 gap-2.5">
            {counts.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-zinc-200 px-3.5 py-3">
                <dd className="text-xl font-semibold text-zinc-950">{value}</dd>
                <dt className="text-[13px] text-zinc-500">{label}</dt>
              </div>
            ))}
          </dl>

          {socials.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-0.5">
              {socials.map((item) => (
                <a
                  key={item.key}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${item.label} profile`}
                  title={item.label}
                  className="flex h-14 w-14 items-center justify-center rounded-full border "
                >
                  <SocialMark kind={item.key} />
                </a>
              ))}
            </div>
          ) : null}

          {profile.languages.length > 0 ? (
            <div className="mt-7">
              <h2 className="text-sm font-semibold text-zinc-950">Languages</h2>
              <ul className="mt-3 space-y-2">
                {profile.languages.map((entry, idx) => (
                  <li
                    key={`${entry.language}-${String(idx)}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-medium text-zinc-900">{entry.language}</span>
                    <span className="text-zinc-500">{entry.proficiency}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        {/* Right: everything on the profile, one section after another. */}
        <main className="min-w-0 space-y-10">
          {isEmpty ? (
            <p className="rounded-xl border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-500">
              This candidate has not added any details yet.
            </p>
          ) : null}

          {profile.skills.length > 0 ? (
            <Section
              title="Skills"
              hint="Verified skills are marked; the rest are still being verified."
            >
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <SkillChip
                    key={skill.skillCode}
                    name={skill.skillName}
                    level={skill.proficiency}
                    inProgress={skill.inProgress}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {profile.workExperience.length > 0 ? (
            <Section title="Experience">
              <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
                {profile.workExperience.map((entry, idx) => (
                  <li
                    key={`${entry.companyName}-${String(idx)}`}
                    className="flex items-start gap-3.5 p-4"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                      <Icon path={ICON_PATH.briefcase} className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-zinc-950">
                        {entry.role} · {entry.companyName}
                        {entry.inProgress ? <InProgress /> : null}
                      </p>
                      <p className="mt-0.5 text-[13px] text-zinc-500">
                        {EMPLOYMENT_TYPE_LABELS[entry.employmentType] ?? entry.employmentType}
                        {' · '}
                        {formatDate(entry.startDate)} –{' '}
                        {entry.isCurrent
                          ? 'Present'
                          : entry.endDate
                            ? formatDate(entry.endDate)
                            : '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {profile.education.length > 0 ? (
            <Section title="Education">
              <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
                {profile.education.map((entry, idx) => (
                  <li
                    key={`${entry.institutionName}-${String(idx)}`}
                    className="flex items-start gap-3.5 p-4"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                      <Icon path={ICON_PATH.graduation} className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-950">{entry.institutionName}</p>
                      <p className="mt-0.5 text-[13px] text-zinc-500">
                        {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {profile.projects.length > 0 ? (
            <Section title="Projects">
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.projects.map((project) => (
                  <article
                    key={project.projectId}
                    className="flex flex-col rounded-xl border border-zinc-200 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-zinc-950">{project.title}</h3>
                      {project.status === 'VERIFIED' ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <Icon path={ICON_PATH.checkCircle} className="h-3.5 w-3.5" />
                          {project.score !== null
                            ? `Verified · ${String(Math.round(project.score))}/100`
                            : 'Verified'}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600">
                      {project.outcome}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.stack
                        .split(',')
                        .map((tech) => tech.trim())
                        .filter(Boolean)
                        .map((tech) => (
                          <span
                            key={tech}
                            className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
                          >
                            {tech}
                          </span>
                        ))}
                    </div>
                    {project.githubUrl || project.liveUrl ? (
                      <div className="mt-4 flex items-center gap-4 border-t border-zinc-100 pt-3 text-[13px] font-medium">
                        {project.githubUrl ? (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-950"
                          >
                            <Icon path={ICON_PATH.link} className="h-4 w-4" />
                            Code
                          </a>
                        ) : null}
                        {project.liveUrl ? (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-950"
                          >
                            <Icon path={ICON_PATH.externalLink} className="h-4 w-4" />
                            Live demo
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </Section>
          ) : null}

          {profile.externalCertificates.length > 0 ? (
            <Section title="Certificates">
              <ul className="space-y-3">
                {profile.externalCertificates.map((cert, idx) => (
                  <li
                    key={`${cert.title}-${String(idx)}`}
                    className="rounded-xl border border-zinc-200 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon path={ICON_PATH.award} className="h-4 w-4 text-zinc-500" />
                      <p className="font-semibold text-zinc-950">{cert.title}</p>
                      {cert.verificationMethod ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <Icon path={ICON_PATH.checkCircle} className="h-3.5 w-3.5" />
                          {VERIFICATION_METHOD_LABELS[cert.verificationMethod] ??
                            cert.verificationMethod}
                        </span>
                      ) : null}
                      {cert.inProgress ? <InProgress /> : null}
                    </div>
                    <p className="mt-0.5 text-[13px] text-zinc-500">{cert.issuer}</p>
                    {cert.skills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cert.skills.map((skill) => (
                          <SkillChip
                            key={skill.skillName}
                            name={skill.skillName}
                            level={skill.proficiency}
                          />
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-zinc-950">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-zinc-500">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InProgress() {
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
      In progress
    </span>
  );
}

function SkillChip({
  name,
  level,
  inProgress = false,
}: {
  name: string;
  level: string;
  inProgress?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm">
      <span className="font-medium text-zinc-900">{name}</span>
      <span className="h-3 w-px bg-zinc-200" />
      <span className="text-xs font-semibold text-emerald-700">
        {level.charAt(0) + level.slice(1).toLowerCase()}
      </span>
      {inProgress ? <InProgress /> : null}
    </span>
  );
}

/** Brand marks as plain filled SVGs; web-verify has no icon library. */
function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function LinkedinMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

/** The brand marks for one connected service; LeetCode and HackerRank keep their own colours. */
function SocialMark({ kind }: { kind: string }) {
  if (kind === 'github') return <GithubMark />;
  if (kind === 'linkedin') return <LinkedinMark />;
  if (kind === 'leetcode') {
    return (
      <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" aria-hidden>
        <path
          d="M36.6667 23.923C36.6667 22.6864 35.7267 21.6797 34.5667 21.6797H17.7934C16.6334 21.6797 15.6934 22.6864 15.6934 23.923C15.6934 25.1597 16.6317 26.1664 17.7934 26.1664H34.5667C35.7267 26.168 36.6667 25.1614 36.6667 23.923Z"
          fill="#B3B1B0"
        />
        <path
          d="M5.80331 30.3094L12.9916 37.5777C14.6133 39.2094 16.855 39.9977 19.33 39.9977C21.805 39.9977 24.0466 39.1444 25.6716 37.5077L29.985 33.1127C30.835 32.2561 30.805 30.8377 29.92 29.9461C29.035 29.0544 27.6283 29.0244 26.78 29.8811L22.32 34.2261C21.55 35.0044 20.4833 35.3294 19.305 35.3294C18.1266 35.3294 17.0616 35.0044 16.2883 34.2261L9.12498 26.9544C8.35331 26.1761 7.96498 25.0377 7.96498 23.8494C7.96498 22.6611 8.35331 21.5877 9.12498 20.8094L16.2666 13.5094C17.0383 12.7311 18.1266 12.4344 19.3033 12.4344C20.48 12.4344 21.5466 12.7594 22.3183 13.5377L26.7783 17.8811C27.6283 18.7394 29.035 18.7094 29.92 17.8177C30.805 16.9244 30.835 15.5061 29.985 14.6494L25.6716 10.2561C24.5751 9.16036 23.1944 8.39264 21.685 8.03941L21.6283 8.02774L25.7066 3.85608C26.56 2.99941 26.53 1.57941 25.645 0.687742C24.76 -0.203924 23.3516 -0.232258 22.5 0.624409L5.80331 17.4577C4.18165 19.0944 3.33331 21.3527 3.33331 23.8494C3.33331 26.3461 4.18165 28.6761 5.80331 30.3094Z"
          fill="#E7A41F"
        />
        <path
          d="M13.525 38.0222C13.2345 37.86 12.9686 37.6574 12.735 37.4205C10.5234 35.1988 8.30169 32.9872 6.09502 30.7588C2.78002 27.4122 2.25836 22.5305 4.78502 18.5588C5.18874 17.9517 5.65764 17.3906 6.18336 16.8855L22.2217 0.813824C23.2634 -0.229509 24.7184 -0.272842 25.6867 0.702157C26.62 1.64049 26.565 3.12716 25.5567 4.14549C24.275 5.43882 22.9917 6.72882 21.7084 8.02049C21.64 8.22382 21.475 8.35382 21.3334 8.49882C19.895 9.95882 18.4167 11.3805 16.9984 12.8622C16.8134 13.0555 16.5617 13.1722 16.3784 13.3705C14.0067 15.7422 11.6067 18.0872 9.26836 20.4905C7.37669 22.4355 7.44002 25.3872 9.38169 27.3688C11.5617 29.5955 13.78 31.7855 15.9834 33.9922C16.095 34.1038 16.21 34.2122 16.3234 34.3222C17.1034 34.8272 17.1134 36.4055 16.6284 37.1072C16.0934 37.8822 15.395 38.3572 14.4067 38.3205C14.075 38.3105 13.8017 38.1772 13.525 38.0222Z"
          fill="#070706"
        />
      </svg>
    );
  }
  if (kind === 'hackerrank') {
    return (
      <svg viewBox="0 0 37 40" className="h-8 w-8" fill="none" aria-hidden>
        <path
          d="M18.3317 0C16.0433 0 1.99167 8.03 0.855002 10C-0.281665 11.97 -0.288332 28.0317 0.855002 30C1.99834 31.9683 16.0467 40 18.3317 40C20.6167 40 34.665 31.96 35.81 30C36.9533 28.04 36.9533 11.95 35.81 10C34.665 8.05 20.6183 0 18.3317 0ZM23.0667 32.3583V32.3617C22.7533 32.3617 19.835 29.5667 20.0667 29.3383C20.135 29.27 20.56 29.2233 21.4533 29.195C21.4533 27.145 21.5 23.8367 21.5283 22.4517C21.5317 22.2933 21.4933 22.1833 21.4933 21.995H15.1817C15.1817 22.55 15.145 24.8233 15.29 27.6883C15.3083 28.0433 15.165 28.1533 14.8367 28.1517C14.0367 28.15 13.2367 28.1433 12.4367 28.145C12.1133 28.145 11.9733 28.025 11.9833 27.6683C12.055 25.0567 12.2167 21.105 11.9717 11.0533V10.805C11.205 10.7783 10.675 10.73 10.605 10.6617C10.375 10.4333 13.3333 7.63833 13.645 7.63833C13.9567 7.63833 16.8967 10.4333 16.6667 10.6617C16.5983 10.73 16.0433 10.7783 15.3417 10.805V11.0517C15.1517 13.0633 15.1817 17.27 15.135 19.285H21.4733C21.4733 18.93 21.5033 16.5717 21.3783 12.75C21.37 12.485 21.455 12.3467 21.71 12.3433C22.585 12.3367 23.4583 12.3333 24.335 12.3383C24.6083 12.34 24.695 12.4733 24.69 12.7583C24.4017 27.7033 24.6383 26.66 24.6383 29.1917C25.3383 29.2183 25.9667 29.2667 26.035 29.335C26.2617 29.5617 23.38 32.3583 23.0667 32.3583Z"
          fill="#2FC363"
        />
      </svg>
    );
  }
  return null;
}
