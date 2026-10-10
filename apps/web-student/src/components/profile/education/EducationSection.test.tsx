import { chooseOption } from '@/test-utils/styled-select';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '@/test/render-with-query-client';
import { EducationSection } from './EducationSection';

const listEducation = vi.fn();
const createEducation = vi.fn();
const updateEducation = vi.fn();
const deleteEducation = vi.fn();
const attachEducationDocument = vi.fn();
const removeEducationDocument = vi.fn();
const getOnboarding = vi.fn();
const saveOnboarding = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    users: {
      listEducation: (...args: unknown[]) => listEducation(...args),
      createEducation: (...args: unknown[]) => createEducation(...args),
      updateEducation: (...args: unknown[]) => updateEducation(...args),
      deleteEducation: (...args: unknown[]) => deleteEducation(...args),
      attachEducationDocument: (...args: unknown[]) => attachEducationDocument(...args),
      removeEducationDocument: (...args: unknown[]) => removeEducationDocument(...args),
      getOnboarding: (...args: unknown[]) => getOnboarding(...args),
      saveOnboarding: (...args: unknown[]) => saveOnboarding(...args),
    },
  },
}));

// Th6-600 — uploads go presigned PUT → attach; the attach call is what this suite asserts on.
vi.mock('@/lib/evidence-upload', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  uploadEducationProof: (educationId: string, documentType: string, file: File) =>
    attachEducationDocument(educationId, {
      documentType,
      fileUrl: `education-proofs/u/${educationId}/key-${file.name}`,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
    }),
}));

const mockEduItem = {
  id: 'edu-123',
  studentId: 'user-1',
  institutionName: 'MIT',
  degree: 'Bachelor of Science',
  fieldOfStudy: 'Computer Science',
  startDate: '2020-09-01',
  endDate: '2024-06-01',
  current: false,
  grade: '4.0 GPA',
  status: 'unverified',
  documents: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('EducationSection', () => {
  beforeEach(() => {
    listEducation.mockReset().mockResolvedValue([mockEduItem]);
    createEducation.mockReset();
    updateEducation.mockReset();
    deleteEducation.mockReset();
    attachEducationDocument.mockReset();
    removeEducationDocument.mockReset();
    getOnboarding.mockReset().mockResolvedValue({ profile: null, draft: null });
    saveOnboarding.mockReset().mockResolvedValue(undefined);
  });

  it('renders education items correctly', async () => {
    renderWithQueryClient(<EducationSection />);
    expect(await screen.findByText('MIT')).toBeTruthy();
    expect(screen.getByText('Bachelor of Science')).toBeTruthy();
    expect(screen.getByText('Score: 4.0 GPA')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add education/i })).toBeTruthy();
  });

  it('discards unsaved create form when the modal is closed', async () => {
    listEducation.mockResolvedValue([]);

    renderWithQueryClient(<EducationSection />);
    fireEvent.click(
      (await screen.findAllByRole('button', { name: /^Add education$/i })).at(-1) as HTMLElement,
    );

    const schoolInput = await screen.findByPlaceholderText(/RV College/i);
    fireEvent.change(schoolInput, { target: { value: 'Draft College' } });
    fireEvent.click(screen.getByLabelText('Close'));

    fireEvent.click(
      screen.getAllByRole('button', { name: /^Add education$/i }).at(-1) as HTMLElement,
    );
    const schoolAgain = await screen.findByPlaceholderText(/RV College/i);
    expect((schoolAgain as HTMLInputElement).value).toBe('');
  });

  it('opens create modal and adds new education', async () => {
    listEducation.mockResolvedValueOnce([]).mockResolvedValueOnce([mockEduItem]);
    createEducation.mockResolvedValueOnce(mockEduItem);

    renderWithQueryClient(<EducationSection />);
    const addButton = (await screen.findAllByRole('button', { name: /^Add education$/i })).at(
      -1,
    ) as HTMLElement;
    fireEvent.click(addButton);

    await screen.findByLabelText('What are you adding? *');
    fillEducationWizard({ withBranch: true });

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    await waitFor(() => expect(createEducation).toHaveBeenCalledTimes(1));
    expect(createEducation).toHaveBeenCalledWith(
      expect.objectContaining({
        institutionName: 'MIT · Anna University',
        degree: 'Full-time — B.Tech',
        fieldOfStudy: 'Computer Science',
        startDate: '2020-01-01',
        endDate: '2024-01-01',
        current: false,
        grade: '8.5 CGPA',
        degreeDetails: expect.objectContaining({
          rollNumber: '22ALR110',
          currentSemester: 7,
        }),
      }),
    );
  });

  it('shows proof status and attaches an education document', async () => {
    attachEducationDocument.mockResolvedValueOnce({
      id: 'doc-1',
      educationId: 'edu-123',
      documentType: 'DEGREE_CERTIFICATE',
      fileName: 'degree.pdf',
      fileUrl: 'storage/education-proofs/degree.pdf',
      fileSizeBytes: 1000,
      mimeType: 'application/pdf',
      createdAt: '2026-09-12T00:00:00.000Z',
    });
    listEducation.mockResolvedValueOnce([mockEduItem]).mockResolvedValueOnce([
      {
        ...mockEduItem,
        documents: [
          {
            id: 'doc-1',
            educationId: 'edu-123',
            documentType: 'DEGREE_CERTIFICATE',
            fileName: 'degree.pdf',
            fileUrl: 'storage/education-proofs/degree.pdf',
            fileSizeBytes: 1000,
            mimeType: 'application/pdf',
            createdAt: '2026-09-12T00:00:00.000Z',
          },
        ],
      },
    ]);

    renderWithQueryClient(<EducationSection />);
    expect(await screen.findByText(/None yet/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Upload$/i }));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['pdf'], 'degree.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Attach proof/i }));

    await waitFor(() => {
      expect(attachEducationDocument).toHaveBeenCalledWith(
        'edu-123',
        expect.objectContaining({
          documentType: 'DEGREE_CERTIFICATE',
          fileName: 'degree.pdf',
        }),
      );
      expect(screen.getByText(/1 document/i)).toBeTruthy();
    });
  });

  /** Walks the step-by-step popup: level, where, program, when, score. Ends on the Save step. */
  function fillEducationWizard({ withBranch = false } = {}) {
    const next = () => fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    // Step 1: level, school and board.
    chooseOption(screen.getByLabelText('What are you adding? *'), 'undergraduate');
    fireEvent.change(screen.getByPlaceholderText(/RV College/i), { target: { value: 'MIT' } });
    chooseOption(screen.getByLabelText('Board / University *'), 'Anna University');
    next();
    // Step 2: program, branch, study mode and years.
    chooseOption(screen.getByLabelText('Program / Degree *'), 'B.Tech');
    if (withBranch) {
      chooseOption(screen.getByLabelText('Branch / Specialization (Optional)'), 'Computer Science');
    }
    chooseOption(screen.getByLabelText('Study mode *'), 'Full-time');
    chooseOption(screen.getByLabelText('Start year *'), '2020');
    chooseOption(screen.getByLabelText('End year *'), '2024');
    next();
    // Step 3: score.
    fireEvent.change(screen.getByTestId('education-score-input'), { target: { value: '8.5' } });
    fireEvent.change(screen.getByLabelText(/Institute roll no/i), {
      target: { value: '22ALR110' },
    });
    chooseOption(screen.getByLabelText(/Current semester/i), '7');
  }

  async function openCreateModalAndFill() {
    fireEvent.click(
      (await screen.findAllByRole('button', { name: /^Add education$/i })).at(-1) as HTMLElement,
    );
    await screen.findByLabelText('What are you adding? *');
    fillEducationWizard();
  }

  it('shows an empty state when there are no education entries', async () => {
    listEducation.mockResolvedValue([]);
    renderWithQueryClient(<EducationSection />);
    expect(await screen.findByText('No education entries yet')).toBeTruthy();
  });

  it('shows a specific error when education cannot be loaded', async () => {
    listEducation.mockRejectedValue(new Error('Education service unavailable'));
    renderWithQueryClient(<EducationSection />);
    expect(await screen.findByText('Education service unavailable')).toBeTruthy();
  });

  it('does not save when required fields are missing', async () => {
    listEducation.mockResolvedValue([]);
    renderWithQueryClient(<EducationSection />);
    fireEvent.click(
      (await screen.findAllByRole('button', { name: /^Add education$/i })).at(-1) as HTMLElement,
    );
    await screen.findByLabelText('What are you adding? *');

    // Nothing is picked, so Continue stays on the first step and nothing is saved.
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(createEducation).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^Save$/i })).toBeNull();
    // The empty box is explained in plain words under it.
    expect(
      screen
        .getAllByRole('alert')
        .map((node) => node.textContent)
        .join(' '),
    ).toMatch(/Please choose what you are adding/i);
  });

  it('keeps the entered data and reports the error when saving fails, then succeeds on retry', async () => {
    listEducation.mockResolvedValue([]);
    createEducation
      .mockRejectedValueOnce(new Error('Could not reach server'))
      .mockResolvedValueOnce(mockEduItem);
    renderWithQueryClient(<EducationSection />);
    await openCreateModalAndFill();

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

    expect(await screen.findByText('Could not reach server')).toBeTruthy();
    expect((screen.getByPlaceholderText(/RV College/i) as HTMLInputElement).value).toBe('MIT');

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(() => expect(createEducation).toHaveBeenCalledTimes(2));
  });

  it('asks for confirmation before deleting and skips the API call when cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWithQueryClient(<EducationSection />);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete education' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteEducation).not.toHaveBeenCalled();
  });

  it('deletes the entry once confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    deleteEducation.mockResolvedValue(undefined);
    renderWithQueryClient(<EducationSection />);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete education' }));

    await waitFor(() => expect(deleteEducation).toHaveBeenCalledWith('edu-123'));
  });
});
