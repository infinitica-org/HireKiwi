'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';

import smartTextImg from '@hirekiwi/ui/assets/images/Logos/WebP/samrt-text.png';
import { authLoginUrl } from '@/lib/portal-urls';
import { getClientSession, type SessionInfo } from '@/lib/session';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Students', href: '/students' },
  { label: 'Universities', href: '/universities' },
  { label: 'Company', href: '/company' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isUniversityPage = pathname === '/universities' || pathname?.startsWith('/universities/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<SessionInfo>({
    isLoggedIn: false,
    role: null,
    portalUrl: null,
  });
  const [sessionResolved, setSessionResolved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSession(getClientSession());
    setSessionResolved(true);

    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll and trap Esc when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          setMobileMenuOpen(false);
        }
      }
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  function isItemActive(href: string) {
    return pathname === href;
  }

  return (
    <header
      className={`fixed inset-x-0 z-[999] transition-all duration-300 ${
        isScrolled
          ? 'top-3 sm:top-4 px-4 sm:px-6 pointer-events-none'
          : 'top-0 px-0 pointer-events-auto'
      }`}
    >
      <div
        className={`mx-auto transition-all duration-300 ${
          isScrolled
            ? `pointer-events-auto w-full max-w-5xl ${
                mobileMenuOpen ? 'rounded-xl' : 'rounded-lg'
              } border border-zinc-200/90 bg-white/95 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.08)]`
            : `w-full max-w-7xl ${
                mobileMenuOpen ? 'bg-white shadow-lg' : 'bg-transparent'
              } border-b border-transparent`
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'h-14 sm:h-15 px-5 sm:px-7' : 'h-18 sm:h-20 px-6 sm:px-10 lg:px-12'
          }`}
        >
          {/* Left: HireKiwi Logo -> '/' */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label="HireKiwi home"
          >
            <Image
              src={smartTextImg}
              alt="HireKiwi"
              priority
              className={`${
                isScrolled ? 'h-7 sm:h-8' : 'h-8 sm:h-9'
              } w-auto object-contain transition-all duration-300`}
            />
          </Link>

          {/* Center: Three Navigation Route Links */}
          <nav
            aria-label="Audience navigation"
            className="hidden md:flex items-center gap-6 lg:gap-7"
          >
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-md px-2.5 py-1 ${
                    active
                      ? 'font-bold text-zinc-950 border border-zinc-500'
                      : isScrolled
                        ? 'text-zinc-800'
                        : 'text-zinc-700'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {sessionResolved && session.isLoggedIn && session.portalUrl ? (
              /* Logged IN State */
              <a
                href={session.portalUrl}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-zinc-950 px-4.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-zinc-800"
              >
                <span>Go to Portal</span>
                <ArrowUpRight className="size-3.5 sm:size-4" />
              </a>
            ) : isUniversityPage ? (
              /* University Page -> Sign In + Contact us */
              <>
                <a
                  href={authLoginUrl()}
                  className="hidden sm:inline-block text-sm font-medium text-zinc-700 transition-colors hover:text-black px-2.5 py-1"
                >
                  Sign In
                </a>
                <Link
                  href="/universities/contact"
                  className={`inline-flex items-center justify-center rounded-lg bg-[#c0ec31] font-bold text-[#18001e] shadow-xs transition-all hover:bg-[#b0dc25] hover:scale-[1.02] active:scale-[0.98] ${
                    isScrolled ? 'px-4.5 py-1.5 text-xs sm:text-sm' : 'px-5 py-2 text-sm'
                  }`}
                >
                  Contact us
                </Link>
              </>
            ) : (
              /* Logged OUT State */
              <>
                <a
                  href={authLoginUrl()}
                  className="hidden sm:inline-block text-sm font-medium text-zinc-700 transition-colors hover:text-black px-2.5 py-1"
                >
                  Sign In
                </a>
                <a
                  href={authLoginUrl()}
                  className={`inline-flex items-center justify-center rounded-lg bg-zinc-950 font-semibold text-white shadow-xs transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] ${
                    isScrolled ? 'px-4.5 py-1.5 text-xs sm:text-sm' : 'px-5 py-2 text-sm'
                  }`}
                >
                  Login
                </a>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="flex md:hidden size-9 items-center justify-center rounded-lg text-zinc-700 hover:text-black"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              ref={drawerRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`overflow-hidden border-t border-zinc-100 bg-white/95 px-6 py-5 md:hidden shadow-xl backdrop-blur-lg ${
                isScrolled ? 'rounded-b-3xl' : ''
              }`}
            >
              <div className="flex flex-col gap-3">
                {NAV_ITEMS.map((item) => {
                  const active = isItemActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between py-2.5 text-left text-base font-medium transition-colors ${
                        active ? 'font-bold text-zinc-950' : 'text-zinc-800 hover:text-black'
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="mt-3 pt-4 border-t border-zinc-100 flex flex-col gap-3">
                  {sessionResolved && session.isLoggedIn && session.portalUrl ? (
                    <a
                      href={session.portalUrl}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-zinc-950 py-3 text-sm font-semibold text-white"
                    >
                      <span>Go to Portal</span>
                      <ArrowUpRight className="size-4" />
                    </a>
                  ) : isUniversityPage ? (
                    <>
                      <a
                        href={authLoginUrl()}
                        className="flex w-full items-center justify-center rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                      >
                        Sign In
                      </a>
                      <Link
                        href="/universities/contact"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex w-full items-center justify-center rounded-lg bg-[#c0ec31] py-2.5 text-sm font-bold text-[#18001e] hover:bg-[#b0dc25]"
                      >
                        Contact us
                      </Link>
                    </>
                  ) : (
                    <>
                      <a
                        href={authLoginUrl()}
                        className="flex w-full items-center justify-center rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                      >
                        Sign In
                      </a>
                      <a
                        href={authLoginUrl()}
                        className="flex w-full items-center justify-center rounded-lg bg-zinc-950 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                      >
                        Login
                      </a>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
