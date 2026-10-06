'use client';

import { useEffect, useState } from 'react';
import type { AuthenticatedUser, InstitutionStudentDto, SkillClaimDto } from '@hirekiwi/contracts';
import { UniversityDashboard } from '../../components/dashboard/UniversityDashboard';
import { api } from '../../lib/api';
import { countInstitutionPlacementApplications } from '../../lib/placement-application-count';
import { dashboardCanvasClass } from '../../lib/tpo-dashboard-ui';

function fetchWithTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), timeoutMs);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

export default function DashboardPage() {
  const [students, setStudents] = useState<InstitutionStudentDto[]>([]);
  const [claims, setClaims] = useState<SkillClaimDto[]>([]);
  const [placementApplicationCount, setPlacementApplicationCount] = useState(0);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      fetchWithTimeout(api.onboarding.listTpoStudents(), 3500, [] as InstitutionStudentDto[]),
      fetchWithTimeout(api.assessment.listSkillClaims(), 3500, [] as SkillClaimDto[]),
      fetchWithTimeout(
        countInstitutionPlacementApplications().then((r) => r.total),
        3500,
        0,
      ),
      fetchWithTimeout(api.auth.me(), 3500, null),
    ])
      .then(([studentList, claimList, applicationCount, me]) => {
        if (!active) return;
        setStudents(studentList);
        setClaims(claimList);
        setPlacementApplicationCount(applicationCount);
        setUser(me);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const institutionName =
    user?.institutionName?.trim() || user?.fullName?.trim() || 'Your institution';

  return (
    <div className={`tpo-dashboard ${dashboardCanvasClass}`}>
      <UniversityDashboard
        students={students}
        claims={claims}
        placementApplicationCount={placementApplicationCount}
        institutionName={institutionName}
        loading={loading}
      />
    </div>
  );
}
