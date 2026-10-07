import {
  API_PREFIX,
  EmployerJobDtoSchema,
  ListEmployerJobsResponseSchema,
  CandidateMatchDtoSchema,
  ListSavedCandidatesResponseSchema,
  SavedCandidateDtoSchema,
  MatchFeedbackResponseSchema,
  z,
  type CreateJobOpeningRequest,
  type ListEmployerJobsQuery,
  type CandidateMatchDto,
  type SubmitMatchFeedbackRequest,
  type ListSavedCandidatesResponse,
  type SavedCandidateDto,
  type MatchFeedbackResponse,
} from '@hirekiwi/contracts';
import {
  SmartApiClient,
  clearAccessToken,
  createRefreshAccessToken,
  createSmartApi,
  getAccessToken,
  isSmartApiError,
} from '@hirekiwi/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient = new SmartApiClient({
  baseUrl,
  getAccessToken,
  refreshAccessToken: createRefreshAccessToken(() => api.auth.refresh()),
  onUnauthorized: () => {
    clearAccessToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  },
});

export const api = createSmartApi(apiClient);

/** Fields the server fills from the company profile or that only placement staff set. */
const SERVER_OWNED_FIELDS = [
  'companyName',
  'aboutCompany',
  'companyOffers',
  'additionalCompanyDetails',
  'driveSpoc',
  'driveDate',
] as const;

function employerJobFields<T extends Record<string, unknown>>(body: T) {
  const fields: Record<string, unknown> = { ...body };
  for (const key of SERVER_OWNED_FIELDS) delete fields[key];
  return fields;
}

/** Company job management (JOB-01): `/employer/jobs`, scoped to the signed-in company. */
export const companyJobsApi = {
  list: async (query?: ListEmployerJobsQuery) => {
    try {
      const res = await apiClient.get(`${API_PREFIX}/employer/jobs`, {
        schema: ListEmployerJobsResponseSchema,
        query,
      });
      return { openings: res.jobs, total: res.jobs.length };
    } catch {
      return { openings: [], total: 0 };
    }
  },
  get: async (openingId: string) => {
    try {
      return await apiClient.get(`${API_PREFIX}/employer/jobs/${openingId}`, {
        schema: EmployerJobDtoSchema,
      });
    } catch {
      return null;
    }
  },
  /** `institutionId` is the campus the job is posted to. */
  create: (body: Partial<CreateJobOpeningRequest> & { institutionId: string }) =>
    apiClient.post(`${API_PREFIX}/employer/jobs`, employerJobFields(body), {
      schema: EmployerJobDtoSchema,
    }),
  update: (openingId: string, body: Partial<CreateJobOpeningRequest>) =>
    apiClient.request({
      method: 'PATCH',
      path: `${API_PREFIX}/employer/jobs/${openingId}`,
      body: employerJobFields(body),
      schema: EmployerJobDtoSchema,
    }),
  publish: (openingId: string) =>
    apiClient.post(
      `${API_PREFIX}/employer/jobs/${openingId}/publish`,
      {},
      { schema: EmployerJobDtoSchema },
    ),
  delete: (openingId: string) =>
    apiClient.request<void>({
      method: 'DELETE',
      path: `${API_PREFIX}/employer/jobs/${openingId}`,
    }),
};

export const companyStudentsApi = {
  search: (
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<CandidateMatchDto[]> =>
    apiClient
      .get(`${API_PREFIX}/placement/students/search`, {
        schema: z.array(CandidateMatchDtoSchema),
        query,
      })
      .catch(() => [] as CandidateMatchDto[]),
};

export const companySavedCandidatesApi = {
  list: (): Promise<ListSavedCandidatesResponse> =>
    apiClient
      .get(`${API_PREFIX}/placement/saved-candidates`, {
        schema: ListSavedCandidatesResponseSchema,
      })
      .catch(() => ({ savedCandidates: [], total: 0 })),
  save: (studentId: string, openingId?: string, note?: string): Promise<SavedCandidateDto | null> =>
    apiClient
      .post(
        `${API_PREFIX}/placement/saved-candidates`,
        { studentId, openingId, note },
        { schema: SavedCandidateDtoSchema },
      )
      .catch(() => null),
  remove: (studentId: string): Promise<{ success: boolean }> =>
    apiClient
      .request<{ success: boolean }>({
        method: 'DELETE',
        path: `${API_PREFIX}/placement/saved-candidates/${studentId}`,
      })
      .catch(() => ({ success: false })),
};

export const companyFeedbackApi = {
  submitEmployerFeedback: (
    body: SubmitMatchFeedbackRequest,
  ): Promise<MatchFeedbackResponse | null> =>
    apiClient
      .post(`${API_PREFIX}/placement/feedback/employer`, body, {
        schema: MatchFeedbackResponseSchema,
      })
      .catch(() => null),
};

export function formatApiError(error: unknown, fallback = 'Operation failed'): string {
  if (isSmartApiError(error) && error.details.length > 0) {
    return error.details.map((d) => d.message).join('. ');
  }
  if (isSmartApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
