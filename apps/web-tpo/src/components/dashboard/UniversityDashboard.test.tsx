import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { InstitutionStudentDto, SkillClaimDto } from '@hirekiwi/contracts';
import { UniversityDashboard } from './UniversityDashboard';

afterEach(() => {
  cleanup();
});

function createStudent(
  index: number,
  overrides: Partial<InstitutionStudentDto> = {},
): InstitutionStudentDto {
  const padded = index.toString().padStart(4, '0');
  return {
    userId: `${padded}0000-0000-4000-8000-${padded}00000000`,
    email: `student${index}@university.edu`,
    fullName: `Candidate ${index}`,
    batchId: null,
    batchName: index % 2 === 0 ? 'Computer Science' : 'Electronics',
    inviteStatus: 'ACCEPTED',
    lastSentAt: null,
    acceptedAt: null,
    heldAt: null,
    linkedinUrl: null,
    githubUrl: null,
    ...overrides,
  };
}

const mockClaims: SkillClaimDto[] = [];

describe('UniversityDashboard - Student roster search and pagination', () => {
  it('renders initial student roster with page size 8 and pagination count', () => {
    const students = Array.from({ length: 10 }, (_, i) => createStudent(i + 1));
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    expect(screen.getByText('Student roster')).toBeDefined();
    expect(screen.getByText('Candidate 1')).toBeDefined();
    expect(screen.getByText('Candidate 8')).toBeDefined();
    expect(screen.queryByText('Candidate 9')).toBeNull();

    expect(screen.getByText(/Showing/i).textContent).toContain('1-8 from 10');

    const prevButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(prevButton.hasAttribute('disabled')).toBe(true);
    expect(nextButton.hasAttribute('disabled')).toBe(false);
  });

  it('filters students by name as the user types (case-insensitive and partial)', () => {
    const students = [
      createStudent(1, { fullName: 'Ada Lovelace', email: 'ada@school.edu' }),
      createStudent(2, { fullName: 'Alan Turing', email: 'alan@school.edu' }),
    ];
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search roster...');
    fireEvent.change(searchInput, { target: { value: 'ada' } });

    expect(screen.getByText('Ada Lovelace')).toBeDefined();
    expect(screen.queryByText('Alan Turing')).toBeNull();
    expect(screen.getByText('1-1')).toBeDefined();
  });

  it('filters students by email address', () => {
    const students = [
      createStudent(1, { fullName: 'Ada Lovelace', email: 'ada@oxford.edu' }),
      createStudent(2, { fullName: 'Alan Turing', email: 'alan@cambridge.edu' }),
    ];
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search roster...');
    fireEvent.change(searchInput, { target: { value: 'cambridge.edu' } });

    expect(screen.getByText('Alan Turing')).toBeDefined();
    expect(screen.queryByText('Ada Lovelace')).toBeNull();
  });

  it('filters students by student ID and "ID " prefix', () => {
    const students = [
      createStudent(1, {
        userId: 'aaaa1111-0000-4000-8000-000000000001',
        fullName: 'Student A',
      }),
      createStudent(2, {
        userId: 'bbbb2222-0000-4000-8000-000000000002',
        fullName: 'Student B',
      }),
    ];
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search roster...');
    fireEvent.change(searchInput, { target: { value: 'ID aaaa1111' } });

    expect(screen.getByText('Student A')).toBeDefined();
    expect(screen.queryByText('Student B')).toBeNull();
  });

  it('ignores leading and trailing whitespace when searching', () => {
    const students = [
      createStudent(1, { fullName: 'Grace Hopper' }),
      createStudent(2, { fullName: 'Katherine Johnson' }),
    ];
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search roster...');
    fireEvent.change(searchInput, { target: { value: '   grace   ' } });

    expect(screen.getByText('Grace Hopper')).toBeDefined();
    expect(screen.queryByText('Katherine Johnson')).toBeNull();
  });

  it('shows empty search state when no students match and allows clearing', () => {
    const students = [createStudent(1, { fullName: 'Ada Lovelace' })];
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search roster...');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Candidate' } });

    expect(screen.getByText('No students match your search')).toBeDefined();
    expect(screen.getByText(/No candidates match/i)).toBeDefined();
    expect(screen.queryByText('Ada Lovelace')).toBeNull();

    // Click "Clear search"
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    fireEvent.click(clearButton);

    expect(screen.getByText('Ada Lovelace')).toBeDefined();
    expect((searchInput as HTMLInputElement).value).toBe('');
  });

  it('restores complete roster when search input is manually emptied', () => {
    const students = [
      createStudent(1, { fullName: 'Ada Lovelace' }),
      createStudent(2, { fullName: 'Alan Turing' }),
    ];
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search roster...');
    fireEvent.change(searchInput, { target: { value: 'ada' } });
    expect(screen.queryByText('Alan Turing')).toBeNull();

    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Ada Lovelace')).toBeDefined();
    expect(screen.getByText('Alan Turing')).toBeDefined();
  });

  it('clears search when clicking the X button in the search input', () => {
    const students = [
      createStudent(1, { fullName: 'Ada Lovelace' }),
      createStudent(2, { fullName: 'Alan Turing' }),
    ];
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Search roster...');
    fireEvent.change(searchInput, { target: { value: 'ada' } });
    expect(screen.queryByText('Alan Turing')).toBeNull();

    const clearInputBtn = screen.getByRole('button', { name: 'Clear search input' });
    fireEvent.click(clearInputBtn);

    expect(screen.getByText('Ada Lovelace')).toBeDefined();
    expect(screen.getByText('Alan Turing')).toBeDefined();
    expect((searchInput as HTMLInputElement).value).toBe('');
  });

  it('supports pagination Next and Previous controls', () => {
    const students = Array.from({ length: 10 }, (_, i) => createStudent(i + 1));
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    expect(screen.getByText('1-8')).toBeDefined();
    const nextButton = screen.getByRole('button', { name: /next/i });
    const prevButton = screen.getByRole('button', { name: /previous/i });

    // Navigate to page 2
    fireEvent.click(nextButton);
    expect(screen.getByText('Candidate 9')).toBeDefined();
    expect(screen.getByText('Candidate 10')).toBeDefined();
    expect(screen.queryByText('Candidate 1')).toBeNull();
    expect(screen.getByText('9-10')).toBeDefined();
    expect(nextButton.hasAttribute('disabled')).toBe(true);
    expect(prevButton.hasAttribute('disabled')).toBe(false);

    // Navigate back to page 1
    fireEvent.click(prevButton);
    expect(screen.getByText('Candidate 1')).toBeDefined();
    expect(screen.queryByText('Candidate 9')).toBeNull();
    expect(screen.getByText('1-8')).toBeDefined();
  });

  it('resets page to 1 when search query changes while on page 2', () => {
    const students = Array.from({ length: 12 }, (_, i) =>
      createStudent(i + 1, { fullName: `Candidate ${i + 1}` }),
    );
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    expect(screen.getByText('Candidate 9')).toBeDefined();

    // Type a search that matches Candidate 1
    const searchInput = screen.getByPlaceholderText('Search roster...');
    fireEvent.change(searchInput, { target: { value: 'Candidate 1' } });

    // Should reset to page 1 and show matches
    expect(screen.getByText('1-4')).toBeDefined(); // Candidate 1, 10, 11, 12
    expect(screen.getByText('Candidate 1')).toBeDefined();
  });

  it('preserves View student link for navigation', () => {
    const students = [createStudent(1, { fullName: 'Ada Lovelace' })];
    render(
      <UniversityDashboard
        students={students}
        claims={mockClaims}
        placementApplicationCount={0}
        institutionName="Test University"
        loading={false}
      />,
    );

    const viewLinks = screen.getAllByRole('link', { name: /view/i });
    expect(viewLinks.some((l) => l.getAttribute('href') === '/students')).toBe(true);
  });
});
