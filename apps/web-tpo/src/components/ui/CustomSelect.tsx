'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  ariaLabel,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-full inline-flex items-center justify-between gap-2.5 rounded-md border border-zinc-200/90 bg-white px-3.5 text-xs sm:text-sm font-medium text-zinc-800 shadow-2xs transition-all hover:bg-zinc-50 hover:text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-zinc-800' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 z-50 mt-1.5 max-h-60 w-full min-w-[180px] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg animate-in fade-in-50 zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                <div className="flex flex-col text-left min-w-0 flex-1">
                  <span className="truncate">{opt.label}</span>
                  {opt.sublabel ? (
                    <span
                      className={`text-[10px] ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}
                    >
                      {opt.sublabel}
                    </span>
                  ) : null}
                </div>
                {isSelected ? <Check className="size-4 shrink-0 text-white" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
