import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { TransferSkillRow } from '@smart/contracts';
import { TransferSkillsDisplay } from './TransferSkillsDisplay';

/**
 * Component tests for TransferSkillsDisplay
 * Validates rendering of transfer skills with reasons and proficiency levels
 */

describe('TransferSkillsDisplay Component', () => {
  beforeEach(() => cleanup());
  it('renders nothing when no transfer skills provided', () => {
    const { container } = render(<TransferSkillsDisplay transferSkills={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays transfer skill with SAME_CATEGORY reason', () => {
    const skills: TransferSkillRow[] = [
      {
        skillCode: 'JAVA',
        skillName: 'Java Programming',
        reason: 'SAME_CATEGORY',
      },
    ];

    render(<TransferSkillsDisplay transferSkills={skills} />);

    expect(screen.getByText('Java Programming')).toBeDefined();
    expect(screen.getByText(/Same Category/)).toBeDefined();
  });

  it('displays transfer skill with CAPABILITY_OVERLAP reason', () => {
    const skills: TransferSkillRow[] = [
      {
        skillCode: 'SPRING',
        skillName: 'Spring Framework',
        reason: 'CAPABILITY_OVERLAP',
      },
    ];

    render(<TransferSkillsDisplay transferSkills={skills} />);

    expect(screen.getByText('Spring Framework')).toBeDefined();
    expect(screen.getByText(/Capability Match/)).toBeDefined();
  });

  it('displays transfer skill with GRAPH_BASED reason', () => {
    const skills: TransferSkillRow[] = [
      {
        skillCode: 'NODEJS',
        skillName: 'Node.js',
        reason: 'GRAPH_BASED',
      },
    ];

    render(<TransferSkillsDisplay transferSkills={skills} />);

    expect(screen.getByText('Node.js')).toBeDefined();
    expect(screen.getByText(/Graph Transfer/)).toBeDefined();
  });

  it('displays proficiency level when rank is provided', () => {
    const skills: TransferSkillRow[] = [
      {
        skillCode: 'PYTHON',
        skillName: 'Python',
        reason: 'SAME_CATEGORY',
        rank: 4,
      },
    ];

    render(<TransferSkillsDisplay transferSkills={skills} />);

    expect(screen.getByText(/Proficiency/)).toBeDefined();
    expect(screen.getByText(/Advanced/)).toBeDefined();
  });

  it('displays transfer explanation when provided', () => {
    const skills: TransferSkillRow[] = [
      {
        skillCode: 'VUE',
        skillName: 'Vue.js',
        reason: 'GRAPH_BASED',
        transferExplanation: 'Similar component architecture to React',
      },
    ];

    render(<TransferSkillsDisplay transferSkills={skills} />);

    expect(screen.getByText(/Similar component architecture/)).toBeDefined();
  });

  it('respects maxDisplay limit and shows remaining count', () => {
    const skills: TransferSkillRow[] = [
      { skillCode: 'SKILL1', skillName: 'Skill 1', reason: 'SAME_CATEGORY' },
      { skillCode: 'SKILL2', skillName: 'Skill 2', reason: 'SAME_CATEGORY' },
      { skillCode: 'SKILL3', skillName: 'Skill 3', reason: 'SAME_CATEGORY' },
      { skillCode: 'SKILL4', skillName: 'Skill 4', reason: 'SAME_CATEGORY' },
      { skillCode: 'SKILL5', skillName: 'Skill 5', reason: 'SAME_CATEGORY' },
    ];

    const { container } = render(<TransferSkillsDisplay transferSkills={skills} maxDisplay={3} />);

    const skillElements = container.querySelectorAll('p.font-medium');
    expect(skillElements.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/\+2 more/)).toBeDefined();
  });

  it('renders all skills when count is below maxDisplay', () => {
    const skills: TransferSkillRow[] = [
      { skillCode: 'SKILL1', skillName: 'Skill 1', reason: 'SAME_CATEGORY' },
      { skillCode: 'SKILL2', skillName: 'Skill 2', reason: 'CAPABILITY_OVERLAP' },
    ];

    render(<TransferSkillsDisplay transferSkills={skills} maxDisplay={5} />);

    expect(screen.getByText('Skill 1')).toBeDefined();
    expect(screen.getByText('Skill 2')).toBeDefined();
    expect(screen.queryByText(/\+/)).toBeNull();
  });

  it('displays section header', () => {
    const skills: TransferSkillRow[] = [
      { skillCode: 'SKILL1', skillName: 'Skill 1', reason: 'SAME_CATEGORY' },
    ];

    render(<TransferSkillsDisplay transferSkills={skills} />);

    expect(screen.getByText(/TRANSFERABLE SKILLS/i)).toBeDefined();
  });

  it('displays multiple skills with different reasons', () => {
    const skills: TransferSkillRow[] = [
      { skillCode: 'PYTHON', skillName: 'Python', reason: 'SAME_CATEGORY' },
      { skillCode: 'RUST', skillName: 'Rust', reason: 'CAPABILITY_OVERLAP' },
      { skillCode: 'GO', skillName: 'Go', reason: 'GRAPH_BASED' },
    ];

    render(<TransferSkillsDisplay transferSkills={skills} />);

    expect(screen.getAllByText(/Python|Rust|Go/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/Same Category/)).toBeDefined();
    expect(screen.getByText(/Capability Match/)).toBeDefined();
    expect(screen.getByText(/Graph Transfer/)).toBeDefined();
  });
});
