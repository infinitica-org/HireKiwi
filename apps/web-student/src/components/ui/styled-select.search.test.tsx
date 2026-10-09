import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StyledSelect } from './styled-select';

afterEach(cleanup);

function setup(onChange = vi.fn()) {
  render(
    <StyledSelect
      aria-label="Branch"
      value=""
      onChange={onChange}
      searchable
      pinnedValues={['__custom__']}
    >
      <option value="">Select branch</option>
      <optgroup label="Core Computing">
        <option value="Computer Science">Computer Science</option>
        <option value="Information Technology">Information Technology</option>
      </optgroup>
      <optgroup label="AI & Data">
        <option value="Machine Learning">Machine Learning</option>
      </optgroup>
      <option value="__custom__">Other</option>
    </StyledSelect>,
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Branch' }));
  return onChange;
}

const optionNames = () => {
  const list = document.body.querySelector<HTMLElement>('[role="listbox"]');
  if (!list) throw new Error('The dropdown did not open.');
  return within(list)
    .queryAllByRole('option')
    .map((row) => row.textContent);
};

describe('StyledSelect searchable', () => {
  it('narrows the list as you type, hides empty groups, and keeps pinned options', () => {
    setup();
    expect(optionNames()).toHaveLength(5);

    fireEvent.change(screen.getByRole('textbox', { name: 'Search Branch' }), {
      target: { value: 'learn' },
    });
    expect(optionNames()).toEqual(['Machine Learning', 'Other']);
    expect(screen.queryByText('Core Computing')).toBeNull();
    expect(screen.getByText('AI & Data')).toBeTruthy();
  });

  it('picks the first match with Enter', () => {
    const onChange = setup();
    const box = screen.getByRole('textbox', { name: 'Search Branch' });
    fireEvent.change(box, { target: { value: 'information' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith({ target: { value: 'Information Technology' } });
  });

  it('keeps only the pinned option when nothing matches', () => {
    setup();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search Branch' }), {
      target: { value: 'zzzz' },
    });
    expect(optionNames()).toEqual(['Other']);
  });
});
