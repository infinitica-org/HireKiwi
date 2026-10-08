import { describe, expect, it } from 'vitest';
import { probabilityCorrect } from './two-parameter.js';
import { recalibrateLevel, type IrtItemParameterRecord } from './recalibration.js';
import type { IrtRawResponse } from './calibration.js';

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

/**
 * Generates responses across multiple items per examinee. A single item per
 * examinee is mathematically degenerate for JMLE — ability and item
 * parameters aren't separable from one data point per person — so the
 * checksum-stability test below needs a realistic item pool, not one item.
 */
function generateLevelResponses(
  itemSpecs: readonly { itemId: string; discrimination: number; difficulty: number }[],
  examineeCount: number,
  seed: number,
): IrtRawResponse[] {
  const rand = mulberry32(seed);
  const responses: IrtRawResponse[] = [];
  for (let i = 0; i < examineeCount; i++) {
    const examineeId = `e${i}`;
    const theta = (rand() - 0.5) * 6;
    for (const item of itemSpecs) {
      const p = probabilityCorrect(theta, item);
      responses.push({ examineeId, itemId: item.itemId, correct: rand() < p });
    }
  }
  return responses;
}

function generateResponses(itemId: string, n: number, a: number, b: number, seed: number) {
  const rand = mulberry32(seed);
  const responses: IrtRawResponse[] = [];
  for (let i = 0; i < n; i++) {
    const theta = (rand() - 0.5) * 6;
    const p = probabilityCorrect(theta, { itemId, discrimination: a, difficulty: b });
    responses.push({ examineeId: `e${i}`, itemId, correct: rand() < p });
  }
  return responses;
}

describe('recalibrateLevel', () => {
  it('publishes parameters for an item with enough responses and no previous record', () => {
    const responses = generateResponses('item-1', 200, 1.3, 0.2, 1);
    const report = recalibrateLevel('level-1', responses, new Map());

    const outcome = report.items.find((i) => i.itemId === 'item-1');
    expect(outcome).toBeDefined();
    expect(outcome?.published).toBe(true);
    expect(outcome?.next).not.toBeNull();
    expect(outcome?.previous).toBeNull();
  });

  it('freezes an under-sampled item and keeps its previous published parameters', () => {
    const previous: IrtItemParameterRecord = {
      itemId: 'item-2',
      discrimination: 1.1,
      difficulty: -0.3,
      sampleSize: 150,
      modelVersion: 'irt-2pl-jmle-v1',
    };
    const sparseResponses: IrtRawResponse[] = Array.from({ length: 10 }, (_, i) => ({
      examineeId: `e${i}`,
      itemId: 'item-2',
      correct: i % 2 === 0,
    }));

    const report = recalibrateLevel('level-1', sparseResponses, new Map([['item-2', previous]]));

    const outcome = report.items.find((i) => i.itemId === 'item-2');
    expect(outcome).toBeDefined();
    expect(outcome?.published).toBe(false);
    expect(outcome?.next).toEqual(previous);
    expect(outcome?.reason).toMatch(/Frozen/);
  });

  it('produces a stable checksum for an identical run and a different one for changed input', () => {
    const itemSpecs = [
      { itemId: 'item-a', discrimination: 1.0, difficulty: -1 },
      { itemId: 'item-b', discrimination: 1.3, difficulty: 0 },
      { itemId: 'item-c', discrimination: 1.1, difficulty: 1 },
    ];
    const responses = generateLevelResponses(itemSpecs, 200, 5);
    const reportA = recalibrateLevel('level-1', responses, new Map());
    const reportB = recalibrateLevel('level-1', responses, new Map());
    const reportC = recalibrateLevel(
      'level-1',
      generateLevelResponses(itemSpecs, 200, 6),
      new Map(),
    );

    expect(reportA.checksum).toBe(reportB.checksum);
    expect(reportA.checksum).not.toBe(reportC.checksum);
  });
});
