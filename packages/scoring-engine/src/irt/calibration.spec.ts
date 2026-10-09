import { describe, expect, it } from 'vitest';
import { probabilityCorrect } from './two-parameter.js';
import {
  calibrateItems,
  IRT_CALIBRATION_MIN_RESPONSES,
  type IrtRawResponse,
} from './calibration.js';

/** Deterministic pseudo-random generator so synthetic-data tests never flake. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateResponses(
  trueItems: readonly { itemId: string; discrimination: number; difficulty: number }[],
  examineeCount: number,
  seed: number,
): { responses: IrtRawResponse[]; trueThetas: Map<string, number> } {
  const rand = mulberry32(seed);
  const trueThetas = new Map<string, number>();
  const responses: IrtRawResponse[] = [];

  for (let i = 0; i < examineeCount; i++) {
    const examineeId = `examinee-${i}`;
    // Spread abilities across a realistic range via Box-Muller-ish transform of uniform rand.
    const theta = (rand() - 0.5) * 6;
    trueThetas.set(examineeId, theta);

    for (const item of trueItems) {
      const p = probabilityCorrect(theta, item);
      responses.push({ examineeId, itemId: item.itemId, correct: rand() < p });
    }
  }

  return { responses, trueThetas };
}

describe('calibrateItems', () => {
  it('recovers item parameters in the right rank order from synthetic data', () => {
    const trueItems = [
      { itemId: 'easy', discrimination: 1.2, difficulty: -1.5 },
      { itemId: 'medium', discrimination: 1.5, difficulty: 0 },
      { itemId: 'hard', discrimination: 1.1, difficulty: 1.5 },
    ];
    const { responses } = generateResponses(trueItems, 300, 42);

    const result = calibrateItems(responses, { minResponsesPerItem: 100 });

    const byId = new Map(result.items.map((i) => [i.itemId, i]));
    expect(byId.get('easy')?.status).toBe('CALIBRATED');
    expect(byId.get('medium')?.status).toBe('CALIBRATED');
    expect(byId.get('hard')?.status).toBe('CALIBRATED');

    // Recovered difficulty ordering should match the generating ordering.
    // Falls back to NaN (never matches a `toBeLessThan`) rather than a `!`
    // assertion if calibration unexpectedly left a difficulty unset.
    const easyB = byId.get('easy')?.difficulty ?? Number.NaN;
    const mediumB = byId.get('medium')?.difficulty ?? Number.NaN;
    const hardB = byId.get('hard')?.difficulty ?? Number.NaN;
    expect(easyB).toBeLessThan(mediumB);
    expect(mediumB).toBeLessThan(hardB);
  });

  it('flags items below the minimum response threshold without fabricating parameters', () => {
    const responses: IrtRawResponse[] = Array.from({ length: 10 }, (_, i) => ({
      examineeId: `e${i}`,
      itemId: 'sparse-item',
      correct: i % 2 === 0,
    }));

    const result = calibrateItems(responses);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe('INSUFFICIENT_DATA');
    expect(result.items[0]?.discrimination).toBeNull();
    expect(result.items[0]?.difficulty).toBeNull();
    expect(result.items[0]?.sampleSize).toBeLessThan(IRT_CALIBRATION_MIN_RESPONSES);
  });

  it('flags items where every response is identical as non-informative', () => {
    const responses: IrtRawResponse[] = Array.from({ length: 150 }, (_, i) => ({
      examineeId: `e${i}`,
      itemId: 'all-correct',
      correct: true,
    }));

    const result = calibrateItems(responses, { minResponsesPerItem: 100 });

    expect(result.items[0]?.status).toBe('NON_INFORMATIVE');
  });

  it('is deterministic: identical input always produces identical output', () => {
    const trueItems = [{ itemId: 'a', discrimination: 1.3, difficulty: 0.2 }];
    const { responses } = generateResponses(trueItems, 150, 7);

    const first = calibrateItems(responses, { minResponsesPerItem: 100 });
    const second = calibrateItems(responses, { minResponsesPerItem: 100 });

    expect(first.items[0]?.discrimination).toBe(second.items[0]?.discrimination);
    expect(first.items[0]?.difficulty).toBe(second.items[0]?.difficulty);
    expect(first.iterations).toBe(second.iterations);
  });
});
