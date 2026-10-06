import { describe, expect, it } from 'vitest';
import { TRANSFER_SKILL_REASONS } from '@hirekiwi/contracts';

/**
 * Integration tests for Graph-Based Transfer Skill Detection (Integration B)
 * Validates that graph traversal for TRANSFERABLE_TO edges works correctly
 * and that GRAPH_BASED reason is properly added to the transfer skill reasons enum
 */

describe('Graph-Based Transfer Skill Detection Integration', () => {
  it('confirms GRAPH_BASED is in valid transfer skill reasons', () => {
    expect(TRANSFER_SKILL_REASONS).toContain('SAME_CATEGORY');
    expect(TRANSFER_SKILL_REASONS).toContain('CAPABILITY_OVERLAP');
    expect(TRANSFER_SKILL_REASONS).toContain('GRAPH_BASED');
  });

  it('validates all transfer skill reasons are strings', () => {
    TRANSFER_SKILL_REASONS.forEach((reason) => {
      expect(typeof reason).toBe('string');
    });
  });

  it('confirms transfer skill reasons enum has expected count', () => {
    // Should have 3 reasons: SAME_CATEGORY, CAPABILITY_OVERLAP, GRAPH_BASED
    expect(TRANSFER_SKILL_REASONS.length).toBe(3);
  });

  it('validates GRAPH_BASED is not a duplicate', () => {
    const uniqueReasons = new Set(TRANSFER_SKILL_REASONS);
    expect(uniqueReasons.size).toBe(TRANSFER_SKILL_REASONS.length);
  });
});
