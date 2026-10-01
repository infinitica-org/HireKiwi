import { describe, expect, it } from 'vitest';
import { EVIDENCE_TYPES } from './enums.js';
import { EVIDENCE_USAGE } from './evidence-usage.js';

describe('EVIDENCE_USAGE (S6-VV-114)', () => {
  it('explains every evidence type, with no blank field', () => {
    for (const type of EVIDENCE_TYPES) {
      const usage = EVIDENCE_USAGE[type];
      expect(usage, type).toBeDefined();
      for (const [field, text] of Object.entries(usage)) {
        expect(text.trim().length, `${type}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it('has no entry for a type that no longer exists', () => {
    expect(Object.keys(EVIDENCE_USAGE).sort()).toEqual([...EVIDENCE_TYPES].sort());
  });
});
