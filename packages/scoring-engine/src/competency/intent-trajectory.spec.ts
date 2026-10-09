import { describe, expect, it } from 'vitest';
import { buildStudentTrajectory, type LevelCompletionRecord } from './intent-trajectory.js';

const day = (n: number) => new Date(2026, 0, n);

describe('buildStudentTrajectory', () => {
  it('reports LOW confidence with no completions', () => {
    const trajectory = buildStudentTrajectory('SDE', [], day(30));
    expect(trajectory.completionsConsidered).toBe(0);
    expect(trajectory.confidence).toBe('LOW');
    expect(trajectory.direction).toBe('STEADY');
  });

  it('reports LOW confidence with a single completion', () => {
    const completions: LevelCompletionRecord[] = [
      { levelNumber: 1, tierAwarded: 'SILVER', issuedAt: day(1) },
    ];
    const trajectory = buildStudentTrajectory('SDE', completions, day(10));
    expect(trajectory.confidence).toBe('LOW');
    expect(trajectory.averageDaysBetweenLevels).toBeNull();
  });

  it('classifies a steadily accelerating student correctly', () => {
    const completions: LevelCompletionRecord[] = [
      { levelNumber: 1, tierAwarded: 'SILVER', issuedAt: day(1) },
      { levelNumber: 2, tierAwarded: 'SILVER', issuedAt: day(11) },
      { levelNumber: 3, tierAwarded: 'GOLD', issuedAt: day(21) },
      { levelNumber: 4, tierAwarded: 'GOLD', issuedAt: day(25) },
    ];
    const trajectory = buildStudentTrajectory('SDE', completions, day(26));
    expect(trajectory.direction).toBe('ACCELERATING');
    expect(trajectory.confidence).toBe('MODERATE');
    expect(trajectory.tierTrendSlope).toBeGreaterThan(0);
  });

  it('classifies a student with a long gap since their last completion as STALLED', () => {
    const completions: LevelCompletionRecord[] = [
      { levelNumber: 1, tierAwarded: 'SILVER', issuedAt: day(1) },
      { levelNumber: 2, tierAwarded: 'SILVER', issuedAt: day(11) },
      { levelNumber: 3, tierAwarded: 'SILVER', issuedAt: day(21) },
    ];
    // Reference "now" is far past the student's own ~10-day pace.
    const trajectory = buildStudentTrajectory('SDE', completions, day(80));
    expect(trajectory.direction).toBe('STALLED');
    expect(trajectory.daysSinceLastCompletion).toBeGreaterThan(50);
  });

  it('highestLevelCleared reflects the max level regardless of completion order passed in', () => {
    const completions: LevelCompletionRecord[] = [
      { levelNumber: 2, tierAwarded: 'SILVER', issuedAt: day(11) },
      { levelNumber: 1, tierAwarded: 'SILVER', issuedAt: day(1) },
    ];
    const trajectory = buildStudentTrajectory('SDE', completions, day(12));
    expect(trajectory.highestLevelCleared).toBe(2);
  });
});
