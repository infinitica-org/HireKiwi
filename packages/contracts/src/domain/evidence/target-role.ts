import { z } from 'zod';
import { TaxonomySkillCodeSchema } from '../../dto/catalog.dto.js';

export const TargetRoleSchema = z.object({
  roleId: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  domainId: z.string().min(1).max(64),
  recommendedSkillIds: z.array(TaxonomySkillCodeSchema).max(50).default([]),
  optionalSkillIds: z.array(TaxonomySkillCodeSchema).max(50).default([]),
});
export type TargetRole = z.infer<typeof TargetRoleSchema>;

/** V1 seed — common IT target roles with starter skill recommendations. */
export const TARGET_ROLES: readonly TargetRole[] = [
  {
    roleId: 'FULL_STACK_DEVELOPER',
    name: 'Full Stack Developer',
    domainId: 'SOFTWARE_IT',
    recommendedSkillIds: [
      'JAVASCRIPT',
      'TYPESCRIPT',
      'REACT',
      'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
      'POSTGRESQL',
    ],
    optionalSkillIds: ['DOCKER', 'AMAZON_WEB_SERVICES_AWS_ARCHITECTURE'],
  },
  {
    roleId: 'BACKEND_DEVELOPER',
    name: 'Backend Developer',
    domainId: 'SOFTWARE_IT',
    recommendedSkillIds: [
      'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
      'POSTGRESQL',
      'DOCKER',
      'KUBERNETES',
    ],
    optionalSkillIds: ['MONGODB', 'APACHE_SPARK'],
  },
  {
    roleId: 'FRONTEND_DEVELOPER',
    name: 'Frontend Developer',
    domainId: 'SOFTWARE_IT',
    recommendedSkillIds: ['JAVASCRIPT', 'TYPESCRIPT', 'REACT'],
    optionalSkillIds: ['POSTGRESQL'],
  },
  {
    roleId: 'DEVOPS_ENGINEER',
    name: 'DevOps Engineer',
    domainId: 'SOFTWARE_IT',
    recommendedSkillIds: ['DOCKER', 'KUBERNETES', 'LINUX', 'PROMETHEUS'],
    optionalSkillIds: ['AMAZON_WEB_SERVICES_AWS_ARCHITECTURE', 'ARGO_CD'],
  },
  {
    roleId: 'DATA_ENGINEER',
    name: 'Data Engineer',
    domainId: 'SOFTWARE_IT',
    recommendedSkillIds: [
      'POSTGRESQL',
      'APACHE_SPARK',
      'DBT',
      'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
    ],
    optionalSkillIds: ['DATA_ANALYSIS', 'MONGODB'],
  },
] as const;
