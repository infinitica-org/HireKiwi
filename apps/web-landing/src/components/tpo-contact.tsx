'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronDown, Check, Loader2 } from 'lucide-react';

export interface Option {
  label: string;
  value: string;
}

export const TPO_ROLE_OPTIONS: Option[] = [
  { label: 'Director of Career Center / Head of TPO', value: 'director_tpo' },
  { label: 'Placement Officer / Coordinator', value: 'placement_officer' },
  { label: 'Dean / Senior Academic Leadership', value: 'leadership' },
  { label: 'Department Head / Faculty Coordinator', value: 'faculty' },
  { label: 'Career Coach & Advisor', value: 'coach_advisor' },
  { label: 'Student Placement Representative', value: 'student_rep' },
  { label: 'Other', value: 'other' },
];

export const COLLEGE_DESIGNATION_OPTIONS = TPO_ROLE_OPTIONS;
export const TPO_REFERRAL_OPTIONS: Option[] = [];
export const TPO_FUNCTION_OPTIONS: Option[] = [];

interface NeatSelectProps {
  label: string;
  options: Option[];
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
  required?: boolean;
  preferredPlacement?: 'top' | 'bottom';
  id?: string;
}

export function NeatSelect({
  label,
  options,
  value,
  placeholder = 'Select an option...',
  onChange,
  required,
  preferredPlacement,
  id,
}: NeatSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent entire page from scrolling when scrolling inside the dropdown list
  useEffect(() => {
    const el = scrollableRef.current;
    if (!el || !isOpen) return;

    function handleWheel(e: WheelEvent) {
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const deltaY = e.deltaY;
      const isScrollingDown = deltaY > 0;
      const isScrollingUp = deltaY < 0;

      if (
        (isScrollingDown && scrollTop + clientHeight >= scrollHeight - 1) ||
        (isScrollingUp && scrollTop <= 1)
      ) {
        e.preventDefault();
      }
      e.stopPropagation();
    }

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  function handleToggle() {
    if (!isOpen && containerRef.current) {
      if (preferredPlacement === 'top') {
        setOpenUpward(true);
      } else if (preferredPlacement === 'bottom') {
        setOpenUpward(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 280 && rect.top > 200);
      }
    }
    setIsOpen((prev) => !prev);
  }

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <button
        id={id}
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-12 rounded-lg border bg-slate-50/60 px-4 text-sm text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
          isOpen
            ? 'border-slate-900 bg-white ring-2 ring-slate-900/10 shadow-sm'
            : 'border-slate-200 hover:border-slate-300 focus:bg-white focus:border-slate-900'
        }`}
      >
        <span
          className={
            selectedOption ? 'text-slate-900 font-medium truncate' : 'text-slate-500 truncate'
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`size-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-900' : ''
          }`}
        />
      </button>

      {required && (
        <input
          type="text"
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 6 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUpward ? 6 : -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-40 w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/15 ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
          >
            <div
              ref={scrollableRef}
              style={{ overscrollBehavior: 'contain' }}
              className="max-h-60 overflow-y-auto overscroll-contain space-y-0.5 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
            >
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
                    className={`w-full flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white font-medium shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && <Check className="size-4 shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface TpoContactFormProps {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
  onSuccess?: () => void;
}

export default function TpoContactForm({
  title = "Let's Connect",
  description = 'Discover how SMART can help transform your campus career center outcomes and placement pipeline.',
  compact = false,
  className = '',
  onSuccess,
}: TpoContactFormProps) {
  const [formData, setFormData] = useState({
    institutionName: '',
    location: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSelectChange(name: string, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    }, 700);
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Title & Description Header */}
      {(title || description) && (
        <div className="mb-8 text-left">
          {title && (
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
          )}
        </div>
      )}

      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 sm:p-10 text-center space-y-4"
        >
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-emerald-950">Thank You!</h3>
          <p className="text-sm sm:text-base text-emerald-800 max-w-md mx-auto leading-relaxed">
            Your inquiry for <strong>{formData.institutionName || 'your institution'}</strong> has
            been received. Our university partnerships team will get in touch with you shortly to
            schedule your personalized platform walkthrough.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  institutionName: '',
                  location: '',
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  role: '',
                  message: '',
                });
              }}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-4"
            >
              Submit another request
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* 1. College Details FIRST: Institution Name & Location (Full Width Long Inputs) */}
          <div>
            <label
              htmlFor="tpo-institution"
              className="block text-sm font-semibold text-slate-800 mb-2"
            >
              Institution / University name <span className="text-red-500">*</span>
            </label>
            <input
              id="tpo-institution"
              type="text"
              name="institutionName"
              required
              placeholder="E.g. Stanford University / Massachusetts Institute of Technology / IIT"
              value={formData.institutionName}
              onChange={handleChange}
              className="w-full h-12 rounded-lg border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          <div>
            <label
              htmlFor="tpo-location"
              className="block text-sm font-semibold text-slate-800 mb-2"
            >
              College / Campus location (City, State / Country){' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="tpo-location"
              type="text"
              name="location"
              required
              placeholder="E.g. Chennai, Tamil Nadu, India"
              value={formData.location}
              onChange={handleChange}
              className="w-full h-12 rounded-lg border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
            />
          </div>

          {/* 2. Contact Person Details: First Name & Last Name */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tpo-first-name"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                First name <span className="text-red-500">*</span>
              </label>
              <input
                id="tpo-first-name"
                type="text"
                name="firstName"
                required
                placeholder="E.g. Kristen"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full h-12 rounded-lg border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>
            <div>
              <label
                htmlFor="tpo-last-name"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                id="tpo-last-name"
                type="text"
                name="lastName"
                required
                placeholder="E.g. Smith"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full h-12 rounded-lg border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>
          </div>

          {/* 3. Contact Coordinates: Email & Phone Number */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tpo-email"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Institutional / Work email <span className="text-red-500">*</span>
              </label>
              <input
                id="tpo-email"
                type="email"
                name="email"
                required
                placeholder="name@university.edu"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-12 rounded-lg border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>
            <div>
              <label
                htmlFor="tpo-phone"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Phone number <span className="text-red-500">*</span>
              </label>
              <input
                id="tpo-phone"
                type="tel"
                name="phone"
                required
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-12 rounded-lg border border-slate-200 bg-slate-50/60 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>
          </div>

          {/* 4. Role Select */}
          <NeatSelect
            id="tpo-role"
            label="What best describes your role?"
            options={TPO_ROLE_OPTIONS}
            value={formData.role}
            required
            onChange={(val) => handleSelectChange('role', val)}
          />

          {/* 5. Optional Message */}
          {!compact && (
            <div>
              <label
                htmlFor="tpo-message"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Additional questions <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                id="tpo-message"
                name="message"
                rows={3}
                placeholder="Share your student cohort size, specific placement goals, or target demo dates..."
                value={formData.message}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition resize-y"
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#000000] px-8 text-sm font-medium text-white shadow-md transition-all hover:bg-black active:scale-[0.99] disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin text-white" />
                  <span>Submitting request…</span>
                </>
              ) : (
                <span>Schedule a demo</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
