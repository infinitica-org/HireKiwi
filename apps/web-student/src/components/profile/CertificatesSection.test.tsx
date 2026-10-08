import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { CertificatesSection } from '@/components/profile/CertificatesSection';

const updateDeclaration = vi.fn().mockResolvedValue({ hasNoCertifications: true });

vi.mock('@/lib/api', () => ({
  api: {
    candidateCertificates: {
      updateDeclaration: (...args: unknown[]) => updateDeclaration(...args),
    },
  },
}));

vi.mock('@hirekiwi/ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
      setQueryData: vi.fn(),
    })),
  };
});

const { useQuery } = await import('@hirekiwi/ui');

describe('CertificatesSection', () => {
  it('renders premium empty state when no certificates', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { certificates: [] },
      isLoading: false,
      error: null,
    } as never);

    render(<CertificatesSection />);

    expect(screen.getByRole('heading', { name: 'Certifications' })).toBeTruthy();
    expect(screen.getByText(/No certifications yet/i)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Add certificate/i }).length).toBeGreaterThan(0);
  });

  it('renders bento cards when certificates exist', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        certificates: [
          {
            certificateId: '00000000-0000-4000-8000-000000000001',
            candidateId: '00000000-0000-4000-8000-000000000002',
            title: 'Google Data Analytics',
            issuer: 'Google',
            status: 'VERIFIED',
            sourceStatus: 'source_verified',
            certificateNumber: 'G-123',
            issueDate: '2025-01-15',
            expiryDate: null,
            verificationUrl: null,
            verificationMethod: 'ENDORSEMENT',
            certificateFileUrl: null,
            certificateFileName: 'cert.pdf',
            fileMimeType: 'application/pdf',
            fileSizeBytes: 1024,
            learningDescription: null,
            tools: [],
            practicalApplied: null,
            practicalDescription: null,
            skills: [
              { skillCode: 'SKILL_1', skillName: 'SQL', selfAssessedProficiency: 'INTERMEDIATE' },
            ],
            skillsClaimedSnapshot: null,
            trackCode: null,
            agendaLines: [],
            retryAvailableAt: null,
            lockedUntil: null,
            taxonomyVersionSnapshot: null,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
      },
      isLoading: false,
      error: null,
    } as never);

    render(<CertificatesSection />);

    expect(screen.getByText('Google Data Analytics')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
    expect(screen.getByText('SQL')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: /badge/i })).toBeNull();
  });

  it('shows a loading message and no empty state while certificates load', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);

    render(<CertificatesSection />);

    expect(screen.getByText(/Loading certifications/i)).toBeTruthy();
    expect(screen.queryByText(/No certifications yet/i)).toBeNull();
  });

  it('shows a specific error when certificates cannot be loaded', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Certificates service unavailable'),
    } as never);

    render(<CertificatesSection />);

    expect(screen.getByText('Certificates service unavailable')).toBeTruthy();
  });

  it('falls back to a generic error message when the failure has no message', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error(''),
    } as never);

    render(<CertificatesSection />);

    expect(screen.getByText('Failed to load candidate certificates.')).toBeTruthy();
  });

  it('offers a single add action in the empty box', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { certificates: [] },
      isLoading: false,
      error: null,
    } as never);

    render(<CertificatesSection />);

    expect(screen.getAllByRole('button', { name: /Add (your first )?certificate/i })).toHaveLength(
      1,
    );
  });

  it('shows the Credly badge picture on a verified certificate', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        certificates: [
          {
            certificateId: '00000000-0000-4000-8000-000000000001',
            candidateId: '00000000-0000-4000-8000-000000000002',
            title: 'AWS Cloud Practitioner',
            issuer: 'Amazon Web Services',
            status: 'VERIFIED',
            sourceStatus: 'source_verified',
            certificateNumber: null,
            verificationUrl: 'https://www.credly.com/badges/abc',
            previewImageUrl: 'https://images.credly.com/images/abc/image.png',
            verificationMethod: 'ENDORSEMENT',
            certificateFileUrl: null,
            certificateFileName: null,
            fileMimeType: null,
            fileSizeBytes: null,
            learningDescription: null,
            tools: [],
            practicalApplied: null,
            practicalDescription: null,
            skills: [],
            skillsClaimedSnapshot: null,
            trackCode: null,
            agendaLines: [],
            retryAvailableAt: null,
            lockedUntil: null,
            taxonomyVersionSnapshot: null,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
      },
      isLoading: false,
      error: null,
    } as never);

    render(<CertificatesSection />);

    const picture = screen.getByRole('img', { name: 'AWS Cloud Practitioner badge' });
    expect(picture.getAttribute('src')).toBe('https://images.credly.com/images/abc/image.png');
  });

  it('renders declared no certifications state when hasNoCertifications is true', () => {
    vi.mocked(useQuery).mockImplementation((opts: unknown) => {
      const qKey = (opts as { queryKey: string[] }).queryKey;
      if (qKey.includes('declaration')) {
        return { data: { hasNoCertifications: true }, isLoading: false, error: null } as never;
      }
      return { data: { certificates: [] }, isLoading: false, error: null } as never;
    });

    render(<CertificatesSection />);

    expect(screen.getByText('No certifications')).toBeTruthy();
    expect(
      screen.getByText("You've indicated that you don't currently have any certifications."),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Change declaration' })).toBeTruthy();
  });

  it('calls updateDeclaration when declaring no certifications', async () => {
    vi.mocked(useQuery).mockImplementation((opts: unknown) => {
      const qKey = (opts as { queryKey: string[] }).queryKey;
      if (qKey.includes('declaration')) {
        return { data: { hasNoCertifications: null }, isLoading: false, error: null } as never;
      }
      return { data: { certificates: [] }, isLoading: false, error: null } as never;
    });

    render(<CertificatesSection />);

    const button = screen.getByRole('button', { name: "I don't have any certifications" });
    await fireEvent.click(button);

    expect(updateDeclaration).toHaveBeenCalledWith({ hasNoCertifications: true });
  });

  it('calls updateDeclaration with null when changing declaration', async () => {
    vi.mocked(useQuery).mockImplementation((opts: unknown) => {
      const qKey = (opts as { queryKey: string[] }).queryKey;
      if (qKey.includes('declaration')) {
        return { data: { hasNoCertifications: true }, isLoading: false, error: null } as never;
      }
      return { data: { certificates: [] }, isLoading: false, error: null } as never;
    });

    render(<CertificatesSection />);

    const button = screen.getByRole('button', { name: 'Change declaration' });
    await fireEvent.click(button);

    expect(updateDeclaration).toHaveBeenCalledWith({ hasNoCertifications: null });
  });
});
