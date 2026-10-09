import type { EducationCatalogResponse } from '@hirekiwi/contracts';

import {
  BRANCH_SPECIALIZATION_OPTIONS,
  EDUCATION_LEVELS,
  type EducationLevel,
  SCHOOL_BOARD_OPTIONS,
  UNIVERSITY_OPTIONS,
  sameProgramName,
  type EducationLevelId,
} from './education-form';

/** Which popup level each catalog `level` belongs to. School is handled by the 10th/11th/12th buttons. */
const LEVEL_OF_CATALOG_LEVEL: Record<string, EducationLevelId> = {
  School: 'school',
  'Vocational / Diploma': 'diploma',
  Undergraduate: 'undergraduate',
  Postgraduate: 'postgraduate',
  'Doctorate / Research': 'doctorate',
  Professional: 'other',
  Other: 'other',
};

function mergeNames(preferred: readonly string[], extra: readonly string[]): string[] {
  const out = [...preferred];
  for (const name of extra) {
    if (!out.some((existing) => sameProgramName(existing, name))) out.push(name);
  }
  return out;
}

/**
 * The popup's levels with the catalog's degrees filled in. Programs the form already knew stay
 * listed (so older saved entries still match); with no catalog it is exactly the built-in list.
 */
export function buildEducationLevels(catalog?: EducationCatalogResponse): EducationLevel[] {
  if (!catalog) return EDUCATION_LEVELS;
  return EDUCATION_LEVELS.map((level) => {
    if (level.id === 'school') return level;
    const fromCatalog = catalog.degrees
      .filter(
        (degree) =>
          LEVEL_OF_CATALOG_LEVEL[degree.level] === level.id &&
          // The catalog's "Other" row is the popup's own "Other" choice.
          degree.name !== 'Other',
      )
      .map((degree) => degree.name);
    return { ...level, programs: mergeNames(fromCatalog, level.programs) };
  });
}

export interface OptionGroup {
  label: string;
  names: string[];
}

/** Boards for school, universities for degrees; diploma and "other" can be either, so both show. */
export function boardGroupsForLevel(level: EducationLevelId | null): OptionGroup[] {
  const boards = { label: 'School boards', names: [...SCHOOL_BOARD_OPTIONS] };
  const universities = { label: 'Universities', names: [...UNIVERSITY_OPTIONS] };
  switch (level) {
    case 'school':
      return [boards];
    case 'undergraduate':
    case 'postgraduate':
    case 'doctorate':
      return [universities];
    case 'diploma':
      return [boards, universities];
    default:
      return [universities, boards];
  }
}

const ENGINEERING_DEGREES = ['B.Tech', 'B.E', 'M.Tech', 'M.E'];
const ENGINEERING_CATEGORY = 'General / Trending Branches';

export interface SpecializationGroup {
  label: string;
  names: string[];
}

/** Catalog specializations grouped by category, then any built-in branch the catalog lacks. */
export function buildSpecializationGroups(
  catalog?: EducationCatalogResponse,
  degree = '',
): SpecializationGroup[] {
  if (!catalog) return [{ label: '', names: [...BRANCH_SPECIALIZATION_OPTIONS] }];
  const groups: SpecializationGroup[] = [];
  // The engineering branch names (CSE (AI & ML), ISE, CSBS…) only fit engineering degrees.
  const isEngineering = ENGINEERING_DEGREES.some((name) => sameProgramName(name, degree));
  for (const item of catalog.specializations) {
    if (item.category === ENGINEERING_CATEGORY && degree && !isEngineering) continue;
    const group = groups.find((entry) => entry.label === item.category);
    if (group) group.names.push(item.name);
    else groups.push({ label: item.category, names: [item.name] });
  }
  const known = groups.flatMap((group) => group.names);
  const rest = BRANCH_SPECIALIZATION_OPTIONS.filter(
    (name) => !known.some((existing) => sameProgramName(existing, name)),
  );
  if (rest.length > 0) groups.push({ label: 'Other branches', names: rest });
  return groups;
}
