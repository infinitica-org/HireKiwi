import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TeammatesPage from './page';

const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RECRUITER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const employer = vi.hoisted(() => ({
  listMembers: vi.fn(),
  inviteRecruiter: vi.fn(),
  changeMemberRole: vi.fn(),
  deactivateMember: vi.fn(),
  reactivateMember: vi.fn(),
  listJoinRequests: vi.fn(),
  approveJoinRequest: vi.fn(),
  rejectJoinRequest: vi.fn(),
}));
const account = vi.hoisted(() => ({ userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }));

vi.mock('@/lib/api', () => ({ api: { employer } }));
vi.mock('@/lib/use-company-account', () => ({
  useCompanyAccount: () => ({ data: { userId: account.userId } }),
}));

const member = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  fullName: id === OWNER ? 'Olivia Owner' : 'Ravi Recruiter',
  email: `${id.slice(0, 4)}@acme.test`,
  role: id === OWNER ? 'OWNER' : 'RECRUITER',
  status: 'ACTIVE',
  deactivatedAt: null,
  ...over,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TeammatesPage />
    </QueryClientProvider>,
  );
}

describe('Teammates page (Th6-351/352/353)', () => {
  beforeEach(() => {
    account.userId = OWNER;
    Object.values(employer).forEach((fn) => fn.mockReset());
    employer.listJoinRequests.mockResolvedValue({ requests: [] });
  });
  afterEach(cleanup);

  it('shows a loading state, then the empty state', async () => {
    employer.listMembers.mockResolvedValue({ members: [] });
    renderPage();
    expect(screen.getByText('Loading team members…')).toBeTruthy();
    expect(await screen.findByText('No teammates yet')).toBeTruthy();
  });

  it('shows an error state that can retry', async () => {
    employer.listMembers.mockRejectedValueOnce(new Error('down'));
    renderPage();
    expect(await screen.findByText('Could not load your team')).toBeTruthy();
    employer.listMembers.mockResolvedValue({ members: [member(OWNER)] });
    fireEvent.click(screen.getByRole('button', { name: /retry|try again/i }));
    expect(await screen.findByText('Olivia Owner (you)')).toBeTruthy();
  });

  it('lets an owner change roles with an Idempotency-Key', async () => {
    employer.listMembers.mockResolvedValue({ members: [member(OWNER), member(RECRUITER)] });
    employer.changeMemberRole.mockResolvedValue(member(RECRUITER, { role: 'OWNER' }));
    renderPage();
    const select = await screen.findByLabelText('Role for Ravi Recruiter');
    fireEvent.change(select, { target: { value: 'OWNER' } });
    await waitFor(() => expect(employer.changeMemberRole).toHaveBeenCalled());
    const [id, body, key] = employer.changeMemberRole.mock.calls[0] ?? [];
    expect([id, body]).toEqual([RECRUITER, { role: 'OWNER' }]);
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(8);
  });

  it('deactivates only after confirming in the dialog, handing work to a teammate', async () => {
    employer.listMembers.mockResolvedValue({
      members: [member(OWNER), member(RECRUITER), member('cccccccc-cccc-4ccc-8ccc-cccccccccccc')],
    });
    employer.deactivateMember.mockResolvedValue(member(RECRUITER, { status: 'DEACTIVATED' }));
    renderPage();
    const buttons = await screen.findAllByRole('button', { name: 'Deactivate' });
    fireEvent.click(buttons[0] as HTMLElement);
    expect(employer.deactivateMember).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Hand over/), {
      target: { value: OWNER },
    });
    const confirm = screen.getAllByRole('button', { name: 'Deactivate' }).at(-1) as HTMLElement;
    fireEvent.click(confirm);
    await waitFor(() => expect(employer.deactivateMember).toHaveBeenCalledTimes(1));
    expect(employer.deactivateMember.mock.calls[0]?.[1]).toEqual({ reassignToMemberId: OWNER });
  });

  it('shows the server message when the last owner cannot be demoted', async () => {
    const { HireKiwiApiError } = await import('@hirekiwi/api-client');
    employer.listMembers.mockResolvedValue({ members: [member(OWNER)] });
    employer.changeMemberRole.mockRejectedValue(
      new HireKiwiApiError({
        error: 'last_owner',
        message: 'A company must always have at least one owner.',
        statusCode: 409,
      } as never),
    );
    renderPage();
    fireEvent.change(await screen.findByLabelText('Role for Olivia Owner'), {
      target: { value: 'RECRUITER' },
    });
    expect(await screen.findByText(/at least one owner/)).toBeTruthy();
  });

  it('hides owner-only controls from a recruiter', async () => {
    account.userId = RECRUITER;
    employer.listMembers.mockResolvedValue({ members: [member(OWNER), member(RECRUITER)] });
    renderPage();
    await screen.findByText('Ravi Recruiter (you)');
    expect(screen.queryByRole('button', { name: /Invite recruiter/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).toBeNull();
    expect(screen.queryByLabelText('Role for Olivia Owner')).toBeNull();
  });

  it('shows the server 422 message for an invite to another domain', async () => {
    const { HireKiwiApiError } = await import('@hirekiwi/api-client');
    employer.listMembers.mockResolvedValue({ members: [member(OWNER)] });
    employer.inviteRecruiter.mockRejectedValue(
      new HireKiwiApiError({
        error: 'email_domain_mismatch',
        message: 'Invitee email must be on acme.test.',
        statusCode: 409,
      } as never),
    );
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Invite recruiter/ }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sam Lee' } });
    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'sam@gmail.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));
    expect(await screen.findByText('Invitee email must be on acme.test.')).toBeTruthy();
  });
});

describe('Teammates page join requests (S6-VV-108)', () => {
  const request = {
    joinRequestId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    companyId: 'c-1',
    companyName: 'Acme',
    email: 'riya@acme.test',
    fullName: 'Riya Rao',
    status: 'PENDING',
    reason: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    decidedAt: null,
  };

  beforeEach(() => {
    account.userId = OWNER;
    Object.values(employer).forEach((fn) => fn.mockReset());
    employer.listMembers.mockResolvedValue({ members: [member(OWNER)] });
  });
  afterEach(cleanup);

  it('lets an owner approve a pending request', async () => {
    employer.listJoinRequests
      .mockResolvedValueOnce({ requests: [request] })
      .mockResolvedValue({ requests: [] });
    employer.approveJoinRequest.mockResolvedValue({ ...request, status: 'APPROVED' });
    renderPage();

    expect(await screen.findByText('Requests to join (1)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() =>
      expect(employer.approveJoinRequest).toHaveBeenCalledWith(request.joinRequestId),
    );
    await waitFor(() => expect(screen.queryByText('Requests to join (1)')).toBeNull());
  });

  it('declines with the reason the owner typed', async () => {
    employer.listJoinRequests.mockResolvedValue({ requests: [request] });
    employer.rejectJoinRequest.mockResolvedValue({ ...request, status: 'REJECTED' });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Decline' }));
    fireEvent.change(screen.getByLabelText(/Reason shown to Riya Rao/), {
      target: { value: 'Not on our team.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Decline request' }));

    await waitFor(() =>
      expect(employer.rejectJoinRequest).toHaveBeenCalledWith(request.joinRequestId, {
        reason: 'Not on our team.',
      }),
    );
  });

  it('shows nothing to a recruiter', async () => {
    account.userId = RECRUITER;
    employer.listMembers.mockResolvedValue({ members: [member(OWNER), member(RECRUITER)] });
    employer.listJoinRequests.mockResolvedValue({ requests: [request] });
    renderPage();
    expect(await screen.findByText('Olivia Owner')).toBeTruthy();
    expect(screen.queryByText(/Requests to join/)).toBeNull();
    expect(employer.listJoinRequests).not.toHaveBeenCalled();
  });
});
