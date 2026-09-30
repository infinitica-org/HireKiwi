import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SmartLogo, SMART_LOGO_SRC, SMART_TEXT_LOGO_SRC, SMART_LOGO_TEXT_SRC } from '../smart-logo';

describe('SmartLogo', () => {
  it('renders the plain text logo by default', () => {
    render(<SmartLogo />);
    const img = screen.getByRole('img', { name: 'SMART' });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe(SMART_TEXT_LOGO_SRC);
  });

  it('renders the compact mark', () => {
    render(<SmartLogo kind="mark" title="SMART mark" />);
    const img = screen.getByRole('img', { name: 'SMART mark' });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe(SMART_LOGO_SRC);
  });

  it('renders the combined wordmark', () => {
    render(<SmartLogo kind="wordmark" title="SMART combined" />);
    const img = screen.getByRole('img', { name: 'SMART combined' });
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe(SMART_LOGO_TEXT_SRC);
  });
});
