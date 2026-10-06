import { describe, expect, it } from 'vitest';

import { PROFILE_HEADLINES, profileHeadlineForUser } from './profile-headlines.js';

describe('profile headlines', () => {
  it('has 100 distinct, non-empty headlines', () => {
    expect(PROFILE_HEADLINES).toHaveLength(100);
    expect(new Set(PROFILE_HEADLINES).size).toBe(100);
    expect(PROFILE_HEADLINES.every((line) => line.trim().length > 0)).toBe(true);
  });

  it('always gives the same student the same headline', () => {
    const id = '0b1f4c52-7a3e-4d52-9a39-0b9f0a3d1e11';
    expect(profileHeadlineForUser(id)).toBe(profileHeadlineForUser(id));
    expect(PROFILE_HEADLINES).toContain(profileHeadlineForUser(id));
  });

  it('spreads students across many different headlines', () => {
    const used = new Set<string>();
    for (let i = 0; i < 500; i += 1) used.add(profileHeadlineForUser(`student-${i}`));
    expect(used.size).toBeGreaterThan(60);
  });
});
