'use client';

import { useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Briefcase, FolderGit2, GraduationCap, Sparkles, X } from 'lucide-react';
import type { EmployerApplicantDetail } from '@hirekiwi/contracts';
import { api } from '../lib/api';
import { MessageApplicantButton } from './message-applicant-button';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')).toUpperCase() ||
    '?'
  );
}

function level(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function span(start: string | null, end: string | null, current: boolean): string {
  const from = start ? start.slice(0, 7) : '';
  const to = current ? 'Present' : end ? end.slice(0, 7) : '';
  return [from, to].filter(Boolean).join(' – ');
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Award;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-950 dark:text-white">
        <Icon className="size-4 text-zinc-400" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Detail({ detail }: { detail: EmployerApplicantDetail }) {
  const { profile } = detail;
  const hidden = new Set(profile.hiddenSections);
  const show = (section: string, count: number) => !hidden.has(section) && count > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {detail.photoUrl ? (
          // Signed storage URL; not routed through next/image.
          <img
            src={detail.photoUrl}
            alt=""
            className="size-16 shrink-0 rounded-full border border-zinc-200 object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-lg font-semibold text-white dark:bg-white dark:text-zinc-900"
          >
            {initials(profile.fullName)}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-heading text-xl font-bold">{profile.fullName}</h2>
          <p className="text-sm text-zinc-500">
            Applied for {detail.roleTitle}
            {profile.trackName ? ` · ${profile.trackName}` : ''}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-zinc-200 px-2 py-0.5 font-semibold dark:border-zinc-700">
              {detail.statusLabel}
            </span>
            {detail.fit ? (
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {detail.fit.matchPercent}% match
              </span>
            ) : null}
            <span className="text-zinc-500">
              {new Date(detail.appliedAt).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <MessageApplicantButton
        applicationId={detail.applicationId}
        candidateName={profile.fullName}
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      />

      {detail.fit?.topReason ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {detail.fit.topReason}
        </p>
      ) : null}

      {detail.coverNote ? (
        <Section icon={Sparkles} title="Note from the candidate">
          <p className="text-sm leading-relaxed whitespace-pre-line">{detail.coverNote}</p>
        </Section>
      ) : null}

      {show('skills', profile.skills.length) ? (
        <Section icon={Sparkles} title="Verified skills">
          <ul className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <li
                key={skill.skillCode}
                className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium dark:bg-zinc-800"
              >
                {skill.skillName} · {level(skill.proficiency)}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {show('education', profile.education.length) ? (
        <Section icon={GraduationCap} title="Education">
          <ul className="space-y-3">
            {profile.education.map((item, index) => (
              <li key={`${item.institutionName}-${String(index)}`} className="text-sm">
                <p className="font-semibold">{item.institutionName}</p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {[item.degree, item.fieldOfStudy].filter(Boolean).join(', ')}
                </p>
                <p className="text-xs text-zinc-500">
                  {[span(item.startDate, item.endDate, item.current), item.grade]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {show('workExperience', profile.workExperience.length) ? (
        <Section icon={Briefcase} title="Work experience">
          <ul className="space-y-3">
            {profile.workExperience.map((item, index) => (
              <li key={`${item.companyName}-${String(index)}`} className="text-sm">
                <p className="font-semibold">
                  {item.role} · {item.companyName}
                </p>
                <p className="text-xs text-zinc-500">
                  {span(item.startDate, item.endDate, item.isCurrent)}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {show('projects', profile.projects.length) ? (
        <Section icon={FolderGit2} title="Projects">
          <ul className="space-y-3">
            {profile.projects.map((project) => (
              <li key={project.projectId} className="text-sm">
                <p className="font-semibold">{project.title}</p>
                {project.outcome ? (
                  <p className="text-zinc-600 dark:text-zinc-400">{project.outcome}</p>
                ) : null}
                {project.stack ? <p className="text-xs text-zinc-500">{project.stack}</p> : null}
                <p className="mt-1 flex flex-wrap gap-3 text-xs font-semibold">
                  {project.githubUrl ? (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      Code
                    </a>
                  ) : null}
                  {project.liveUrl ? (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      Live
                    </a>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {profile.certificate || show('certificates', profile.externalCertificates.length) ? (
        <Section icon={Award} title="Certificates">
          <ul className="space-y-2 text-sm">
            {profile.certificate ? (
              <li>
                <span className="font-semibold">{profile.certificate.trackName}</span>
                <span className="text-zinc-500"> · {level(profile.certificate.tier)}</span>
              </li>
            ) : null}
            {profile.externalCertificates.map((cert, index) => (
              <li key={`${cert.title}-${String(index)}`}>
                <span className="font-semibold">{cert.title}</span>
                <span className="text-zinc-500"> · {cert.issuer}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

/** Slide-over with everything the candidate confirmed when they applied. */
export function ApplicantDetailDrawer({
  applicationId,
  onClose,
}: {
  applicationId: string;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ['employer', 'applicant', applicationId] as const,
    queryFn: () => api.employer.applicantDetail(applicationId),
    retry: false,
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs">
      <button
        type="button"
        aria-label="Close applicant details"
        className="flex-1"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Applicant details"
        className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl dark:bg-[#161616]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <X className="size-5" />
        </button>
        {query.isPending ? (
          <p className="py-16 text-center text-sm text-zinc-500">Loading applicant…</p>
        ) : query.isError ? (
          <div className="py-16 text-center text-sm text-zinc-500">
            <p>Could not load this applicant.</p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-3 font-semibold text-blue-700 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <Detail detail={query.data} />
        )}
      </aside>
    </div>
  );
}
