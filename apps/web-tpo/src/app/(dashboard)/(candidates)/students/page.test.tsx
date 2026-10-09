import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CandidatesPage from './page';
import { api } from '../../../../lib/api';

vi.mock('../../../../lib/api', () => ({
  api: {
    assessment: { listSkillClaims: vi.fn().mockResolvedValue([]) },
    onboarding: { listTpoStudents: vi.fn().mockResolvedValue([]) },
  },
}));

describe('CandidatesPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.assessment.listSkillClaims).mockResolvedValue([]);
    vi.mocked(api.onboarding.listTpoStudents).mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders toolbar and KPI cards without removed elements (no My Assigned Students, no All Categories, no Pending Invites, no Onboarding Progress)', async () => {
    render(<CandidatesPage />);

    // Retained filters & search
    expect(await screen.findByRole('searchbox', { name: /Search candidates/i })).toBeDefined();
    expect(screen.getByRole('combobox', { name: /Filter by Skills/i })).toBeDefined();
    const proficiency = screen.getByRole('combobox', { name: /Filter by Proficiency/i });
    expect(proficiency).toBeDefined();

    // Retained KPI cards
    expect(screen.getByText('Total Candidates')).toBeDefined();
    expect(screen.getByText('Skills Verified')).toBeDefined();

    // Retained All Candidates view
    expect(screen.getByText('All Candidates')).toBeDefined();

    // REMOVED elements: must NOT be rendered
    expect(screen.queryByRole('combobox', { name: /Filter by skill category/i })).toBeNull();
    expect(screen.queryByText('All Categories')).toBeNull();
    expect(screen.queryByRole('button', { name: /My Assigned Students/i })).toBeNull();
    expect(screen.queryByText('Pending Invites')).toBeNull();
    expect(screen.queryByText('Onboarding Progress')).toBeNull();

    await waitFor(() => expect(document.title).toBe('Students · HireKiwi TPO'));
  });

  it('renders candidate rows with category, verification status, message, and view details actions', async () => {
    vi.mocked(api.onboarding.listTpoStudents).mockResolvedValue([
      {
        userId: 'stu_1',
        email: 'ada@univ.edu',
        fullName: 'Ada Lovelace',
        batchId: null,
        batchName: 'Batch 2026',
        inviteStatus: 'ACCEPTED',
        lastSentAt: null,
        acceptedAt: '2026-01-15T00:00:00.000Z',
        heldAt: null,
        linkedinUrl: null,
        githubUrl: null,
      },
    ]);
    vi.mocked(api.assessment.listSkillClaims).mockResolvedValue([
      {
        claimId: 'claim_1',
        studentId: 'stu_1',
        skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        proficiency: 'INTERMEDIATE',
        status: 'VERIFIED',
        strikes: 0,
        lockedUntil: null,
        lastAttemptId: null,
      },
    ]);

    render(<CandidatesPage />);

    expect(await screen.findByText('Ada Lovelace')).toBeDefined();
    expect(screen.getByText('ada@univ.edu')).toBeDefined();
    expect(screen.getByText('1 Verified')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Message' })).toBeDefined();
    expect(screen.getByRole('button', { name: /View Details/i })).toBeDefined();

    // Onboarding progress column & cells must not exist
    expect(screen.queryByText('Onboarding Progress')).toBeNull();
    expect(screen.queryByText('Completed')).toBeNull();
    expect(screen.queryByText('Pending Invite')).toBeNull();
  });

  it('opens candidate detail drawer on clicking View Details and does not render Evidence Review', async () => {
    vi.mocked(api.onboarding.listTpoStudents).mockResolvedValue([
      {
        userId: 'stu_1',
        email: 'ada@univ.edu',
        fullName: 'Ada Lovelace',
        batchId: null,
        batchName: 'Batch 2026',
        inviteStatus: 'ACCEPTED',
        lastSentAt: null,
        acceptedAt: '2026-01-15T00:00:00.000Z',
        heldAt: null,
        linkedinUrl: null,
        githubUrl: null,
      },
    ]);

    render(<CandidatesPage />);

    const viewDetailsButton = await screen.findByRole('button', { name: /View Details/i });
    fireEvent.click(viewDetailsButton);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Candidate details' })).toBeDefined();
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0);

    // Evidence Review and Batch Invite Status must NOT be rendered in the drawer
    expect(screen.queryByText('Candidate Evidence Review')).toBeNull();
    expect(screen.queryByText(/Evidence Review/i)).toBeNull();
    expect(screen.queryByText('Onboarding complete')).toBeNull();
    expect(screen.queryByText(/Invite sent:/i)).toBeNull();
  });

  it('filters candidates client-side via skills and proficiency', async () => {
    vi.mocked(api.onboarding.listTpoStudents).mockResolvedValue([
      {
        userId: 'stu_1',
        email: 'ada@univ.edu',
        fullName: 'Ada Lovelace',
        batchId: null,
        batchName: null,
        inviteStatus: 'ACCEPTED',
        lastSentAt: null,
        acceptedAt: null,
        heldAt: null,
        linkedinUrl: null,
        githubUrl: null,
      },
      {
        userId: 'stu_2',
        email: 'alan@univ.edu',
        fullName: 'Alan Turing',
        batchId: null,
        batchName: null,
        inviteStatus: 'ACCEPTED',
        lastSentAt: null,
        acceptedAt: null,
        heldAt: null,
        linkedinUrl: null,
        githubUrl: null,
      },
    ]);
    vi.mocked(api.assessment.listSkillClaims).mockResolvedValue([
      {
        claimId: 'claim_1',
        studentId: 'stu_1',
        skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        proficiency: 'INTERMEDIATE',
        status: 'VERIFIED',
        strikes: 0,
        lockedUntil: null,
        lastAttemptId: null,
      },
      {
        claimId: 'claim_2',
        studentId: 'stu_2',
        skillCode: 'REACT',
        proficiency: 'ADVANCED',
        status: 'VERIFIED',
        strikes: 0,
        lockedUntil: null,
        lastAttemptId: null,
      },
    ]);

    render(<CandidatesPage />);

    expect(await screen.findByText('Ada Lovelace')).toBeDefined();
    expect(screen.getByText('Alan Turing')).toBeDefined();

    // Filter by skills
    const skillsSelect = screen.getByRole('combobox', { name: /Filter by Skills/i });
    fireEvent.click(skillsSelect);
    const pythonOption = screen.getByRole('option', { name: /Python/i });
    fireEvent.click(pythonOption);

    expect(screen.getByText('Ada Lovelace')).toBeDefined();
    expect(screen.queryByText('Alan Turing')).toBeNull();
  });

  it('handles error state and allows retry on listTpoStudents', async () => {
    vi.mocked(api.onboarding.listTpoStudents).mockRejectedValueOnce(new Error('API failure'));

    render(<CandidatesPage />);

    await waitFor(() => {
      expect(screen.getByText('API failure')).toBeDefined();
    });

    vi.mocked(api.onboarding.listTpoStudents).mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    await waitFor(() => {
      expect(api.onboarding.listTpoStudents).toHaveBeenCalledTimes(2);
    });
  });
});
