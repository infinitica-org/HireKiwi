'use client';

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

/**
 * A dropdown menu that takes the same `<option>` / `<optgroup>` children as a native `<select>`,
 * so a form can swap the tag and keep its markup. The list is drawn by us (rounded, with a tick on
 * the chosen row and keyboard support) instead of the browser's plain system list.
 */

interface OptionItem {
  value: string;
  label: string;
  disabled: boolean;
}

interface Row {
  key: string;
  group?: string;
  option?: OptionItem;
}

type OptionElement = ReactElement<{
  value?: string | number;
  disabled?: boolean;
  children?: ReactNode;
}>;
type GroupElement = ReactElement<{ label?: string; children?: ReactNode }>;

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('');
}

function optionOf(element: OptionElement): OptionItem {
  const label = textOf(element.props.children);
  return {
    value: element.props.value === undefined ? label : String(element.props.value),
    label,
    disabled: Boolean(element.props.disabled),
  };
}

function rowsFrom(children: ReactNode): Row[] {
  const rows: Row[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === 'optgroup') {
      const group = child as GroupElement;
      rows.push({ key: `group-${group.props.label ?? ''}`, group: group.props.label ?? '' });
      Children.forEach(group.props.children, (inner) => {
        if (isValidElement(inner) && inner.type === 'option') {
          const option = optionOf(inner as OptionElement);
          rows.push({ key: `option-${option.value}-${rows.length}`, option });
        }
      });
    } else if (child.type === 'option') {
      const option = optionOf(child as OptionElement);
      rows.push({ key: `option-${option.value}-${rows.length}`, option });
    }
  });
  return rows;
}

export interface StyledSelectProps {
  id?: string;
  value: string;
  /** Called like a native select's change event: read the new value from `event.target.value`. */
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
  /** Classes for the closed box, usually the same field class the form already uses. */
  className?: string;
  required?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
  /** Adds a filter box at the top of the open list; matching is by label, ignoring case. */
  searchable?: boolean;
  /** Option values that stay listed whatever is typed (for example an "Other" escape hatch). */
  pinnedValues?: readonly string[];
}

export function StyledSelect({
  id,
  value,
  onChange,
  children,
  className = '',
  required = false,
  disabled = false,
  'aria-label': ariaLabel,
  searchable = false,
  pinnedValues = [],
}: StyledSelectProps) {
  const autoId = useId();
  const buttonId = id ?? autoId;
  const listId = `${buttonId}-list`;
  const allRows = useMemo(() => rowsFrom(children), [children]);
  const allOptions = useMemo(() => allRows.filter((row) => row.option), [allRows]);
  const selected = allOptions.find((row) => row.option?.value === value)?.option;
  // The option with an empty value is the prompt ("Select program"), shown muted when nothing is chosen.
  const placeholder = allOptions.find((row) => row.option?.value === '')?.option?.label ?? 'Select';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const needle = searchable ? query.trim().toLowerCase() : '';
  const pinnedKey = pinnedValues.join('|');
  // While filtering, drop non-matching options and any group heading left with nothing under it.
  const rows = useMemo(() => {
    if (!needle) return allRows;
    const pinned = new Set(pinnedKey ? pinnedKey.split('|') : []);
    const keep = (row: Row | undefined) =>
      Boolean(
        row?.option &&
        row.option.value !== '' &&
        (pinned.has(row.option.value) || row.option.label.toLowerCase().includes(needle)),
      );
    const out: Row[] = [];
    allRows.forEach((row, at) => {
      if (row.group === undefined) {
        if (keep(row)) out.push(row);
        return;
      }
      for (
        let next = at + 1;
        next < allRows.length && allRows[next]?.group === undefined;
        next += 1
      ) {
        if (keep(allRows[next])) {
          out.push(row);
          return;
        }
      }
    });
    return out;
  }, [allRows, needle, pinnedKey]);
  const options = useMemo(() => rows.filter((row) => row.option), [rows]);
  const [active, setActive] = useState(-1);
  const [box, setBox] = useState<{ top: number; left: number; width: number; up: boolean } | null>(
    null,
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const room = window.innerHeight - rect.bottom;
    const up = room < 260 && rect.top > room;
    setBox({
      top: up ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      up,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      const target = event.target as Node | null;
      if (target && (buttonRef.current?.contains(target) || panelRef.current?.contains(target))) {
        return;
      }
      setOpen(false);
    };
    const reflow = () => place();
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', reflow);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', reflow);
      window.removeEventListener('scroll', close, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable, box]);

  // Typing narrows the list, so land on the first match.
  useEffect(() => {
    if (!open || !needle) return;
    setActive(options.findIndex((row) => !row.option?.disabled));
  }, [open, needle, options]);

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${String(active)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const enabledIndexes = options
    .map((row, index) => (row.option?.disabled ? -1 : index))
    .filter((index) => index >= 0);

  const openList = () => {
    if (disabled) return;
    const current = options.findIndex((row) => row.option?.value === value);
    setActive(current >= 0 ? current : (enabledIndexes[0] ?? -1));
    setQuery('');
    setOpen(true);
  };

  const choose = (item: OptionItem) => {
    if (item.disabled) return;
    onChange({ target: { value: item.value } });
    setOpen(false);
    setQuery('');
    buttonRef.current?.focus();
  };

  const move = (step: 1 | -1) => {
    if (enabledIndexes.length === 0) return;
    const at = enabledIndexes.indexOf(active);
    const nextAt =
      at === -1
        ? step === 1
          ? 0
          : enabledIndexes.length - 1
        : Math.min(enabledIndexes.length - 1, Math.max(0, at + step));
    setActive(enabledIndexes[nextAt] ?? -1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActive(enabledIndexes[0] ?? -1);
        break;
      case 'End':
        event.preventDefault();
        setActive(enabledIndexes[enabledIndexes.length - 1] ?? -1);
        break;
      case 'Enter':
      case ' ': {
        // In the filter box a space is just a typed space.
        if (event.key === ' ' && searchable) break;
        event.preventDefault();
        const item = options[active]?.option;
        if (item) choose(item);
        break;
      }
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (!searchable && event.key.length === 1) {
          const letter = event.key.toLowerCase();
          const from = enabledIndexes.filter((index) => index > active);
          const all = [...from, ...enabledIndexes];
          const hit = all.find((index) =>
            options[index]?.option?.label.toLowerCase().startsWith(letter),
          );
          if (hit !== undefined) setActive(hit);
        }
    }
  };

  let optionIndex = -1;

  return (
    <>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`${className} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected && value !== '' ? '' : 'opacity-60'}`}>
          {selected && value !== '' ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {required ? (
        // Lets the browser's own "please fill out this field" check still apply on submit.
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => undefined}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      ) : null}
      {open && box
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                position: 'fixed',
                left: box.left,
                width: box.width,
                ...(box.up ? { bottom: window.innerHeight - box.top } : { top: box.top }),
              }}
              className="z-[100] overflow-hidden rounded-lg border border-zinc-200 bg-white font-sans text-sm text-zinc-900 shadow-lg dark:border-zinc-700 dark:bg-[#1c1c1c] dark:text-white"
            >
              {searchable ? (
                <div className="border-b border-zinc-200 p-1.5 dark:border-zinc-700">
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Search…"
                    aria-label={ariaLabel ? `Search ${ariaLabel}` : 'Search options'}
                    aria-controls={listId}
                    className="w-full rounded-md border border-zinc-200 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700"
                  />
                </div>
              ) : null}
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label={ariaLabel}
                className="max-h-64 overflow-y-auto p-1"
              >
                {rows.map((row) => {
                  if (row.group !== undefined) {
                    return (
                      <li
                        key={row.key}
                        role="presentation"
                        className="px-2.5 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase"
                      >
                        {row.group}
                      </li>
                    );
                  }
                  const item = row.option;
                  if (!item) return null;
                  optionIndex += 1;
                  const index = optionIndex;
                  const isSelected = item.value === value && value !== '';
                  return (
                    <li
                      key={row.key}
                      role="option"
                      data-index={index}
                      data-value={item.value}
                      aria-selected={isSelected}
                      aria-disabled={item.disabled || undefined}
                      onMouseEnter={() => !item.disabled && setActive(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(item)}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 ${
                        item.disabled ? 'cursor-not-allowed opacity-40' : ''
                      } ${
                        index === active ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                      } ${item.value === '' ? 'text-zinc-400' : ''} ${isSelected ? 'font-semibold' : ''}`}
                    >
                      <span className="truncate">{item.label}</span>
                      {isSelected ? (
                        <Check className="size-4 shrink-0 text-emerald-600" aria-hidden />
                      ) : null}
                    </li>
                  );
                })}
                {searchable && needle && options.length === 0 ? (
                  <li role="presentation" className="px-2.5 py-2 text-zinc-400">
                    No matches
                  </li>
                ) : null}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
