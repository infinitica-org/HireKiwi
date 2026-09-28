import Link from 'next/link';
import { Calendar, UserPlus, Sparkles } from 'lucide-react';

type DashboardHeroProps = {
  greeting: string;
  displayName: string;
  formattedDate: string;
  loading: boolean;
};

export function DashboardHero({
  greeting,
  displayName,
  formattedDate,
  loading,
}: DashboardHeroProps) {
  return (
    <section className="relative z-0 -mx-4 -mt-6 overflow-hidden px-4 pt-12 pb-14 text-center md:-mx-6 md:-mt-4 md:px-6 md:pt-16 md:pb-18">
      {/* Exact Electric Lime-Yellow & Soft Cyan Mesh Cloud (1:1 Handshake Referrals Banner Match) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 50% 20%, rgba(212, 246, 66, 0.6) 0%, rgba(190, 242, 100, 0.45) 30%, rgba(165, 243, 252, 0.35) 60%, transparent 100%),
            radial-gradient(ellipse 50% 45% at 50% 5%, rgba(254, 240, 138, 0.65) 0%, transparent 80%),
            linear-gradient(180deg, rgba(247, 254, 231, 0.75) 0%, rgba(255, 255, 255, 1) 100%)
          `,
        }}
      />

      {/* Soft Blurred Glow Orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-80 w-[75%] max-w-3xl -translate-x-1/2 rounded-full bg-gradient-to-r from-[#ccf32f]/60 via-[#fef08a]/60 to-[#7dd3fc]/50 blur-[70px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-4 left-1/2 -z-10 h-64 w-[55%] max-w-xl -translate-x-1/2 rounded-full bg-[#d4f642]/60 blur-[50px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-6 left-1/4 -z-10 h-64 w-80 rounded-full bg-[#bef264]/70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-6 right-1/4 -z-10 h-64 w-80 rounded-full bg-[#67e8f9]/60 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/80 px-3.5 py-1 text-xs font-semibold text-emerald-900 mb-3 shadow-2xs backdrop-blur-xs">
          <Sparkles className="size-3.5 text-emerald-600" />
          <span>{greeting}</span>
        </div>

        {loading ? (
          <div className="mx-auto mt-2 h-11 w-72 animate-pulse rounded-lg bg-zinc-200/60" />
        ) : (
          <h1 className="font-heading mx-auto text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl md:text-5xl">
            {displayName}
          </h1>
        )}

        <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-zinc-600 sm:text-sm md:text-base">
          Connect verified campus talent directly with hiring employers and track placement drive
          progress.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-md border border-zinc-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-600 shadow-2xs backdrop-blur-xs">
            <Calendar className="size-3.5 text-zinc-500" strokeWidth={1.5} />
            {formattedDate}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/whitelist"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99]"
          >
            <UserPlus className="size-4" />
            Onboard Candidates
          </Link>
        </div>
      </div>
    </section>
  );
}
