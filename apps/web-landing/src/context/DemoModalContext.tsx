'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface DemoModalContextType {
  isOpen: boolean;
  openModal: (triggerElement?: HTMLElement | null) => void;
  closeModal: () => void;
}

const DemoModalContext = createContext<DemoModalContextType | undefined>(undefined);

export function DemoModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openModal = useCallback((triggerElement?: HTMLElement | null) => {
    if (triggerElement) {
      triggerRef.current = triggerElement;
    } else if (typeof document !== 'undefined') {
      triggerRef.current = document.activeElement as HTMLElement | null;
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
      triggerRef.current.focus();
    }
  }, []);

  return (
    <DemoModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </DemoModalContext.Provider>
  );
}

export function useDemoModal() {
  const context = useContext(DemoModalContext);
  if (!context) {
    throw new Error('useDemoModal must be used within a DemoModalProvider');
  }
  return context;
}
