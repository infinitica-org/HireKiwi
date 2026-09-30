import { describe, expect, it } from 'vitest';
import {
  extractSkillsOfflineFallback,
  extract10TrackThresholdVector,
  inferProficiency,
} from './jd-fallback-extractor.js';

describe('Th6-I610: Job Description NLP Parsing & Fallback Extraction', () => {
  it('extracts technical skills and proficiencies accurately offline without AI gateway', () => {
    const roleTitle = 'Senior Full Stack Software Engineer';
    const rawText = `
      We are looking for an expert Python and TypeScript engineer to lead our backend services.
      Required:
      - 5+ years with Python, Django, or FastAPI
      - Strong experience with PostgreSQL and SQL query optimization
      - Solid Docker and AWS cloud deployment skills
      - Familiarity with Kubernetes is a plus
    `;

    const extracted = extractSkillsOfflineFallback(roleTitle, rawText);

    expect(extracted.requiredSkills.length).toBeGreaterThan(0);
    const pythonSkill = extracted.requiredSkills.find((s) => s.skillCode.includes('PYTHON'));
    expect(pythonSkill).toBeDefined();
    // Python mention in context of "expert" or "5+ years" should map to ADVANCED or PROFESSIONAL
    expect(['ADVANCED', 'PROFESSIONAL', 'PROFICIENT']).toContain(pythonSkill?.minProficiency);

    const sqlSkill = extracted.requiredSkills.find((s) => s.skillCode.includes('SQL'));
    expect(sqlSkill).toBeDefined();

    expect(extracted.parseConfidence).toBeGreaterThanOrEqual(0.6);
    expect(extracted.emphasisedCapabilities.length).toBeGreaterThan(0);
  });

  it('maps extracted requirements against the standardized 10-track taxonomy vector', () => {
    const roleTitle = 'AI / ML Research Engineer';
    const rawText = `
      Deep learning and GenAI role focusing on Large Language Models, prompt engineering,
      and RAG pipelines using Python and PyTorch.
    `;

    const extracted = extractSkillsOfflineFallback(roleTitle, rawText);
    const thresholdVector = extract10TrackThresholdVector(roleTitle, rawText, extracted);

    expect(thresholdVector.requiredTrack).toBe('TECH_AIML');
    expect(thresholdVector.minThresholds.L1).toBeDefined();
    expect(thresholdVector.minThresholds.L2).toBeDefined();
    expect(thresholdVector.parseConfidence).toBeGreaterThan(0);
  });

  it('infers proficiency correctly from context cues', () => {
    expect(
      inferProficiency('Looking for an entry level junior with basic familiarity with Git', [
        'Git',
      ]),
    ).toBe('BEGINNER');
    expect(
      inferProficiency('Requires principal staff architect to lead systems', ['systems']),
    ).toBe('PROFESSIONAL');
  });
});
