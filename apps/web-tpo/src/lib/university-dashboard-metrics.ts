import type { InstitutionStudentDto, SkillClaimDto } from '@hirekiwi/contracts';

export type StudentVerificationState = 'Full' | 'Partial' | 'Pending';

export type UniversityDashboardMetrics = {
  whitelisted: number;
  fullyVerified: number;
  opportunitiesMatched: number;
};

export type UniversityRosterRow = {
  userId: string;
  name: string;
  email: string;
  major: string;
  verificationState: StudentVerificationState;
  hiredLabel: string;
  verifiedSkillsCount: number;
};

function verifiedClaimCountByStudent(claims: SkillClaimDto[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const claim of claims) {
    if (claim.status !== 'VERIFIED') continue;
    map.set(claim.studentId, (map.get(claim.studentId) ?? 0) + 1);
  }
  return map;
}

export function verificationStateForStudent(
  student: InstitutionStudentDto,
  verifiedClaimsByStudent: Map<string, number>,
): StudentVerificationState {
  const verifiedCount = verifiedClaimsByStudent.get(student.userId) ?? 0;
  if (verifiedCount > 0) return 'Full';
  if (student.inviteStatus === 'ACCEPTED') return 'Partial';
  return 'Pending';
}

export function computeUniversityDashboardMetrics(
  students: InstitutionStudentDto[],
  claims: SkillClaimDto[],
  placementApplicationCount: number,
): UniversityDashboardMetrics {
  const verifiedByStudent = verifiedClaimCountByStudent(claims);
  const fullyVerified = students.filter((s) => (verifiedByStudent.get(s.userId) ?? 0) > 0).length;

  return {
    whitelisted: students.length,
    fullyVerified,
    opportunitiesMatched: placementApplicationCount,
  };
}

export function buildUniversityRosterRows(
  students: InstitutionStudentDto[],
  claims: SkillClaimDto[],
): UniversityRosterRow[] {
  const verifiedByStudent = verifiedClaimCountByStudent(claims);

  return students.map((student) => ({
    userId: student.userId,
    name: student.fullName,
    email: student.email,
    major: student.batchName?.trim() || 'Undeclared',
    verificationState: verificationStateForStudent(student, verifiedByStudent),
    hiredLabel: '—',
    verifiedSkillsCount: verifiedByStudent.get(student.userId) ?? 0,
  }));
}

export function filterUniversityRoster(
  roster: UniversityRosterRow[],
  query: string,
): UniversityRosterRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return roster;

  const idQuery = normalizedQuery.replace(/^id[\s:-]*/i, '').trim();

  return roster.filter((row) => {
    const nameMatch = (row.name ?? '').toLowerCase().includes(normalizedQuery);
    const emailMatch = (row.email ?? '').toLowerCase().includes(normalizedQuery);
    const majorMatch = (row.major ?? '').toLowerCase().includes(normalizedQuery);
    const idMatch =
      (row.userId ?? '').toLowerCase().includes(normalizedQuery) ||
      (idQuery.length > 0 && (row.userId ?? '').toLowerCase().includes(idQuery));

    return nameMatch || emailMatch || majorMatch || idMatch;
  });
}
