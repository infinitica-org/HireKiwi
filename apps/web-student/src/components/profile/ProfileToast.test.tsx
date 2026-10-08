import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileToast } from './ProfileToast';

describe('ProfileToast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows nothing without a message', () => {
    render(<ProfileToast message={null} onDismiss={() => undefined} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows the message and dismisses itself after 3 seconds', () => {
    const onDismiss = vi.fn();
    render(<ProfileToast message="GitHub disconnected." onDismiss={onDismiss} />);
    expect(screen.getByRole('status').textContent).toContain('GitHub disconnected.');

    act(() => {
      vi.advanceTimersByTime(2900);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('is not restarted by the parent re-rendering with a new callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(<ProfileToast message="Saved." onDismiss={first} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    view.rerender(<ProfileToast message="Saved." onDismiss={second} />);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('closes straight away from the X button', () => {
    const onDismiss = vi.fn();
    render(<ProfileToast message="Saved." onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
