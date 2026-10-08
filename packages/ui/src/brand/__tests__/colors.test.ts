import { describe, expect, it } from 'vitest';
import { HIREKIWI_BRAND_TEAL, HIREKIWI_MARK_TEAL } from '../colors';

describe('HireKiwi brand colors', () => {
  it('does not use legacy neon teal #00fad0', () => {
    expect(HIREKIWI_BRAND_TEAL.toLowerCase()).not.toBe('#00fad0');
    expect(HIREKIWI_MARK_TEAL.toLowerCase()).not.toBe('#00fad0');
  });

  it('exports a single canonical mark teal', () => {
    expect(HIREKIWI_MARK_TEAL).toBe(HIREKIWI_BRAND_TEAL);
    expect(HIREKIWI_BRAND_TEAL).toBe('#14b8a6');
  });
});
