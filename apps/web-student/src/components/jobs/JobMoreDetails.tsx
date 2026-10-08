import type { ReactNode } from 'react';
import type { JobDetails } from '@hirekiwi/contracts';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-label={title}
      style={{ scrollMarginTop: '5.5rem' }}
      className="rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]"
    >
      <h2 className="font-heading text-base font-bold">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Text({ label, value }: { label?: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      {label ? <p className="text-xs font-semibold text-zinc-500">{label}</p> : null}
      <p className="whitespace-pre-line">{value}</p>
    </div>
  );
}

function Chips({ label, values }: { label: string; values?: string[] }) {
  if (!values || values.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <li
            key={value}
            className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

const ASSESSMENT_LABELS: [keyof NonNullable<JobDetails['assessment']>, string][] = [
  ['coding', 'Coding assessment'],
  ['technical', 'Technical assessment'],
  ['aptitude', 'Aptitude'],
  ['communication', 'Communication'],
  ['domainSpecific', 'Domain-specific test'],
];

export interface JobSectionLink {
  id: string;
  title: string;
}

/** The sections this job's details will show, in order, for the page's jump-to menu. */
export function jobDetailSections(
  details: JobDetails | null,
  description?: string | null,
): JobSectionLink[] {
  if (!details) return [];
  const list: JobSectionLink[] = [];
  const a = details.assessment ?? {};
  if (
    details.functionCategory ||
    details.department ||
    details.workAuthorization ||
    details.joiningTimeline
  )
    list.push({ id: 'sec-about-job', title: 'About this job' });
  if (roleText(details, description)) list.push({ id: 'sec-role-details', title: 'Role details' });
  if (
    (details.goodToHaveSkills?.length ?? 0) +
      (details.technicalSkills?.length ?? 0) +
      (details.softSkills?.length ?? 0) +
      (details.tools?.length ?? 0) +
      (details.certifications?.length ?? 0) +
      (details.languages?.length ?? 0) >
    0
  )
    list.push({ id: 'sec-skills', title: 'Skills' });
  if (details.minimumQualification || details.preferredDegree || details.specialization)
    list.push({ id: 'sec-education', title: 'Education' });
  if (details.relevantExperience || details.industryExperience)
    list.push({ id: 'sec-experience', title: 'Experience' });
  if (
    a.coding ||
    a.technical ||
    a.aptitude ||
    a.communication ||
    a.domainSpecific ||
    a.interviewRounds
  )
    list.push({ id: 'sec-assessment', title: 'Assessment' });
  return list;
}

/** The summary is left out when it only repeats the job description shown above. */
function roleText(details: JobDetails, description?: string | null) {
  const summary =
    details.summary && details.summary.trim() !== (description ?? '').trim()
      ? details.summary
      : undefined;
  return summary || details.responsibilities || details.dayToDay || details.outcomes
    ? { summary }
    : null;
}

/**
 * Everything the company wrote about the job beyond the basics, section by section. Empty sections
 * are left out, so a short posting stays short. Company-only notes never reach this component.
 */
export function JobMoreDetails({
  details,
  description,
}: {
  details: JobDetails | null;
  description?: string | null;
}) {
  if (!details) return null;

  const assessment = details.assessment ?? {};
  const assessments = ASSESSMENT_LABELS.filter(([key]) => assessment[key] === true).map(
    ([key, label]) =>
      key === 'domainSpecific' && assessment.domainSpecificNote
        ? `${label} (${assessment.domainSpecificNote})`
        : label,
  );
  if (assessment.interviewRounds) {
    assessments.push(
      `${assessment.interviewRounds} interview round${assessment.interviewRounds === 1 ? '' : 's'}`,
    );
  }
  const goodToHave = (details.goodToHaveSkills ?? []).map(
    (skill) => `${skill.name} (weight ${skill.weight}/5)`,
  );

  const role = roleText(details, description);
  const hasSkills =
    goodToHave.length > 0 ||
    (details.technicalSkills?.length ?? 0) > 0 ||
    (details.softSkills?.length ?? 0) > 0 ||
    (details.tools?.length ?? 0) > 0 ||
    (details.certifications?.length ?? 0) > 0 ||
    (details.languages?.length ?? 0) > 0;
  const hasEducation =
    details.minimumQualification || details.preferredDegree || details.specialization;
  const hasExperience = details.relevantExperience || details.industryExperience;
  const hasAbout =
    details.functionCategory ||
    details.department ||
    details.workAuthorization ||
    details.joiningTimeline;

  return (
    <div className="space-y-5" data-testid="job-more-details">
      {hasAbout ? (
        <Section id="sec-about-job" title="About this job">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ['Job function', details.functionCategory],
              ['Team', details.department],
              ['Work authorization', details.workAuthorization],
              ['Joining', details.joiningTimeline],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold text-zinc-500">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </Section>
      ) : null}

      {role ? (
        <Section id="sec-role-details" title="Role details">
          <Text value={role.summary} />
          <Text label="Responsibilities" value={details.responsibilities} />
          <Text label="Day-to-day" value={details.dayToDay} />
          <Text label="Expected outcomes" value={details.outcomes} />
        </Section>
      ) : null}

      {hasSkills ? (
        <Section id="sec-skills" title="Skills">
          <Chips label="Good to have" values={goodToHave} />
          <Chips label="Technical skills" values={details.technicalSkills} />
          <Chips label="Soft skills" values={details.softSkills} />
          <Chips label="Tools and technologies" values={details.tools} />
          <Chips label="Certifications" values={details.certifications} />
          <Chips label="Languages" values={details.languages} />
        </Section>
      ) : null}

      {hasEducation ? (
        <Section id="sec-education" title="Education">
          <Text label="Minimum qualification" value={details.minimumQualification} />
          <Text label="Preferred degree" value={details.preferredDegree} />
          <Text label="Specialization" value={details.specialization} />
        </Section>
      ) : null}

      {hasExperience ? (
        <Section id="sec-experience" title="Experience">
          <Text label="Relevant experience" value={details.relevantExperience} />
          <Text label="Industry or domain" value={details.industryExperience} />
        </Section>
      ) : null}

      {assessments.length > 0 ? (
        <Section id="sec-assessment" title="How you will be assessed">
          <ul className="list-disc space-y-1 pl-5">
            {assessments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
