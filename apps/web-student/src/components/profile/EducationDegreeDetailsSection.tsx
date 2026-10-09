'use client';

import { useMemo, useRef } from 'react';
import { FileText, Upload } from 'lucide-react';
import type { EducationFormValues } from '@/lib/education-form';
import {
  computeTotalSemesters,
  syncSemesterRows,
  type DegreeDetailsFormSlice,
} from '@/lib/education-degree-details';
import { EDUCATION_MODAL_FIELD } from '@/components/profile/education-details-modal-ui';
import { EVIDENCE_ACCEPT, EVIDENCE_HINT } from '@/lib/evidence-upload';
import { StyledSelect } from '@/components/ui/styled-select';

interface EducationDegreeDetailsSectionProps {
  program: string;
  values: EducationFormValues;
  onPatchDegreeDetails: (patch: Partial<DegreeDetailsFormSlice>) => void;
  onProofFile: (file: File | null) => void;
}

const fieldLabelClass =
  'mb-1 block text-[13px] font-medium tracking-[-0.01em] text-[var(--ds-text)]';

export function EducationDegreeDetailsSection({
  program,
  values,
  onPatchDegreeDetails,
  onProofFile,
}: EducationDegreeDetailsSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const semestersPerYear = Number.parseInt(values.degreeDetails.semestersPerYear, 10) || 2;

  const totalSemesters = useMemo(
    () =>
      computeTotalSemesters({
        program,
        startYear: values.startYear,
        endYear: values.endYear,
        currentlyStudying: values.currentlyStudying,
        semestersPerYear,
        lateralEntry: values.degreeDetails.lateralEntry,
      }),
    [
      program,
      values.startYear,
      values.endYear,
      values.currentlyStudying,
      semestersPerYear,
      values.degreeDetails.lateralEntry,
    ],
  );

  const semesterOptions = useMemo(
    () => Array.from({ length: totalSemesters }, (_, i) => i + 1),
    [totalSemesters],
  );

  function ensureRows(next: DegreeDetailsFormSlice) {
    onPatchDegreeDetails({
      ...next,
      semesterRows: syncSemesterRows(totalSemesters, next.semesterRows),
    });
  }

  return (
    <div className="space-y-4 rounded-[16px] bg-[var(--ds-surface-muted)]/50 p-4 ring-1 ring-[#101828]/[0.06]">
      <div>
        <h4 className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--ds-text)]">
          Course details
        </h4>
        <p className="mt-0.5 text-[12px] leading-snug tracking-[-0.01em] text-[var(--ds-text-muted)]">
          Semester rows match your course length ({totalSemesters} semesters · {semestersPerYear}
          /yr).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="edu-roll" className={fieldLabelClass}>
            Institute roll no. <span className="text-[var(--ds-text-muted)]">*</span>
          </label>
          <input
            id="edu-roll"
            type="text"
            value={values.degreeDetails.rollNumber}
            onChange={(e) => onPatchDegreeDetails({ rollNumber: e.target.value })}
            placeholder="e.g. 22ALR110"
            className={EDUCATION_MODAL_FIELD}
          />
        </div>
        <div>
          <label htmlFor="edu-current-sem" className={fieldLabelClass}>
            Current semester <span className="text-[var(--ds-text-muted)]">*</span>
          </label>
          <StyledSelect
            id="edu-current-sem"
            value={values.degreeDetails.currentSemester}
            onChange={(e) => onPatchDegreeDetails({ currentSemester: e.target.value })}
            className={EDUCATION_MODAL_FIELD}
          >
            <option value="">Select semester</option>
            {semesterOptions.map((n) => (
              <option key={n} value={String(n)}>
                Semester {n}
              </option>
            ))}
          </StyledSelect>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-[13px] font-medium tracking-[-0.01em] text-[var(--ds-text-secondary)]">
        <input
          type="checkbox"
          checked={values.degreeDetails.lateralEntry}
          onChange={(e) =>
            ensureRows({
              ...values.degreeDetails,
              lateralEntry: e.target.checked,
            })
          }
          className="mt-0.5 size-4 rounded border-[var(--ds-border)]"
        />
        I am a lateral entry student in this course
      </label>

      <div>
        <label htmlFor="edu-course-notes" className={fieldLabelClass}>
          Notes / highlights{' '}
          <span className="font-normal text-[var(--ds-text-muted)]">(optional)</span>
        </label>
        <textarea
          id="edu-course-notes"
          rows={3}
          value={values.degreeDetails.courseNotes}
          onChange={(e) => onPatchDegreeDetails({ courseNotes: e.target.value })}
          placeholder="Class rank, awards, or other academic highlights"
          className={`${EDUCATION_MODAL_FIELD} min-h-[72px] resize-y py-2.5`}
        />
      </div>

      <label className="flex items-start gap-2.5 text-[13px] font-medium tracking-[-0.01em] text-[var(--ds-text-secondary)]">
        <input
          type="checkbox"
          checked={values.degreeDetails.hasCourseBacklog || values.hasActiveBacklog}
          onChange={(e) => onPatchDegreeDetails({ hasCourseBacklog: e.target.checked })}
          className="mt-0.5 size-4 rounded border-[var(--ds-border)]"
        />
        I have backlog(s) — past or ongoing standing arrears
      </label>

      <div>
        <span className={fieldLabelClass}>Course proof</span>
        <input
          ref={fileRef}
          type="file"
          accept={EVIDENCE_ACCEPT}
          className="sr-only"
          onChange={(e) => onProofFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-between gap-3 rounded-[14px] bg-[var(--ds-surface)] px-3.5 py-3 text-left ring-1 ring-[#101828]/[0.06] transition hover:bg-[var(--ds-surface-hover)]"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--ds-surface-muted)] text-[var(--ds-text-muted)]">
              {values.courseProofFile ? (
                <FileText className="size-4" strokeWidth={1.5} aria-hidden />
              ) : (
                <Upload className="size-4" strokeWidth={1.5} aria-hidden />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-[var(--ds-text)]">
                {values.courseProofFile?.name ?? 'Attach marksheet or consolidated transcript'}
              </span>
              <span className="block text-[11px] text-[var(--ds-text-muted)]">
                {EVIDENCE_HINT} · saved with this entry
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
