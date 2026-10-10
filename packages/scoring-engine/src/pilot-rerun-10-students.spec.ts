import { Effect } from 'effect';
import { describe, it } from 'vitest';
import {
  getSkillBlueprint,
  type FusionInput,
  type ObservationBundle,
  type ProficiencyLevel,
} from '@hirekiwi/contracts';
import {
  rollupItemResultsToCompetencies,
  determineSupportedProficiency,
  assessmentToObservationBundle,
  fuseDomainCapability,
  type ScoredCompetencyItem,
} from './index.js';

/**
 * Rerun of the Oct 6, 2026 "Proficiency Run Report" (10 synthetic students + 3
 * upgrade/veto probes, skill PYTHON_APPLICATION_BACKEND_DEVELOPMENT) against the
 * live @hirekiwi/scoring-engine pipeline, since the original runner script was
 * not found committed anywhere in the repo. Inputs below are transcribed
 * verbatim from docs/pipelineValidation/proficiencyValidationReportV0.1.pdf.
 */

const blueprint = getSkillBlueprint('PYTHON_APPLICATION_BACKEND_DEVELOPMENT');
if (!blueprint) throw new Error('PYTHON_APPLICATION_BACKEND_DEVELOPMENT blueprint not found');

// C1..C6 in blueprint competencyModel order
const [C1, C2, C3, C4, C5, C6] = blueprint.competencyModel.map((c) => c.competencyId);
const CAP = Object.fromEntries(
  blueprint.competencyModel.map((c) => [c.competencyId, c.capability]),
);

type Marks = [number, number, number, number, number, number]; // C1..C6, out of 20
type ProjectClaim = 'DEMONSTRATED' | 'PARTIALLY_DEMONSTRATED' | 'UNCERTAIN' | 'NOT_DEMONSTRATED';

interface ProjectEvidence {
  trustTier: 'TRUSTED' | 'PROVISIONAL' | 'UNTRUSTED';
  raterRatings: number[];
  ageDays: number;
  claims: [ProjectClaim, ProjectClaim, ProjectClaim, ProjectClaim, ProjectClaim, ProjectClaim];
}

interface StudentCase {
  id: string;
  marks: Marks;
  project: ProjectEvidence | null;
}

const CASES: StudentCase[] = [
  // Good tier
  {
    id: 'G1 - Aditi',
    marks: [19, 19, 18, 17, 16, 15],
    project: {
      trustTier: 'TRUSTED',
      raterRatings: [5, 5, 5],
      ageDays: 20,
      claims: [
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
      ],
    },
  },
  {
    id: 'G2 - Rohan',
    marks: [20, 18, 18, 16, 14, 10],
    project: {
      trustTier: 'TRUSTED',
      raterRatings: [5, 4, 5],
      ageDays: 45,
      claims: [
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
      ],
    },
  },
  {
    id: 'G3 - Sneha',
    marks: [19, 19, 17, 16, 15, 14],
    project: {
      trustTier: 'TRUSTED',
      raterRatings: [4, 5, 4],
      ageDays: 60,
      claims: [
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'UNCERTAIN',
      ],
    },
  },
  { id: 'G4 - Karthik', marks: [18, 18, 17, 16, 15, 13], project: null },
  // Average tier
  {
    id: 'A1 - Megha',
    marks: [16, 14, 11, 9, 5, 2],
    project: {
      trustTier: 'PROVISIONAL',
      raterRatings: [3, 3, 4],
      ageDays: 150,
      claims: [
        'PARTIALLY_DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'UNCERTAIN',
        'UNCERTAIN',
        'NOT_DEMONSTRATED',
      ],
    },
  },
  {
    id: 'A2 - Farhan',
    marks: [15, 13, 10, 8, 4, 1],
    project: {
      trustTier: 'PROVISIONAL',
      raterRatings: [3, 3, 3],
      ageDays: 200,
      claims: [
        'PARTIALLY_DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'UNCERTAIN',
        'UNCERTAIN',
        'NOT_DEMONSTRATED',
      ],
    },
  },
  {
    id: 'A3 - Priya',
    marks: [17, 16, 6, 9, 3, 0],
    project: {
      trustTier: 'PROVISIONAL',
      raterRatings: [3, 2, 3],
      ageDays: 120,
      claims: [
        'PARTIALLY_DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'UNCERTAIN',
        'UNCERTAIN',
        'NOT_DEMONSTRATED',
        'NOT_DEMONSTRATED',
      ],
    },
  },
  // Beginner tier
  { id: 'B1 - Ishaan', marks: [15, 9, 3, 1, 0, 0], project: null },
  {
    id: 'B2 - Divya',
    marks: [7, 4, 2, 0, 0, 0],
    project: {
      trustTier: 'UNTRUSTED',
      raterRatings: [2, 1, 2],
      ageDays: 300,
      claims: [
        'UNCERTAIN',
        'UNCERTAIN',
        'NOT_DEMONSTRATED',
        'NOT_DEMONSTRATED',
        'NOT_DEMONSTRATED',
        'NOT_DEMONSTRATED',
      ],
    },
  },
  { id: 'B3 - Yusuf', marks: [16, 15, 4, 2, 0, 0], project: null },
  // Upgrade/veto probes — identical weak assessment, varied independent project evidence
  {
    id: 'T1 probe',
    marks: [14, 12, 9, 7, 3, 1],
    project: {
      trustTier: 'TRUSTED',
      raterRatings: [5, 5, 5],
      ageDays: 10,
      claims: [
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
      ],
    },
  },
  {
    id: 'T2 probe',
    marks: [14, 12, 9, 7, 3, 1],
    project: {
      trustTier: 'PROVISIONAL',
      raterRatings: [4, 4, 3],
      ageDays: 60,
      claims: [
        'DEMONSTRATED',
        'DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'UNCERTAIN',
        'NOT_DEMONSTRATED',
      ],
    },
  },
  {
    id: 'T3 probe',
    marks: [14, 12, 9, 7, 3, 1],
    project: {
      trustTier: 'TRUSTED',
      raterRatings: [5, 4, 5],
      ageDays: 10,
      claims: [
        'DEMONSTRATED',
        'DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'PARTIALLY_DEMONSTRATED',
        'UNCERTAIN',
        'NOT_DEMONSTRATED',
      ],
    },
  },
];

const COMPETENCY_ORDER = [C1, C2, C3, C4, C5, C6];

function buildProjectBundle(project: ProjectEvidence): ObservationBundle {
  return {
    sourceId: 'PROJECT',
    available: true,
    trustTier: project.trustTier,
    observations: COMPETENCY_ORDER.map((competencyId, i) => ({
      competencyId,
      capability: CAP[competencyId],
      claimedStatus: project.claims[i],
      evidence: [`project evidence for ${CAP[competencyId]}`],
    })),
    metadata: {
      testedItemCount: COMPETENCY_ORDER.length,
      projectReport: {
        scores: { raterRatings: project.raterRatings },
        ageDays: project.ageDays,
      },
    },
  };
}

async function runCase(c: StudentCase) {
  const items: ScoredCompetencyItem[] = COMPETENCY_ORDER.map((competencyId, i) => ({
    competencyIds: [competencyId],
    marksEarned: c.marks[i],
    marksMax: 20,
  }));

  const competencyResults = rollupItemResultsToCompetencies({
    competencyModel: blueprint.competencyModel,
    items,
  });

  const assessmentOnlyLevel = determineSupportedProficiency(
    competencyResults,
    blueprint.proficiencyRequirements,
  );

  const assessmentBundle = assessmentToObservationBundle({
    competencyResults,
    testedItemCount: items.length,
    proctoringRiskHigh: false,
    competencyModel: blueprint.competencyModel,
  });

  const sources: ObservationBundle[] = c.project
    ? [assessmentBundle, buildProjectBundle(c.project)]
    : [assessmentBundle];

  const targetProficiency: ProficiencyLevel = 'PROFESSIONAL';

  const fusionInput: FusionInput = {
    competencyModel: blueprint.competencyModel,
    proficiencyRequirements: blueprint.proficiencyRequirements,
    sources,
    targetProficiency,
    proctoringRiskHigh: false,
    ruleSetVersion: 'v1',
  };

  const result = await Effect.runPromise(fuseDomainCapability(fusionInput));

  return {
    id: c.id,
    assessmentOnlyLevel: assessmentOnlyLevel ?? 'NONE',
    fusedProficiency: result.inferredDomainProficiency ?? 'NONE',
    reason: result.proficiencyInferenceReason ?? '-',
    confidence: result.confidence,
    activeSources: result.activeSources.join('+'),
    gaps: result.capabilityGaps.length,
    nextStep: result.recommendedNextStep,
  };
}

describe('pilot rerun — 10 students + 3 probes (proficiencyValidationReportV0.1.pdf)', () => {
  it('reruns the real fusion pipeline and prints the comparison table', async () => {
    const rows = [];
    for (const c of CASES) {
      rows.push(await runCase(c));
    }
    console.table(rows);
  });
});
