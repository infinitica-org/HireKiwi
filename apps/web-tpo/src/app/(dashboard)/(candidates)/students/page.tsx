'use client';

import { MessageStudentButton } from '../../../../components/message-student-button';
import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronRight, Users, ShieldCheck } from 'lucide-react';

import {
  SKILL_DEFINITIONS,
  proficiencyLevelUiLabel,
  type InstitutionStudentDto,
  type SkillClaimDto,
} from '@hirekiwi/contracts';

import { CandidateDetailDrawer } from '../../../../components/candidate-detail-drawer';
import { CustomSelect } from '../../../../components/ui/CustomSelect';
import { api } from '../../../../lib/api';
import { categoryLabel, categoryNameForSkillCode } from '../../../../lib/skill-taxonomy';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'ST').toUpperCase();
}

export default function CandidatesPage() {
  const [students, setStudents] = useState<InstitutionStudentDto[]>([]);
  const [claims, setClaims] = useState<SkillClaimDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('ALL');
  const [proficiencyFilter, setProficiencyFilter] = useState<string>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<InstitutionStudentDto | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Students · HireKiwi TPO';
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) setSearchQuery(q);
    }
    api.assessment
      .listSkillClaims()
      .then((claimList) => setClaims(claimList))
      .catch(() => setClaims([]));
  }, []);

  const loadStudents = () => {
    setLoading(true);
    setError(null);
    const q = searchQuery.trim() || undefined;

    api.onboarding
      .listTpoStudents({ q })
      .then((studentList) => {
        setStudents(studentList);
        setError(null);
      })
      .catch((err: unknown) => {
        setStudents([]);
        const rawMsg =
          err instanceof Error ? err.message : 'Failed to load candidates. Please try again.';
        const msg = rawMsg.includes('failed or timed out after')
          ? 'Failed to connect to backend server. Please check your network connection or server status and try again.'
          : rawMsg;
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const query = searchQuery.trim().toLowerCase();
      if (
        query &&
        !student.fullName.toLowerCase().includes(query) &&
        !student.email.toLowerCase().includes(query)
      ) {
        return false;
      }
      const studentClaims = claims.filter((c) => c.studentId === student.userId);
      if (skillFilter !== 'ALL') {
        if (!studentClaims.some((c) => c.skillCode === skillFilter)) return false;
      }
      if (proficiencyFilter !== 'ALL') {
        if (!studentClaims.some((c) => c.proficiency === proficiencyFilter)) return false;
      }
      return true;
    });
  }, [students, claims, searchQuery, skillFilter, proficiencyFilter]);

  // Dynamic KPI calculations
  const totalCount = students.length;
  const verifiedCountTotal = useMemo(() => {
    const verifiedUserIds = new Set(
      claims.filter((c) => c.status === 'VERIFIED').map((c) => c.studentId),
    );
    return students.filter((s) => verifiedUserIds.has(s.userId)).length;
  }, [students, claims]);

  return (
    <div className="space-y-6 ">
      {/* Separated KPI Stat Cards Grid (Clean Monochrome Theme - 2 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Total Candidates Stat Card */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Total Candidates
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <Users className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {totalCount.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs text-zinc-500 font-medium">
            Enrolled institutional cohort
          </div>
        </div>

        {/* Skills Verified Stat Card */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Skills Verified
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <ShieldCheck className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {verifiedCountTotal.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs text-zinc-500 font-medium">Certified candidates</div>
        </div>
      </div>

      {/* Main Roster & Filter Table Card */}
      <div className="rounded-lg border border-zinc-200/90 bg-white shadow-2xs">
        {/* Header Filter Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-5 border-b border-zinc-100 bg-white rounded-t-lg">
          {/* Candidates View Label */}
          <div className="inline-flex items-center gap-1 rounded-md border border-zinc-200/80 bg-white p-1 w-fit shrink-0">
            <button
              type="button"
              className="rounded-md bg-black px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-2xs cursor-default"
            >
              All Candidates
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-1 flex-wrap items-center gap-3 lg:justify-end">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search candidates…"
                aria-label="Search candidates"
                className="h-10 w-full rounded-md border border-zinc-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <CustomSelect
              ariaLabel="Filter by Skills"
              value={skillFilter}
              onChange={setSkillFilter}
              options={[
                { value: 'ALL', label: 'All Skills' },
                ...SKILL_DEFINITIONS.map((skill) => ({
                  value: skill.code,
                  label: skill.name,
                })),
              ]}
              className="min-w-[140px]"
            />

            <CustomSelect
              ariaLabel="Filter by Proficiency"
              value={proficiencyFilter}
              onChange={setProficiencyFilter}
              options={[
                { value: 'ALL', label: 'All Levels' },
                {
                  value: 'PROFESSIONAL',
                  label: `Level 5 — ${proficiencyLevelUiLabel('PROFESSIONAL')}`,
                },
                { value: 'ADVANCED', label: `Level 4 — ${proficiencyLevelUiLabel('ADVANCED')}` },
                {
                  value: 'INTERMEDIATE',
                  label: `Level 2 — ${proficiencyLevelUiLabel('INTERMEDIATE')}`,
                },
                { value: 'BEGINNER', label: `Level 1 — ${proficiencyLevelUiLabel('BEGINNER')}` },
              ]}
              className="min-w-[140px]"
            />
          </div>
        </div>

        {/* Seamless Table Structure */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-5 py-3.5">Primary Skill Category</th>
                <th className="px-5 py-3.5">Verification Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-xs text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
                      <span className="font-medium">Loading candidates…</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-rose-600">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold">{error}</p>
                      <button
                        type="button"
                        onClick={loadStudents}
                        className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-xs text-zinc-500">
                    {students.length === 0
                      ? 'No candidates have been onboarded yet.'
                      : 'No candidates match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const studentClaims = claims.filter((c) => c.studentId === student.userId);
                  const verifiedCount = studentClaims.filter((c) => c.status === 'VERIFIED').length;
                  const firstClaim = studentClaims[0];
                  const candidateCategory = firstClaim
                    ? categoryNameForSkillCode(firstClaim.skillCode)
                    : categoryLabel('PROGRAMMING_LANGUAGES');

                  return (
                    <tr
                      key={student.userId}
                      className="transition-colors duration-150 hover:bg-zinc-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-950 font-mono text-xs font-bold text-white shadow-2xs">
                            {getInitials(student.fullName)}
                          </span>

                          <div className="min-w-0">
                            <div
                              onClick={() => setSelectedStudent(student)}
                              className="font-bold text-zinc-950 hover:underline cursor-pointer text-xs sm:text-sm"
                            >
                              {student.fullName}
                            </div>

                            <div className="truncate text-[11px] text-zinc-400 font-mono font-normal">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full border border-zinc-200/90 bg-zinc-100/70 px-3 py-1 text-xs font-semibold text-zinc-700">
                          {candidateCategory}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {verifiedCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/80 bg-emerald-50/60 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {verifiedCount} Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/80 bg-teal-50/60 px-3 py-1 text-xs font-semibold text-teal-700">
                            <span className="size-1.5 rounded-full bg-teal-500" />
                            In Evaluation
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <MessageStudentButton
                            studentId={student.userId}
                            studentName={student.fullName}
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedStudent(student)}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition-all active:scale-[0.98]"
                          >
                            View Details
                            <ChevronRight
                              className="size-3.5 text-zinc-400"
                              strokeWidth={2}
                              aria-hidden
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent ? (
        <CandidateDetailDrawer
          candidate={selectedStudent}
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
        />
      ) : null}
    </div>
  );
}
