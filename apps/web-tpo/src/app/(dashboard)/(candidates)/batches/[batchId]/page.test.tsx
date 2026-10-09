import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../../../lib/api';
import BatchDetailPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ batchId: 'batch-1' }),
}));

vi.mock('../../../../../lib/api', () => ({
  api: {
    onboarding: {
      getBatch: vi.fn(),
      listBatchMembers: vi.fn(),
      updateBatch: vi.fn(),
      addBatchMember: vi.fn(),
      resendStudentInvitation: vi.fn(),
      revokeStudentInvitation: vi.fn(),
      getStudentInviteLink: vi.fn(),
      tpoEntitlements: vi
        .fn()
        .mockResolvedValue({ domain: 'example.test', planCode: 'PRO', flags: [] }),
    },
  },
}));

vi.mock('../../../../../components/batch-import-wizard', () => ({
  BatchImportWizard: ({ batchId, onComplete }: { batchId: string; onComplete?: () => void }) => (
    <div>
      <h2>Bulk candidate provisioning</h2>
      <p>wizard-batch:{batchId}</p>
      <button type="button" onClick={() => onComplete?.()}>
        Complete provisioning
      </button>
    </div>
  ),
}));

const batch = {
  batchId: 'batch-1',
  institutionId: 'inst-1',
  name: 'Fall 2026',
  code: 'F26',
  campusId: null,
  campusName: null,
  memberCount: 1,
  pendingInviteCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const member = {
  userId: 'user-1',
  fullName: 'Ada Lovelace',
  email: 'ada@example.test',
  groupLabel: 'A',
  emailVerified: false,
  invitation: {
    invitationId: 'inv-1',
    email: 'ada@example.test',
    fullName: 'Ada Lovelace',
    role: 'STUDENT' as const,
    status: 'PENDING' as const,
    batchId: 'batch-1',
    groupLabel: 'A',
    expiresAt: '2026-12-01T00:00:00.000Z',
    acceptedAt: null,
    lastSentAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  heldAt: null,
};

describe('BatchDetailPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders batch details, members, and entry buttons without inline wizard', async () => {
    vi.mocked(api.onboarding.getBatch).mockResolvedValue(batch);
    vi.mocked(api.onboarding.listBatchMembers).mockResolvedValue([member]);
    render(<BatchDetailPage />);

    expect(await screen.findByRole('heading', { name: 'Fall 2026' })).toBeDefined();
    expect(screen.getByText(/1 members · 1 pending invites/i)).toBeDefined();
    expect(screen.getByText('Ada Lovelace')).toBeDefined();
    expect(screen.getByRole('button', { name: /Edit batch/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Single Student/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Bulk Upload/i })).toBeDefined();
    expect(screen.getByText('Showing 1–1 of 1 students')).toBeDefined();
    // Wizard should not be rendered inline on the page
    expect(screen.queryByText('Bulk candidate provisioning')).toBeNull();
  });

  it('opens Bulk Upload modal, displays wizard, and refreshes on completion', async () => {
    vi.mocked(api.onboarding.getBatch).mockResolvedValue(batch);
    vi.mocked(api.onboarding.listBatchMembers).mockResolvedValue([member]);
    render(<BatchDetailPage />);
    await screen.findByRole('heading', { name: 'Fall 2026' });

    fireEvent.click(screen.getByRole('button', { name: /Bulk Upload/i }));

    expect(screen.getByRole('dialog', { name: /Bulk Upload/i })).toBeDefined();
    expect(screen.getByText('Bulk candidate provisioning')).toBeDefined();
    expect(screen.getByText('wizard-batch:batch-1')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Complete provisioning' }));
    await waitFor(() => expect(api.onboarding.getBatch).toHaveBeenCalledTimes(2));
    expect(api.onboarding.listBatchMembers).toHaveBeenCalledTimes(2);

    // Close button dismisses modal
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Bulk candidate provisioning')).toBeNull();
  });

  it('opens Single Student modal, validates domain, and adds a member', async () => {
    vi.mocked(api.onboarding.getBatch).mockResolvedValue(batch);
    vi.mocked(api.onboarding.listBatchMembers).mockResolvedValue([member]);
    vi.mocked(api.onboarding.addBatchMember).mockResolvedValue({
      userId: 'user-2',
      email: 'grace@example.test',
      fullName: 'Grace Hopper',
      groupLabel: 'B',
      emailVerified: false,
      heldAt: null,
      invitation: null,
    });
    render(<BatchDetailPage />);
    await screen.findByRole('heading', { name: 'Fall 2026' });

    fireEvent.click(screen.getByRole('button', { name: /Single Student/i }));
    const dialog = screen.getByRole('dialog', { name: /Single Student/i });
    expect(dialog).toBeDefined();

    // Fill form with mismatched domain first
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Grace Hopper' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'grace@other.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add student' }));

    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.getByText(/Email address must belong to domain @example.test/i)).toBeDefined();
    expect(api.onboarding.addBatchMember).not.toHaveBeenCalled();

    // Now correct the domain and submit
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'grace@example.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add student' }));

    await waitFor(() => {
      expect(api.onboarding.addBatchMember).toHaveBeenCalledWith('batch-1', {
        fullName: 'Grace Hopper',
        email: 'grace@example.test',
        groupLabel: undefined,
      });
    });
  });

  it('paginates batch members at 50 per page with navigation controls', async () => {
    const manyMembers = Array.from({ length: 55 }, (_, i) => ({
      ...member,
      userId: `user-${i + 1}`,
      fullName: `Student ${String(i + 1).padStart(2, '0')}`,
      email: `student${i + 1}@example.test`,
    }));

    vi.mocked(api.onboarding.getBatch).mockResolvedValue({
      ...batch,
      memberCount: 55,
    });
    vi.mocked(api.onboarding.listBatchMembers).mockResolvedValue(manyMembers);
    render(<BatchDetailPage />);

    await screen.findByRole('heading', { name: 'Fall 2026' });

    // Page 1: 1 to 50
    expect(screen.getByText('Showing 1–50 of 55 students')).toBeDefined();
    expect(screen.getByText('Student 01')).toBeDefined();
    expect(screen.getByText('Student 50')).toBeDefined();
    expect(screen.queryByText('Student 51')).toBeNull();

    const prevBtn = screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement;
    const nextBtn = screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);

    // Go to Page 2
    fireEvent.click(nextBtn);
    expect(screen.getByText('Showing 51–55 of 55 students')).toBeDefined();
    expect(screen.queryByText('Student 01')).toBeNull();
    expect(screen.getByText('Student 51')).toBeDefined();
    expect(screen.getByText('Student 55')).toBeDefined();
    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(true);

    // Return to Page 1
    fireEvent.click(prevBtn);
    expect(screen.getByText('Showing 1–50 of 55 students')).toBeDefined();
    expect(screen.getByText('Student 01')).toBeDefined();
  });
});
