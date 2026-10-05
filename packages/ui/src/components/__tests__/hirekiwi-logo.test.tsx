import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  HireKiwiLogo,
  SmartLogo,
  HIREKIWI_LOGO_SRC,
  HIREKIWI_TEXT_LOGO_SRC,
  HIREKIWI_LOGO_TEXT_SRC,
} from '../hirekiwi-logo';

describe('HireKiwiLogo', () => {
  it('renders the plain text logo by default', () => {
    render(<HireKiwiLogo />);
    const img = screen.getByRole('img', { name: 'HireKiwi' });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe(HIREKIWI_TEXT_LOGO_SRC);
  });

  it('renders the compact mark', () => {
    render(<HireKiwiLogo kind="mark" title="HireKiwi mark" />);
    const img = screen.getByRole('img', { name: 'HireKiwi mark' });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe(HIREKIWI_LOGO_SRC);
  });

  it('renders the combined wordmark', () => {
    render(<HireKiwiLogo kind="wordmark" title="HireKiwi combined" />);
    const img = screen.getByRole('img', { name: 'HireKiwi combined' });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe(HIREKIWI_LOGO_TEXT_SRC);
  });

  it('supports SmartLogo backwards-compatible alias with custom title', () => {
    render(<SmartLogo title="SMART" />);
    const img = screen.getByRole('img', { name: 'SMART' });
    expect(img).toBeDefined();
  });
});
