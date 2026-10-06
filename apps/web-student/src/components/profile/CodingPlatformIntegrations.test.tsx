import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { listConnections, connect, disconnect, invalidateQueries } = vi.hoisted(() => ({
  listConnections: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  invalidateQueries: vi.fn(),
}));

let connections: unknown[] = [];

vi.mock('@hirekiwi/ui', () => ({
  useQuery: () => ({ data: { connections }, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock('@/lib/api', () => ({
  api: { signals: { listConnections, connect, disconnect } },
}));

import { CodingPlatformIntegrations } from './CodingPlatformIntegrations';

describe('CodingPlatformIntegrations', () => {
  beforeEach(() => {
    connections = [];
    connect.mockReset().mockResolvedValue({});
    disconnect.mockReset().mockResolvedValue({ ok: true });
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

  it('connects LeetCode with the username taken from a pasted profile URL', async () => {
    render(<CodingPlatformIntegrations pickerOpen={false} onPickerOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Connect LeetCode' }));
    fireEvent.change(screen.getByLabelText(/LeetCode username/), {
      target: { value: 'https://leetcode.com/u/ada_l/' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() =>
      expect(connect).toHaveBeenCalledWith('LEETCODE', { leetcodeUsername: 'ada_l' }),
    );
    expect(invalidateQueries).toHaveBeenCalled();
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
  });
});
