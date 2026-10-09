/**
 * Maps a skill name to one of the five literal `DomainCode` radar axes (S8-RM-XX).
 *
 * `Skill.domain` is a free-text taxonomy string (almost always `'SOFTWARE_IT'` in the seed
 * catalog — see seed-tiered-skills.ts), so `buildCandidateDomainVector` could never place a
 * verified skill into a specific A-E axis and fell back to feeding the same aggregate signal
 * into every axis. This gives every skill a real, deterministic A-E tag instead.
 *
 * The five buckets are a first-pass convention, not a previously-documented taxonomy (none
 * existed) — chosen as the most common way engineering skill is actually sliced for a radar:
 *   A: Frontend / UI / client-side languages & frameworks
 *   B: Backend / server frameworks & languages
 *   C: Data, ML/AI & analytics
 *   D: Infrastructure, cloud, DevOps & SRE
 *   E: Quality, security, mobile & everything else
 *
 * Keyword matching is case-insensitive and checked in bucket order (A before B before C...),
 * so a name matching multiple buckets takes the earlier one. Owner: Ramansh.
 */

import type { DomainCode } from '../../generated/prisma/index.js';

const DOMAIN_KEYWORDS: Record<Exclude<DomainCode, 'E'>, readonly string[]> = {
  A: [
    'react',
    'angular',
    'vue',
    'svelte',
    'css',
    'html',
    'sass',
    'tailwind',
    'frontend',
    'next.js',
    'nextjs',
    'nuxt',
    'bootstrap',
    'ember',
    'alpine.js',
    'jquery',
    'redux',
    'babel',
    'webpack',
    'vite',
    'd3.js',
    'three.js',
    'babylon.js',
    'ant design',
    'chakra ui',
    'material ui',
    'storybook',
  ],
  B: [
    'node',
    'express',
    'django',
    'flask',
    'spring',
    'rails',
    'laravel',
    'asp.net',
    '.net',
    'fastapi',
    'nestjs',
    'graphql',
    'grpc',
    'kafka',
    'rabbitmq',
    'postgres',
    'mysql',
    'mongodb',
    'redis',
    'sql',
    'java',
    'python',
    'golang',
    'go ',
    'rust',
    'c++',
    'c#',
    'php',
    'ruby',
    'scala',
    'kotlin',
    'elixir',
    'erlang',
    'bullmq',
  ],
  C: [
    'tensorflow',
    'pytorch',
    'scikit',
    'pandas',
    'numpy',
    'spark',
    'hadoop',
    'airflow',
    'dbt',
    'snowflake',
    'redshift',
    'bigquery',
    'databricks',
    'kubeflow',
    'mlflow',
    'sagemaker',
    'machine learning',
    'llm',
    'nlp',
    'data science',
    'jupyter',
    'tableau',
    'power bi',
    'looker',
    'etl',
    'feature store',
    'vector',
    'embedding',
  ],
  D: [
    'docker',
    'kubernetes',
    'terraform',
    'ansible',
    'jenkins',
    'github actions',
    'gitlab ci',
    'circleci',
    'aws',
    'azure',
    'gcp',
    'google cloud',
    'helm',
    'prometheus',
    'grafana',
    'datadog',
    'nginx',
    'envoy',
    'istio',
    'devops',
    'sre',
    'ci/cd',
    'cloudformation',
    'pulumi',
    'vault',
  ],
};

const DOMAIN_ORDER: readonly Exclude<DomainCode, 'E'>[] = ['A', 'B', 'C', 'D'];

/** Deterministic: same skill name always resolves to the same domain. Falls back to 'E'. */
export function classifySkillDomainCode(skillName: string): DomainCode {
  const lower = skillName.toLowerCase();
  for (const domain of DOMAIN_ORDER) {
    if (DOMAIN_KEYWORDS[domain].some((keyword) => lower.includes(keyword))) {
      return domain;
    }
  }
  return 'E';
}
