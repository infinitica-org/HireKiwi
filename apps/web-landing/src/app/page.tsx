import Hero from '@/components/Hero';
import AudienceTabs from '@/components/AudienceTabs';
// import Problem from '@/components/Problem';
import ClosingCTA from '@/components/ClosingCTA';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('home');

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <AudienceTabs />
      {/* <Problem /> */}
      <ClosingCTA />
    </main>
  );
}
