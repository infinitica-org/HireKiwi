import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SmartApiError } from '@hirekiwi/api-client';

const { listConnections, connect, disconnect, lookup, invalidateQueries } = vi.hoisted(() => ({
  listConnections: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  lookup: vi.fn(),
  invalidateQueries: vi.fn(),
}));

let connections: unknown[] = [];

vi.mock('@hirekiwi/ui', () => ({
  useQuery: () => ({ data: { connections }, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock('@/lib/api', () => ({
  api: { signals: { listConnections, connect, disconnect, lookup } },
}));

import { CodingPlatformIntegrations } from './CodingPlatformIntegrations';

const FOUND_TIMEOUT = { timeout: 4000 };

function profileFor(sourceId: string, username: string) {
  return {
    sourceId,
    username,
    displayName: 'Ada Lovelace',
    avatarUrl: null,
    profileUrl: `https://example.com/${username}`,
    summary: '42 problems solved',
  };
}

function notFound(platform: string, username: string) {
  return new SmartApiError({
    error: `${platform}_user_not_found`,
    message: `No public profile found for "${username}".`,
    statusCode: 404,
  } as never);
}

/** Opens the Connect dialog and types a username; the profile check runs after a short pause. */
function openAndType(platform: string, username: string) {
  render(<CodingPlatformIntegrations pickerOpen={false} onPickerOpenChange={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: `Connect ${platform}` }));
  fireEvent.change(screen.getByLabelText(new RegExp(`${platform} username`)), {
    target: { value: username },
  });
}

describe('CodingPlatformIntegrations', () => {
  beforeEach(() => {
    connections = [];
    connect.mockReset().mockResolvedValue({});
    disconnect.mockReset().mockResolvedValue({ ok: true });
    lookup.mockReset().mockImplementation(async (sourceId: string, username: string) => {
      if (username === 'nobody') throw notFound(sourceId.toLowerCase(), username);
      return profileFor(sourceId, username);
    });
  });
  afterEach(() => cleanup());

  it('shows LeetCode and HackerRank, and lists upcoming platforms as not connectable', () => {
    render(<CodingPlatformIntegrations pickerOpen={false} onPickerOpenChange={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'LeetCode' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'HackerRank' })).toBeTruthy();
    expect(screen.getAllByText('Not connected')).toHaveLength(2);

    cleanup();
    render(<CodingPlatformIntegrations pickerOpen onPickerOpenChange={vi.fn()} />);
    const picker = screen.getByRole('dialog', { name: 'Add integration' });
    expect(picker.textContent).toContain('Codeforces');
    expect(picker.textContent).toContain('Coming soon');
  });

  it('checks the username, shows whose profile it is, and connects after select + consent', async () => {
    openAndType('LeetCode', 'https://leetcode.com/u/ada_l/');

    // The profile (name, handle, stats) appears below the box.
    const card = await screen.findByRole('radio', { name: 'Select Ada Lovelace' }, FOUND_TIMEOUT);
    expect(card.textContent).toContain('@ada_l');
    expect(card.textContent).toContain('42 problems solved');
    expect(lookup).toHaveBeenCalledWith('LEETCODE', 'ada_l');

    // Consent is on screen from the start, but Connect stays locked until both are done.
    const consent = screen.getByRole('checkbox', { name: /I agree/ });
    const connectButton = screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement;
    expect(connectButton.disabled).toBe(true);
    fireEvent.click(consent);
    expect(connectButton.disabled).toBe(true); // profile not selected yet
    fireEvent.click(card);
    expect(card.getAttribute('aria-checked')).toBe('true');
    expect(connectButton.disabled).toBe(false);

    fireEvent.click(connectButton);
    await waitFor(() =>
      expect(connect).toHaveBeenCalledWith('LEETCODE', { leetcodeUsername: 'ada_l' }),
    );
    expect(invalidateQueries).toHaveBeenCalled();
    expect((await screen.findByRole('status')).textContent).toContain('LeetCode connected.');
  });

  it('shows the consent tick as soon as the dialog opens, on every platform', () => {
    for (const platform of ['LeetCode', 'HackerRank']) {
      render(<CodingPlatformIntegrations pickerOpen={false} onPickerOpenChange={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: `Connect ${platform}` }));
      const dialog = screen.getByRole('dialog', { name: `Connect ${platform}` });
      expect(dialog.textContent).toContain('What SMART will access');
      expect(dialog.textContent).toContain(`Only your own public ${platform} details`);
      expect(dialog.textContent).toContain('never ask for your password');
      expect(screen.getByRole('checkbox', { name: /I agree/ })).toBeTruthy();
      cleanup();
    }
  });

  it('says so when the username has no public profile, and will not connect it', async () => {
    openAndType('LeetCode', 'nobody');
    expect((await screen.findByRole('alert', {}, FOUND_TIMEOUT)).textContent).toContain(
      'No public LeetCode profile found for "nobody"',
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree/ }));
    expect((screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(connect).not.toHaveBeenCalled();
  });

  it('does not call a missing API route a wrong username', async () => {
    lookup
      .mockReset()
      .mockRejectedValue(
        new SmartApiError({ error: 'Not Found', message: 'Cannot POST', statusCode: 404 } as never),
      );
    openAndType('LeetCode', 'ada_l');
    const alert = await screen.findByRole('alert', {}, FOUND_TIMEOUT);
    expect(alert.textContent).toContain('Could not check LeetCode right now');
    expect(alert.textContent).not.toContain('No public');
    expect(screen.getByRole('button', { name: /Try again/ })).toBeTruthy();
  });

  it('needs a username, a selected profile and consent before it connects', async () => {
    openAndType('HackerRank', 'ada_hr');
    const connectButton = screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement;
    expect(connectButton.disabled).toBe(true);

    // Enter in the field must not get around anything.
    fireEvent.keyDown(screen.getByLabelText(/HackerRank username/), { key: 'Enter' });
    expect(connect).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/Select your profile|find first/);

    await screen.findByRole('radio', { name: /Select/ }, FOUND_TIMEOUT);
    fireEvent.click(screen.getByRole('radio', { name: /Select/ }));
    expect(connectButton.disabled).toBe(true); // consent still missing
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree/ }));
    expect(connectButton.disabled).toBe(false);
  });

  it('forgets the selection when the username changes', async () => {
    openAndType('LeetCode', 'ada_l');
    const card = await screen.findByRole('radio', { name: /Select/ }, FOUND_TIMEOUT);
    fireEvent.click(card);
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree/ }));
    expect((screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement).disabled).toBe(
      false,
    );

    fireEvent.change(screen.getByLabelText(/LeetCode username/), { target: { value: 'ada_two' } });
    expect((screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('shows what is being read only on a connected card', () => {
    connections = [
      {
        sourceId: 'LEETCODE',
        externalAccountId: 'ada_l',
        consentScopes: ['public_profile'],
        connectedAt: '2026-10-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'ACTIVE',
      },
    ];
    render(<CodingPlatformIntegrations pickerOpen={false} onPickerOpenChange={vi.fn()} />);
    expect(screen.getAllByText(/Reading only your public details/)).toHaveLength(1);
    expect(screen.getByText(/first sync pending/)).toBeTruthy();
  });

  it('does not ask for consent or a new check when editing a connected account unchanged', () => {
    connections = [
      {
        sourceId: 'LEETCODE',
        externalAccountId: 'ada_l',
        consentScopes: ['public_profile'],
        connectedAt: '2026-10-01T00:00:00.000Z',
        lastFetchedAt: '2026-10-02T09:30:00.000Z',
        status: 'ACTIVE',
      },
    ];
    render(<CodingPlatformIntegrations pickerOpen={false} onPickerOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit LeetCode' }));
    expect(screen.queryByRole('checkbox', { name: /I agree/ })).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect(lookup).not.toHaveBeenCalled();
  });

  it('shows the connected handle and lets the student disconnect', async () => {
    connections = [
      {
        sourceId: 'HACKERRANK',
        externalAccountId: 'ada',
        consentScopes: [],
        connectedAt: '2026-10-01T00:00:00.000Z',
        lastFetchedAt: null,
        status: 'ACTIVE',
      },
    ];
    render(<CodingPlatformIntegrations pickerOpen={false} onPickerOpenChange={vi.fn()} />);
    expect(screen.getByText('@ada')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Edit HackerRank' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    await waitFor(() => expect(disconnect).toHaveBeenCalledWith('HACKERRANK'));
    expect((await screen.findByRole('status')).textContent).toContain('HackerRank disconnected.');
  });
});
