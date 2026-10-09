import type {
  InstitutionStudentDto,
  JobOpeningDto,
  PlacementEmployerSummary,
  SkillClaimDto,
} from '@hirekiwi/contracts';
import { verificationStateForStudent } from './university-dashboard-metrics';

export type VerificationByMajorRow = {
  major: string;
  whitelisted: number;
  fullyVerified: number;
  partial: number;
  pending: number;
  completionPct: number;
};

export type PlacementOpportunitiesSummary = {
  whitelisted: number;
  fullyVerified: number;
  activeOpenings: number;
  totalApplications: number;
};

export type EmployerEngagementRow = {
  employerName: string;
  activeOpenings: number;
  totalOpenings: number;
  applications: number;
};

function verifiedCountByStudent(claims: SkillClaimDto[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const claim of claims) {
    if (claim.status !== 'VERIFIED') continue;
    map.set(claim.studentId, (map.get(claim.studentId) ?? 0) + 1);
  }
  return map;
}

export function buildVerificationByMajorRows(
  students: InstitutionStudentDto[],
  claims: SkillClaimDto[],
): VerificationByMajorRow[] {
  const verifiedMap = verifiedCountByStudent(claims);
  const byMajor = new Map<string, InstitutionStudentDto[]>();

  for (const student of students) {
    const major = student.batchName?.trim() || 'Undeclared';
    const list = byMajor.get(major) ?? [];
    list.push(student);
    byMajor.set(major, list);
  }

  return [...byMajor.entries()]
    .map(([major, cohort]) => {
      let fullyVerified = 0;
      let partial = 0;
      let pending = 0;
      for (const student of cohort) {
        const state = verificationStateForStudent(student, verifiedMap);
        if (state === 'Full') fullyVerified += 1;
        else if (state === 'Partial') partial += 1;
        else pending += 1;
      }
      const whitelisted = cohort.length;
      const completionPct = whitelisted > 0 ? Math.round((fullyVerified / whitelisted) * 100) : 0;
      return { major, whitelisted, fullyVerified, partial, pending, completionPct };
    })
    .sort((a, b) => b.whitelisted - a.whitelisted);
}

export function buildPlacementOpportunitiesSummary(
  students: InstitutionStudentDto[],
  claims: SkillClaimDto[],
  openings: JobOpeningDto[],
  totalApplications: number,
): PlacementOpportunitiesSummary {
  const verifiedMap = verifiedCountByStudent(claims);
  const fullyVerified = students.filter((s) => (verifiedMap.get(s.userId) ?? 0) > 0).length;
  const activeOpenings = openings.filter((o) => o.status === 'OPEN').length;

  return {
    whitelisted: students.length,
    fullyVerified,
    activeOpenings,
    totalApplications,
  };
}

export function buildEmployerEngagementRows(
  employers: PlacementEmployerSummary[],
  applicationCountByEmployerId: Map<string, number>,
): EmployerEngagementRow[] {
  return employers
    .map((employer) => ({
      employerName: employer.name,
      activeOpenings: employer.activeOpeningCount,
      totalOpenings: employer.openingCount,
      applications: applicationCountByEmployerId.get(employer.employerId) ?? 0,
    }))
    .sort((a, b) => b.applications - a.applications);
}

export function applicationCountByEmployerId(
  openings: JobOpeningDto[],
  applicationCountByOpeningId: Map<string, number>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const opening of openings) {
    if (!opening.employerId) continue;
    const count = applicationCountByOpeningId.get(opening.openingId) ?? 0;
    map.set(opening.employerId, (map.get(opening.employerId) ?? 0) + count);
  }
  return map;
}

export function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [
    headers.map((h) => csvCell(h)).join(','),
    ...rows.map((row) => row.map((cell) => csvCell(cell)).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type ConsolidatedReportData = {
  summary: PlacementOpportunitiesSummary;
  verificationRows: VerificationByMajorRow[];
  employerRows: EmployerEngagementRow[];
};

export function exportVerificationByMajorCsv(rows: VerificationByMajorRow[]): void {
  const csv = toCsv(
    ['Cohort / Batch', 'Whitelisted', 'Fully verified', 'Partial', 'Pending', 'Completion %'],
    rows.map((r) => [
      r.major,
      r.whitelisted,
      r.fullyVerified,
      r.partial,
      r.pending,
      r.completionPct,
    ]),
  );
  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`hirekiwi_verification_by_major_${today}.csv`, csv);
}

export function exportPlacementOpportunitiesCsv(summary: PlacementOpportunitiesSummary): void {
  const csv = toCsv(
    ['Metric', 'Value'],
    [
      ['Whitelisted students', summary.whitelisted],
      ['Fully verified students', summary.fullyVerified],
      ['Active job openings', summary.activeOpenings],
      ['Placement applications (matched)', summary.totalApplications],
    ],
  );
  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`hirekiwi_placement_opportunities_${today}.csv`, csv);
}

export function exportEmployerEngagementCsv(rows: EmployerEngagementRow[]): void {
  const csv = toCsv(
    ['Employer', 'Active openings', 'Total openings', 'Applications'],
    rows.map((r) => [r.employerName, r.activeOpenings, r.totalOpenings, r.applications]),
  );
  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`hirekiwi_employer_engagement_${today}.csv`, csv);
}

export function buildConsolidatedReportCsv(data: ConsolidatedReportData): string {
  const lines: string[] = [];

  // Section A: Summary Metrics
  lines.push(csvCell('=== Section A: Summary Metrics ==='));
  lines.push([csvCell('Metric'), csvCell('Value')].join(','));
  lines.push([csvCell('Whitelisted Students'), csvCell(data.summary.whitelisted)].join(','));
  lines.push([csvCell('Fully Verified'), csvCell(data.summary.fullyVerified)].join(','));
  lines.push([csvCell('Active Drives'), csvCell(data.summary.activeOpenings)].join(','));
  lines.push([csvCell('Applications Matched'), csvCell(data.summary.totalApplications)].join(','));
  lines.push('');

  // Section B: Verification by Cohort / Batch
  lines.push(csvCell('=== Section B: Verification by Cohort / Batch ==='));
  lines.push(
    [
      csvCell('Cohort / Batch'),
      csvCell('Whitelisted'),
      csvCell('Fully Verified'),
      csvCell('Partial'),
      csvCell('Pending'),
      csvCell('Completion %'),
    ].join(','),
  );
  if (data.verificationRows.length === 0) {
    lines.push(
      [
        csvCell('No students on the whitelist yet'),
        csvCell(0),
        csvCell(0),
        csvCell(0),
        csvCell(0),
        csvCell(0),
      ].join(','),
    );
  } else {
    for (const r of data.verificationRows) {
      lines.push(
        [
          csvCell(r.major),
          csvCell(r.whitelisted),
          csvCell(r.fullyVerified),
          csvCell(r.partial),
          csvCell(r.pending),
          csvCell(r.completionPct),
        ].join(','),
      );
    }
  }
  lines.push('');

  // Section C: Employer Engagement
  lines.push(csvCell('=== Section C: Employer Engagement ==='));
  lines.push(
    [
      csvCell('Employer'),
      csvCell('Active Openings'),
      csvCell('Total Openings'),
      csvCell('Applications'),
    ].join(','),
  );
  if (data.employerRows.length === 0) {
    lines.push(
      [csvCell('No employers in the repository yet'), csvCell(0), csvCell(0), csvCell(0)].join(','),
    );
  } else {
    for (const r of data.employerRows) {
      lines.push(
        [
          csvCell(r.employerName),
          csvCell(r.activeOpenings),
          csvCell(r.totalOpenings),
          csvCell(r.applications),
        ].join(','),
      );
    }
  }

  return `\uFEFF${lines.join('\r\n')}`;
}

export function exportConsolidatedReportCsv(data: ConsolidatedReportData): void {
  const csv = buildConsolidatedReportCsv(data);
  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`hirekiwi_reports_analytics_${today}.csv`, csv);
}
