import {
  SKILL_CODE_SET,
  SKILL_DEFINITIONS,
  TRACK_CODES,
  TRACK_DEFINITIONS,
  getSkillBlueprint,
  type CertifiableTier,
  type JdSkillExtractVector,
  type JdThresholdVector,
  type SkillProficiency,
  type SkillRequirement,
  type TrackCode,
} from '@hirekiwi/contracts';

/**
 * Keyword-to-proficiency indicators for heuristic JD extraction.
 */
const PROFICIENCY_KEYWORDS: Array<{ level: SkillProficiency; patterns: RegExp[] }> = [
  {
    level: 'PROFESSIONAL',
    patterns: [/\b(principal|staff|architect|director|head of)\b/i],
  },
  {
    level: 'ADVANCED',
    patterns: [/\b(expert|mastery|deep experience|5\+ years|extensive)\b/i, /\b(lead|senior)\b/i],
  },
  {
    level: 'PROFICIENT',
    patterns: [/\b(proficient|strong|production|solid|3\+ years|hands-on)\b/i],
  },
  {
    level: 'INTERMEDIATE',
    patterns: [/\b(intermediate|competent|working knowledge|2\+ years)\b/i],
  },
  {
    level: 'BEGINNER',
    patterns: [/\b(exposure|familiar|basic|beginner|foundational|entry level)\b/i],
  },
];

/**
 * Common alternative skill aliases mapped to SMART taxonomy codes.
 */
const SKILL_ALIASES: Array<{ regex: RegExp; skillCode: string }> = [
  {
    regex: /\b(python|django|fastapi|flask)\b/i,
    skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
  },
  {
    regex: /\b(java|spring|springboot|hibernate)\b/i,
    skillCode: 'JAVA_ENTERPRISE_APPLICATION_DEVELOPMENT',
  },
  {
    regex: /\b(javascript|typescript|node\.?js|react|angular|vue|next\.?js)\b/i,
    skillCode: 'JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT',
  },
  { regex: /\b(golang|go programming)\b/i, skillCode: 'GO_GOLANG_FOR_HIGH_PERFORMANCE_SERVICES' },
  { regex: /\b(c#|\.net|dotnet|asp\.net)\b/i, skillCode: 'C_NET_ENTERPRISE_DEVELOPMENT' },
  { regex: /\b(c\+\+|cpp)\b/i, skillCode: 'C_SYSTEMS_PERFORMANCE_ENGINEERING' },
  { regex: /\b(rust|rustlang)\b/i, skillCode: 'RUST_FOR_SYSTEMS_RELIABILITY_ENGINEERING' },
  {
    regex: /\b(sql|postgres|postgresql|mysql|query optimization)\b/i,
    skillCode: 'SQL_QUERY_OPTIMIZATION',
  },
  {
    regex: /\b(aws|amazon web services|ec2|s3|lambda)\b/i,
    skillCode: 'AMAZON_WEB_SERVICES_AWS_ARCHITECTURE',
  },
  {
    regex: /\b(docker|kubernetes|k8s|containerization)\b/i,
    skillCode: 'DOCKER_CONTAINERIZATION_APPLICATION_PACKAGING',
  },
  {
    regex: /\b(ci\/?cd|github actions|jenkins|gitlab ci)\b/i,
    skillCode: 'CI_CD_PIPELINE_AUTOMATION_DEPLOYMENT',
  },
  {
    regex: /\b(machine learning|deep learning|pytorch|tensorflow|scikit-learn)\b/i,
    skillCode: 'SUPERVISED_MACHINE_LEARNING_PIPELINES',
  },
  {
    regex: /\b(llm|rag|genai|prompt engineering|transformers|langchain)\b/i,
    skillCode: 'PROMPT_ENGINEERING_STRUCTURED_GENERATION',
  },
  {
    regex: /\b(algorithms|data structures|time complexity|space complexity|leetcode)\b/i,
    skillCode: 'ALGORITHMIC_COMPLEXITY_PERFORMANCE_OPTIMIZATION',
  },
];

/**
 * Detects minimum proficiency level from text around skill occurrences.
 */
export function inferProficiency(text: string, skillTerms: string[]): SkillProficiency {
  // Check context surrounding skill mentions
  for (const term of skillTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const windowRegex = new RegExp(`(?:.{0,50})(${escaped})(?:.{0,50})`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = windowRegex.exec(text)) !== null) {
      const windowText = match[0];
      for (const indicator of PROFICIENCY_KEYWORDS) {
        if (indicator.patterns.some((p) => p.test(windowText))) {
          return indicator.level;
        }
      }
    }
  }

  // Global scan of entire JD if context window yielded nothing
  for (const indicator of PROFICIENCY_KEYWORDS) {
    if (indicator.patterns.some((p) => p.test(text))) {
      return indicator.level;
    }
  }

  return 'INTERMEDIATE';
}

/**
 * Fallback heuristic keyword extraction when AI gateway fails or times out.
 */
export function extractSkillsOfflineFallback(
  roleTitle: string,
  rawText: string,
): JdSkillExtractVector {
  const combinedText = `${roleTitle}\n${rawText}`;
  const detectedSkills = new Map<string, SkillProficiency>();

  // 1. Check direct aliases
  for (const alias of SKILL_ALIASES) {
    if (alias.regex.test(combinedText) && SKILL_CODE_SET.has(alias.skillCode)) {
      if (!detectedSkills.has(alias.skillCode)) {
        detectedSkills.set(alias.skillCode, inferProficiency(combinedText, [alias.skillCode]));
      }
    }
  }

  // 2. Check full skill catalog names
  for (const skill of SKILL_DEFINITIONS) {
    if (detectedSkills.has(skill.code)) continue;
    const nameRegex = new RegExp(`\\b${skill.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (nameRegex.test(combinedText)) {
      detectedSkills.set(skill.code, inferProficiency(combinedText, [skill.name, skill.code]));
    }
    if (detectedSkills.size >= 15) break;
  }

  // Default to fullstack/python if nothing matched
  if (detectedSkills.size === 0) {
    detectedSkills.set('JAVASCRIPT_TYPESCRIPT_FULL_STACK_DEVELOPMENT', 'INTERMEDIATE');
  }

  const requiredSkills: SkillRequirement[] = Array.from(detectedSkills.entries()).map(
    ([skillCode, minProficiency]) => ({
      skillCode: skillCode as SkillRequirement['skillCode'],
      minProficiency,
    }),
  );

  // Extract emphasised capabilities from blueprints of detected skills
  const emphasisedCapabilities: JdSkillExtractVector['emphasisedCapabilities'] = [];
  for (const req of requiredSkills) {
    const blueprint = getSkillBlueprint(req.skillCode);
    for (const comp of blueprint?.competencyModel ?? []) {
      if (comp.role === 'critical' || comp.role === 'core') {
        emphasisedCapabilities.push({
          competencyId: comp.competencyId,
          capability: comp.capability,
          skillCode: req.skillCode,
          role: comp.role,
        });
      }
      if (emphasisedCapabilities.length >= 25) break;
    }
    if (emphasisedCapabilities.length >= 25) break;
  }

  return {
    requiredSkills,
    emphasisedCapabilities,
    parseConfidence: 0.65, // Deterministic heuristic baseline confidence
  };
}

/**
 * Maps extracted requirements onto SMART's standardized 10-track taxonomy
 * and generates a normalized threshold vector.
 */
export function extract10TrackThresholdVector(
  roleTitle: string,
  rawText: string,
  extracted: JdSkillExtractVector,
): JdThresholdVector {
  const text = `${roleTitle} ${rawText}`.toLowerCase();
  const trackScores = new Map<TrackCode, number>();

  for (const track of TRACK_CODES) {
    trackScores.set(track, 0);
  }

  // Score tracks based on title, topics, and domain weights
  for (const trackDef of TRACK_DEFINITIONS) {
    let score = 0;
    if (text.includes(trackDef.name.toLowerCase())) score += 10;
    if (roleTitle.toLowerCase().includes(trackDef.name.toLowerCase())) score += 15;

    for (const domain of trackDef.domains) {
      if (text.includes(domain.name.toLowerCase())) score += 3;
      for (const topic of domain.topics) {
        if (text.includes(topic.toLowerCase())) score += 2;
      }
    }
    trackScores.set(trackDef.code, (trackScores.get(trackDef.code) ?? 0) + score);
  }

  // Weight by required skills
  for (const req of extracted.requiredSkills) {
    if (req.skillCode.includes('PYTHON') || req.skillCode.includes('MACHINE_LEARNING')) {
      trackScores.set('TECH_AIML', (trackScores.get('TECH_AIML') ?? 0) + 5);
    }
    if (
      req.skillCode.includes('AWS') ||
      req.skillCode.includes('DOCKER') ||
      req.skillCode.includes('CI_CD')
    ) {
      trackScores.set('TECH_CLOUD_DEVOPS', (trackScores.get('TECH_CLOUD_DEVOPS') ?? 0) + 5);
    }
    if (req.skillCode.includes('CYBER') || req.skillCode.includes('SECURITY')) {
      trackScores.set('TECH_CYBERSECURITY', (trackScores.get('TECH_CYBERSECURITY') ?? 0) + 5);
    }
    if (req.skillCode.includes('DATA') || req.skillCode.includes('SQL')) {
      trackScores.set('TECH_DATA_ANALYST', (trackScores.get('TECH_DATA_ANALYST') ?? 0) + 5);
    }
    if (req.skillCode.includes('JAVASCRIPT') || req.skillCode.includes('FULL_STACK')) {
      trackScores.set('TECH_FULLSTACK', (trackScores.get('TECH_FULLSTACK') ?? 0) + 5);
    }
  }

  let bestTrack: TrackCode = 'TECH_FULLSTACK';
  let highestScore = -1;
  for (const [track, score] of trackScores.entries()) {
    if (score > highestScore) {
      highestScore = score;
      bestTrack = track;
    }
  }

  // Determine tiers for L1-L5
  const hasSenior = /\b(lead|senior|principal|expert|staff)\b/i.test(text);
  const baseTier: CertifiableTier = hasSenior ? 'GOLD' : 'SILVER';

  const minThresholds: Record<string, CertifiableTier> = {
    L1: 'SILVER',
    L2: baseTier,
    L3: hasSenior ? 'GOLD' : 'BRONZE',
  };

  const emphasisedCompetencies = extracted.emphasisedCapabilities
    .slice(0, 20)
    .map((c) => c.capability);

  return {
    requiredTrack: bestTrack,
    minThresholds,
    emphasisedCompetencies,
    parseConfidence: extracted.parseConfidence,
  };
}
