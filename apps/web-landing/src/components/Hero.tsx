'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { studentAppUrl } from '@/lib/portal-urls';

const WORDS = ['Faster.', 'Verified.', 'Smarter.'] as const;
const FILTER_CHIPS = ['AI specialists', 'Full-time', 'Remote', 'Internship'] as const;

export default function Hero() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Typing effect state for three words
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = WORDS[wordIndex];
    if (!currentWord) return;

    let timer: NodeJS.Timeout;

    if (!isDeleting && text === currentWord) {
      // Pause at complete word
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && text === '') {
      // Move to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    } else {
      // Typing or backspacing
      const speed = isDeleting ? 60 : 120;
      timer = setTimeout(() => {
        setText((prev) =>
          isDeleting
            ? currentWord.substring(0, prev.length - 1)
            : currentWord.substring(0, prev.length + 1),
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const base = studentAppUrl();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (activeFilter) {
      params.set('type', activeFilter.toLowerCase().replace(/\s+/g, '-'));
    }
    const qs = params.toString();
    window.location.href = qs ? `${base}/jobs?${qs}` : `${base}/jobs`;
  }

  return (
    <section
      id="job-seekers"
      data-section="hero"
      className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden bg-white bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(225,255,160,0.7)_0%,rgba(180,248,220,0.4)_45%,rgba(255,255,255,0)_80%)] px-5 sm:px-8 pt-20 sm:pt-24 pb-20 sm:pb-28"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="font-header text-5xl font-medium leading-[1.02] tracking-[-0.04em] text-slate-900 sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.25rem]"
        >
          The right fit.
          <span className="mt-1 block sm:mt-2">
            <span className="relative inline-block px-1.5 sm:px-2">
              <span
                className="absolute inset-x-0 bottom-1 sm:bottom-2.5 md:bottom-3 -z-10 h-5 sm:h-8 md:h-10 lg:h-12 rounded-sm bg-[#d9fa61]"
                aria-hidden="true"
              />
              <span className="inline-block min-w-[0.5ch]">{text || '\u00A0'}</span>
              <span
                className="inline-block w-[3px] h-[0.72em] align-baseline bg-zinc-950 ml-0.5 animate-pulse"
                aria-hidden="true"
              />
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg md:max-w-2xl"
        >
          15M+ students. 1M+ companies. One network where every profile is real.
        </motion.p>

        {/* Aesthetic Search Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 sm:mt-10 w-full max-w-3xl sm:max-w-4xl"
        >
          <form
            onSubmit={handleSearch}
            className="group relative flex h-16 sm:h-20 w-full items-center gap-3 sm:gap-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-[0_10px_36px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] hover:border-zinc-300 hover:shadow-[0_14px_44px_rgba(0,0,0,0.08)] focus-within:border-zinc-950/40 focus-within:ring-4 focus-within:ring-zinc-950/5 transition-all px-3 sm:px-5"
          >
            {/* Search Icon */}
            <div className="flex shrink-0 items-center justify-center pl-1 text-zinc-600 sm:pl-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="size-6 sm:size-7 text-zinc-700"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
                <path
                  d="M20 20l-3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <span className="sr-only">Search roles or companies</span>

            {/* Text Input */}
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Part-time jobs for students studying design"
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-zinc-900 placeholder:text-zinc-400 outline-none sm:text-lg md:text-xl"
            />

            {/* Upward Arrow Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Submit search"
              className="flex h-11 w-11 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
            >
              <ArrowRight className="size-5 sm:size-5.5" />
            </motion.button>
          </form>
        </motion.div>

        {/* Filter Chips */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
        >
          {FILTER_CHIPS.map((label) => {
            const isActive = activeFilter === label;
            return (
              <motion.button
                key={label}
                type="button"
                aria-pressed={isActive}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveFilter(isActive ? null : label)}
                className={`rounded-xl border px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-all sm:text-sm ${
                  isActive
                    ? 'border-[#c6ec3b] bg-[#d9fa61] font-semibold text-zinc-950 shadow-[0_4px_14px_rgba(217,250,97,0.35)]'
                    : 'border-zinc-200/90 bg-white/90 text-zinc-600 shadow-2xs hover:border-zinc-300 hover:bg-white hover:text-zinc-950'
                }`}
              >
                {label}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
