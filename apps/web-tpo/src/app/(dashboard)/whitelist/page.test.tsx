import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import WhitelistPage from './page';

vi.mock('../../../lib/api', () => ({
  api: {
    auth: {
      me: vi.fn().mockResolvedValue({ institutionId: '11111111-1111-4111-8111-111111111111' }),
    },
    onboarding: {
      tpoEntitlements: vi.fn().mockResolvedValue({
        domain: 'psgtech.ac.in',
        planCode: 'INSTITUTION_PRO',
        flags: [],
      }),
      listBatches: vi.fn().mockResolvedValue([
        {
          batchId: 'batch-1',
          name: 'CSE 2026',
          code: 'CSE26',
          memberCount: 2,
          pendingInviteCount: 1,
        },
      ]),
      listBatchMembers: vi.fn().mockResolvedValue([
        {
          userId: 'u1',
          fullName: 'Aarav Sharma',
          email: 'aarav@psgtech.ac.in',
          groupLabel: 'CSE-A',
          emailVerified: false,
          invitation: { invitationId: 'inv-1', status: 'PENDING' },
        },
        {
          userId: 'u2',
          fullName: 'Priya Patel',
          email: 'priya@psgtech.ac.in',
          groupLabel: 'CSE-B',
          emailVerified: true,
          invitation: { invitationId: 'inv-2', status: 'ACCEPTED' },
        },
      ]),
      getStudentInviteLink: vi.fn().mockResolvedValue({
        inviteUrl: 'https://hirekiwi.online/invite/test-magic-link',
      }),
      resendStudentInvitation: vi.fn().mockResolvedValue({ success: true }),
      revokeStudentInvitation: vi.fn().mockResolvedValue({ success: true }),
      sendBatchInvites: vi.fn().mockResolvedValue({ enqueued: 1 }),
    },
  },
}));

describe('Candidate Access & Invitations (WhitelistPage)', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders Candidate Access & Invitations workspace and confirms onboarding controls are absent', async () => {
    render(<WhitelistPage />);
    expect(
      await screen.findByRole('heading', { name: /^Candidate Access & Invitations$/i }),
    ).toBeDefined();

    // Confirm duplicate onboarding buttons and modals are completely removed
    expect(screen.queryByRole('button', { name: /Single Student/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Bulk Upload/i })).toBeNull();
    expect(screen.queryByPlaceholderText('e.g. Aarav Sharma')).toBeNull();
    expect(screen.queryByText(/Quick Email Paste/i)).toBeNull();
  });

  it('renders invitation records with status badges and actions', async () => {
    render(<WhitelistPage />);
    expect(await screen.findByText('Aarav Sharma')).toBeDefined();
    expect(screen.getByText('aarav@psgtech.ac.in')).toBeDefined();
    expect(screen.getByText('Pending Invitation')).toBeDefined();

    expect(screen.getByText('Priya Patel')).toBeDefined();
    expect(screen.getByText('priya@psgtech.ac.in')).toBeDefined();
    expect(screen.getByText('Active')).toBeDefined();

    // Pending member has Copy Link, Resend, Revoke actions
    expect(screen.getByRole('button', { name: /Copy Link/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Resend/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Revoke/i })).toBeDefined();
  });

  it('copies candidate invite link to clipboard', async () => {
    render(<WhitelistPage />);
    const copyButton = await screen.findByRole('button', { name: /Copy Link/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(api.onboarding.getStudentInviteLink).toHaveBeenCalledWith('u1');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://hirekiwi.online/invite/test-magic-link',
      );
    });

    expect(await screen.findByText('Copied!')).toBeDefined();
  });

  it('resends invitation for pending member', async () => {
    render(<WhitelistPage />);
    const resendButton = await screen.findByRole('button', { name: /Resend/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(api.onboarding.resendStudentInvitation).toHaveBeenCalledWith('inv-1');
    });

    expect(await screen.findByText('Invitation resent successfully.')).toBeDefined();
  });

  it('revokes invitation for pending member', async () => {
    render(<WhitelistPage />);
    const revokeButton = await screen.findByRole('button', { name: /Revoke/i });
    fireEvent.click(revokeButton);

    await waitFor(() => {
      expect(api.onboarding.revokeStudentInvitation).toHaveBeenCalledWith('inv-1');
    });

    expect(await screen.findByText('Invitation revoked.')).toBeDefined();
  });

  it('filters candidate invitations by search query', async () => {
    render(<WhitelistPage />);
    await screen.findByText('Aarav Sharma');

    const searchInput = screen.getByPlaceholderText('Search candidate...');
    fireEvent.change(searchInput, { target: { value: 'Aarav' } });

    expect(screen.getByText('Aarav Sharma')).toBeDefined();
    expect(screen.queryByText('Priya Patel')).toBeNull();

    fireEvent.change(searchInput, { target: { value: 'nonexistent-student' } });
    expect(
      screen.getByText(/No invitations match your search "nonexistent-student"/i),
    ).toBeDefined();
  });

  it('renders friendly empty state when batch has no members', async () => {
    vi.mocked(api.onboarding.listBatchMembers).mockResolvedValueOnce([]);
    render(<WhitelistPage />);

    expect(
      await screen.findByText(
        /No candidates in this batch yet. Candidates can be onboarded into this batch from the Batches workspace./i,
      ),
    ).toBeDefined();
  });

  it('renders friendly state when institution has no batches', async () => {
    vi.mocked(api.onboarding.listBatches).mockResolvedValueOnce([]);
    render(<WhitelistPage />);

    expect(
      await screen.findByText(
        /No cohort batches found. Candidate onboarding and cohorts are managed in the Batches workspace./i,
      ),
    ).toBeDefined();
    expect(screen.getByRole('link', { name: /Go to Batches/i })).toBeDefined();
  });

  it('sends pending batch invites when manual approval is configured', async () => {
    localStorage.setItem(
      'hirekiwi:tpo:settings:11111111-1111-4111-8111-111111111111:autoApproveInvites',
      'false',
    );
    render(<WhitelistPage />);
    const sendButton = await screen.findByRole('button', { name: /Send pending invites/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(api.onboarding.sendBatchInvites).toHaveBeenCalledWith('batch-1', expect.any(String));
    });

    expect(await screen.findByText('Pending invitations queued for email delivery.')).toBeDefined();
    localStorage.clear();
  });
});
