import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseOption } from '@/test-utils/styled-select';
import { renderWithQueryClient } from '@/test/render-with-query-client';
import { LanguagesSection } from './LanguagesSection';

const listLanguages = vi.fn();
const createLanguage = vi.fn();
const updateLanguage = vi.fn();
const deleteLanguage = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    users: {
      listLanguages: (...args: unknown[]) => listLanguages(...args),
      createLanguage: (...args: unknown[]) => createLanguage(...args),
      updateLanguage: (...args: unknown[]) => updateLanguage(...args),
      deleteLanguage: (...args: unknown[]) => deleteLanguage(...args),
    },
  },
}));

const mockLangItem = {
  id: 'lang-123',
  studentId: 'user-1',
  language: 'French',
  proficiency: 'Full Professional',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('LanguagesSection', () => {
  beforeEach(() => {
    listLanguages.mockReset().mockResolvedValue([mockLangItem]);
    createLanguage.mockReset();
    updateLanguage.mockReset();
    deleteLanguage.mockReset();
  });

  it('renders language items correctly', async () => {
    renderWithQueryClient(<LanguagesSection />);
    expect(await screen.findByText('French')).toBeTruthy();
    expect(screen.getByText('Full Professional')).toBeTruthy();
  });

  it('opens create modal and adds new language using canonical select dropdown', async () => {
    listLanguages.mockResolvedValueOnce([]).mockResolvedValueOnce([mockLangItem]);
    createLanguage.mockResolvedValueOnce(mockLangItem);

    renderWithQueryClient(<LanguagesSection />);
    const addButton = (await screen.findAllByRole('button', { name: /^Add language$/i })).at(
      -1,
    ) as HTMLElement;
    fireEvent.click(addButton);

    const select = screen.getByRole('combobox', { name: /^Language/i });
    fireEvent.click(select);
    expect(screen.getByRole('option', { name: 'Select language' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Hindi' })).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: 'French' }));

    // The modal's submit button shares its label with the section's add button; it renders last.
    fireEvent.click(
      screen.getAllByRole('button', { name: /^Add language$/i }).at(-1) as HTMLElement,
    );

    await waitFor(() => expect(createLanguage).toHaveBeenCalledTimes(1));
    expect(createLanguage).toHaveBeenCalledWith({
      language: 'French',
      proficiency: 'Professional Working',
    });
  });

  it('opens edit modal and updates language with changed selection and proficiency', async () => {
    updateLanguage.mockResolvedValueOnce({
      ...mockLangItem,
      language: 'German',
      proficiency: 'Native or Bilingual',
    });

    renderWithQueryClient(<LanguagesSection />);
    expect(await screen.findByText('French')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Edit French/i }));

    const languageSelect = screen.getByRole('combobox', { name: /^Language/i });
    expect(languageSelect.textContent).toContain('French');

    chooseOption(languageSelect, 'German');

    const proficiencySelect = screen.getByRole('combobox', { name: /^Proficiency/i });
    chooseOption(proficiencySelect, 'Native or Bilingual');

    fireEvent.click(screen.getByRole('button', { name: /^Save changes$/i }));

    await waitFor(() => expect(updateLanguage).toHaveBeenCalledTimes(1));
    expect(updateLanguage).toHaveBeenCalledWith('lang-123', {
      language: 'German',
      proficiency: 'Native or Bilingual',
    });
  });

  it('preserves custom non-canonical language in options when editing', async () => {
    const customLangItem = {
      id: 'lang-custom',
      studentId: 'user-1',
      language: 'Esperanto',
      proficiency: 'Elementary',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };
    listLanguages.mockReset().mockResolvedValue([customLangItem]);
    updateLanguage.mockResolvedValueOnce(customLangItem);

    renderWithQueryClient(<LanguagesSection />);
    expect(await screen.findByText('Esperanto')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Edit Esperanto/i }));

    const languageSelect = screen.getByRole('combobox', { name: /^Language/i });
    expect(languageSelect.textContent).toContain('Esperanto');
    fireEvent.click(languageSelect);
    expect(screen.getByRole('option', { name: 'Esperanto' })).toBeTruthy();
    fireEvent.click(languageSelect);

    fireEvent.click(screen.getByRole('button', { name: /^Save changes$/i }));

    await waitFor(() => expect(updateLanguage).toHaveBeenCalledTimes(1));
    expect(updateLanguage).toHaveBeenCalledWith('lang-custom', {
      language: 'Esperanto',
      proficiency: 'Elementary',
    });
  });

  it('validates that a language must be selected before submitting', async () => {
    listLanguages.mockResolvedValueOnce([]);

    renderWithQueryClient(<LanguagesSection />);
    const addButton = (await screen.findAllByRole('button', { name: /^Add language$/i })).at(
      -1,
    ) as HTMLElement;
    fireEvent.click(addButton);

    // Attempt to submit without picking a language
    const modalForm = screen.getByRole('dialog').querySelector('form');
    expect(modalForm).not.toBeNull();
    if (modalForm) {
      fireEvent.submit(modalForm);
    }

    expect(await screen.findByText('Language name is required.')).toBeTruthy();
    expect(createLanguage).not.toHaveBeenCalled();
  });

  it('deletes language entry after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    deleteLanguage.mockResolvedValueOnce(undefined);

    renderWithQueryClient(<LanguagesSection />);
    expect(await screen.findByText('French')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Delete French/i }));

    await waitFor(() => expect(deleteLanguage).toHaveBeenCalledTimes(1));
    expect(deleteLanguage).toHaveBeenCalledWith('lang-123');
  });
});
