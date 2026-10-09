import type { EducationCatalogResponse } from '@hirekiwi/contracts';
import { describe, expect, it } from 'vitest';

import {
  boardGroupsForLevel,
  buildEducationLevels,
  buildSpecializationGroups,
} from './education-catalog';
import { EDUCATION_LEVELS, levelOfProgram } from './education-form';

const catalog: EducationCatalogResponse = {
  degrees: [
    { id: 'D01', name: '10th / SSLC', fullName: 'Secondary', level: 'School' },
    { id: 'D03', name: 'ITI', fullName: 'ITI', level: 'Vocational / Diploma' },
    { id: 'D04', name: 'Diploma', fullName: 'Diploma', level: 'Vocational / Diploma' },
    { id: 'D09', name: 'B.E', fullName: 'Bachelor of Engineering', level: 'Undergraduate' },
    { id: 'D11', name: 'MCA', fullName: 'MCA', level: 'Postgraduate' },
    { id: 'D23', name: 'CA / CMA / CS', fullName: 'Professional', level: 'Professional' },
    { id: 'D24', name: 'Other', fullName: 'Other', level: 'Other' },
  ],
  specializations: [
    { id: 'S01', name: 'Computer Science', category: 'Core Computing' },
    { id: 'S10', name: 'Artificial Intelligence', category: 'AI & Data' },
    { id: 'S11', name: 'Machine Learning', category: 'AI & Data' },
  ],
};

describe('buildEducationLevels', () => {
  it('is the built-in list when there is no catalog', () => {
    expect(buildEducationLevels(undefined)).toBe(EDUCATION_LEVELS);
  });

  it('puts catalog degrees under their level and keeps built-in ones the catalog lacks', () => {
    const levels = buildEducationLevels(catalog);
    const programs = (id: string) => levels.find((level) => level.id === id)?.programs ?? [];
    expect(programs('diploma')).toEqual(['ITI', 'Diploma', 'Certificate']);
    expect(programs('postgraduate')).toEqual(['MCA', 'M.Tech', 'M.Sc', 'MBA']);
    expect(programs('other')).toEqual(['CA / CMA / CS']);
  });

  it('does not list "B.E" and "B.E." twice', () => {
    const undergrad = buildEducationLevels(catalog).find((level) => level.id === 'undergraduate');
    expect(undergrad?.programs.filter((name) => name.startsWith('B.E'))).toEqual(['B.E']);
  });

  it('leaves school to the 10th/11th/12th buttons', () => {
    const school = buildEducationLevels(catalog).find((level) => level.id === 'school');
    expect(school?.programs).toEqual(['10th Standard', '11th Standard', '12th Standard']);
  });

  it('still places an older saved program on its level', () => {
    expect(levelOfProgram('B.E.', buildEducationLevels(catalog))).toBe('undergraduate');
  });
});

describe('buildSpecializationGroups', () => {
  it('groups by category in catalog order and appends built-in branches the catalog lacks', () => {
    const groups = buildSpecializationGroups(catalog);
    expect(groups.slice(0, 2)).toEqual([
      { label: 'Core Computing', names: ['Computer Science'] },
      { label: 'AI & Data', names: ['Artificial Intelligence', 'Machine Learning'] },
    ]);
    const extra = groups.find((group) => group.label === 'Other branches');
    expect(extra?.names).toContain('Mechanical Engineering');
    expect(extra?.names).not.toContain('Computer Science');
  });

  it('hides the engineering branches unless the degree is an engineering one', () => {
    const withEngineering: EducationCatalogResponse = {
      ...catalog,
      specializations: [
        ...catalog.specializations,
        {
          id: 'S33',
          name: 'Computer Science & Engineering (CSE)',
          category: 'General / Trending Branches',
        },
      ],
    };
    const labels = (degree: string) =>
      buildSpecializationGroups(withEngineering, degree).map((group) => group.label);
    expect(labels('BCA')).not.toContain('General / Trending Branches');
    expect(labels('B.Tech')).toContain('General / Trending Branches');
    expect(labels('B.E.')).toContain('General / Trending Branches');
  });

  it('is a single ungrouped list without a catalog', () => {
    const groups = buildSpecializationGroups(undefined);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe('');
  });
});

describe('boardGroupsForLevel', () => {
  const labels = (level: Parameters<typeof boardGroupsForLevel>[0]) =>
    boardGroupsForLevel(level).map((group) => group.label);

  it('gives school boards for school and universities for degrees', () => {
    expect(labels('school')).toEqual(['School boards']);
    expect(labels('undergraduate')).toEqual(['Universities']);
    expect(labels('postgraduate')).toEqual(['Universities']);
    expect(labels('doctorate')).toEqual(['Universities']);
  });

  it('gives both for diploma and other', () => {
    expect(labels('diploma')).toEqual(['School boards', 'Universities']);
    expect(labels('other')).toEqual(['Universities', 'School boards']);
  });
});
