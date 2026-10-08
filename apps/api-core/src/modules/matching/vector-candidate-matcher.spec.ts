import { describe, expect, it } from 'vitest';
import {
  cosineSimilarity,
  requirementCoverage,
  matchCandidatesWithVectorSimilarity,
  toCandidateMatchDtoFromVector,
  buildJobVectorFromRequiredSkills,
  UNSCOPED_SEARCH_BASELINE_VECTOR,
  type CandidateVectorProfile,
} from './vector-candidate-matcher.js';

describe('Th6-I611: Semantic Vector Candidate Matcher with Privacy Opt-Out Enforcement', () => {
  const sampleCandidates: CandidateVectorProfile[] = [
    {
      studentId: 'student-opted-in-gold',
      studentName: 'Alice Star',
      trackCode: 'TECH_FULLSTACK',
      certificateId: 'cert-1',
      highestLevelCleared: 3,
      headlineTier: 'GOLD',
      discoverableToEmployers: true,
      isDeactivated: false,
      isHeld: false,
      verifiedSkills: [
        {
          code: 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT',
          domain: 'A',
          proficiency: 'PROFESSIONAL',
        },
        { code: 'SQL_QUERY_OPTIMIZATION', domain: 'C', proficiency: 'ADVANCED' },
      ],
      domainCompetencies: { A: 0.95, B: 0.9, C: 0.85, D: 0.8, E: 0.8 },
    },
    {
      studentId: 'student-opted-out',
      studentName: 'Bob Hidden',
      trackCode: 'TECH_FULLSTACK',
      certificateId: 'cert-2',
      highestLevelCleared: 4,
      headlineTier: 'GOLD',
      discoverableToEmployers: false, // OPTED OUT OF DISCOVERY
      isDeactivated: false,
      isHeld: false,
      verifiedSkills: [
        {
          code: 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT',
          domain: 'A',
          proficiency: 'PROFESSIONAL',
        },
      ],
      domainCompetencies: { A: 1.0, B: 1.0, C: 1.0, D: 1.0, E: 1.0 },
    },
    {
      studentId: 'student-deactivated',
      studentName: 'Charlie Inactive',
      trackCode: 'TECH_FULLSTACK',
      certificateId: null,
      highestLevelCleared: 1,
      headlineTier: 'BRONZE',
      discoverableToEmployers: true,
      isDeactivated: true, // DEACTIVATED ACCOUNT
      isHeld: false,
      verifiedSkills: [],
      domainCompetencies: { A: 0.5, B: 0.5, C: 0.5, D: 0.5, E: 0.5 },
    },
    {
      studentId: 'student-opted-in-silver',
      studentName: 'Diana Normal',
      trackCode: 'TECH_FULLSTACK',
      certificateId: 'cert-3',
      highestLevelCleared: 2,
      headlineTier: 'SILVER',
      discoverableToEmployers: true,
      isDeactivated: false,
      isHeld: false,
      verifiedSkills: [
        {
          code: 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT',
          domain: 'A',
          proficiency: 'INTERMEDIATE',
        },
      ],
      domainCompetencies: { A: 0.6, B: 0.6, C: 0.5, D: 0.4, E: 0.4 },
    },
  ];

  it('calculates mathematical cosine similarity correctly in bounds [0, 1]', () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0);

    const v3 = [0, 1, 0];
    expect(cosineSimilarity(v1, v3)).toBeCloseTo(0.0);
  });

  it('strictly excludes candidates with employer_discoverability = false or inactive status', () => {
    const jobVector = [0.8, 0.8, 0.8, 0.6, 0.6, 1.0];
    const { ranked, excludedByPrivacyCount, durationMs } = matchCandidatesWithVectorSimilarity(
      sampleCandidates,
      jobVector,
    );

    // 2 candidates excluded: 1 opted-out, 1 deactivated
    expect(excludedByPrivacyCount).toBe(2);
    expect(ranked.find((c) => c.studentId === 'student-opted-out')).toBeUndefined();
    expect(ranked.find((c) => c.studentId === 'student-deactivated')).toBeUndefined();

    // Alice should be ranked #1
    expect(ranked[0]?.studentId).toBe('student-opted-in-gold');
    expect(ranked[0]?.headlineTier).toBe('GOLD');
    expect(ranked[0]?.matchPercentage).toBeGreaterThanOrEqual(80);

    // Query performance requirement: under 200ms
    expect(durationMs).toBeLessThan(200);
  });

  it('returns a multi-axis radar chart competency breakdown for matched candidates', () => {
    const jobVector = [0.7, 0.7, 0.7, 0.5, 0.5, 0.67];
    const { ranked } = matchCandidatesWithVectorSimilarity(sampleCandidates, jobVector);

    const candidate = ranked[0];
    expect(candidate).toBeDefined();
    expect(candidate?.radarBreakdown.length).toBe(5); // Domains A to E
    expect(candidate?.radarBreakdown[0]?.axis).toBe('Domain A');
    expect(candidate?.radarBreakdown[0]?.candidateScore).toBeGreaterThan(0);
    expect(candidate?.radarBreakdown[0]?.requiredScore).toBe(0.7);

    if (!candidate) throw new Error('expected a candidate');
    const dto = toCandidateMatchDtoFromVector(candidate);
    expect(dto.method).toBe('HYBRID');
    expect(dto.similarityScore).toBeGreaterThan(0);
  });

  it('weights similarity by how much of each requirement is met', () => {
    expect(requirementCoverage([0.9, 0.9], [0.8, 0.6])).toBe(1);
    expect(requirementCoverage([0.4, 0.6], [0.8, 0.6])).toBeCloseTo(0.75);
  });

  describe('S8-RM-XX follow-up: buildJobVectorFromRequiredSkills', () => {
    it('falls back to the unscoped baseline when the search has no job to derive a vector from', () => {
      expect(buildJobVectorFromRequiredSkills([])).toEqual([...UNSCOPED_SEARCH_BASELINE_VECTOR]);
    });

    it('derives a higher target vector for a job requiring senior proficiency than one requiring beginner', () => {
      const seniorVector = buildJobVectorFromRequiredSkills([
        { minProficiency: 'PROFESSIONAL' },
        { minProficiency: 'ADVANCED' },
      ]);
      const juniorVector = buildJobVectorFromRequiredSkills([{ minProficiency: 'BEGINNER' }]);

      expect(seniorVector.every((v) => v > (juniorVector[0] ?? 0))).toBe(true);
      // Flattened across all 5 domain axes + tier (see function doc: skill_claims.domain never
      // actually holds an A-E code, so candidate vectors can't be compared per-domain yet).
      expect(new Set(seniorVector).size).toBe(1);
      expect(seniorVector).toHaveLength(6);
    });

    it('ignores an unset minProficiency as a neutral/low signal rather than crashing', () => {
      const vector = buildJobVectorFromRequiredSkills([{}]);
      expect(vector).toHaveLength(6);
      expect(vector.every((v) => v >= 0 && v <= 1)).toBe(true);
    });
  });
});
