import { fireEvent, within } from '@testing-library/react';

/**
 * Picks an option in a StyledSelect: opens the menu, then clicks the row whose value or visible
 * text matches. Works on the combobox button that `getByLabelText` returns for the field.
 */
export function chooseOption(combobox: HTMLElement, valueOrText: string): void {
  fireEvent.click(combobox);
  const list = document.body.querySelector<HTMLElement>('[role="listbox"]');
  if (!list) throw new Error('The dropdown did not open.');
  const row =
    list.querySelector<HTMLElement>(`[role="option"][data-value="${CSS.escape(valueOrText)}"]`) ??
    within(list).queryByRole('option', { name: valueOrText });
  if (!row) throw new Error(`No option "${valueOrText}" in the dropdown.`);
  fireEvent.click(row);
}
