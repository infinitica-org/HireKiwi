import { portalIcons } from '@hirekiwi/ui/brand/portal-icons';
import type { Metadata, MetadataRoute, Viewport } from 'next';

/**
 * Single source of truth for landing-site SEO: titles, descriptions, OpenGraph /
 * Twitter cards, canonical URLs, robots rules and the sitemap. Route layouts,
 * `app/robots.ts`, `app/sitemap.ts` and the OG image routes all read from here.
 */

export const SITE_NAME = 'SMART';

// TODO(Th6-598): confirm the production domain. CookieYes is registered for
// becomesmart.online; set NEXT_PUBLIC_SITE_URL in each deploy environment.
const FALLBACK_SITE_URL = 'https://smart.example';

export const THEME_COLOR = '#ffffff';
export const BRAND_LIME = '#d9fa61';
export const BRAND_INK = '#09090b';

export type SeoEnv = Record<string, string | undefined>;

// Direct `process.env.NEXT_PUBLIC_*` reads are inlined at build time, so robots and
// noindex follow the build's environment even when a response is re-rendered by a
// server process started without those variables. Don't spread `process.env` here.
const BUILD_ENV: SeoEnv = {
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  SMART_ENV: process.env.SMART_ENV,
};

export function siteUrl(env: SeoEnv = BUILD_ENV): URL {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL;
  return new URL(raw.endsWith('/') ? raw : `${raw}/`);
}

/**
 * Only production is indexable. Precedence: NEXT_PUBLIC_ENV, then VERCEL_ENV,
 * then the repo-wide SMART_ENV. Anything else (unset, preview, staging, dev, qa)
 * gets `Disallow: /` and noindex so non-production hosts never get indexed.
 */
export function isIndexable(env: SeoEnv = BUILD_ENV): boolean {
  const value = (env.NEXT_PUBLIC_ENV || env.VERCEL_ENV || env.SMART_ENV || '').toLowerCase();
  return value === 'production' || value === 'prod';
}

export interface PageSeo {
  path: string;
  /** `<title>` segment; the root layout template appends " | SMART". */
  title: string;
  description: string;
  /** Headline and tagline rendered into the page's 1200×630 share card. */
  ogHeadline: string;
  ogTagline: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
}

export const HOME_TITLE = 'SMART – Verified skills. The right fit, faster.';

export const PAGES = {
  home: {
    path: '/',
    title: HOME_TITLE,
    description:
      'SMART connects students, universities and employers through verified skills – endorsed experience, signed credentials and AI-defended projects.',
    ogHeadline: 'The right fit. Faster.',
    ogTagline: 'Verified skills connecting students, universities and employers.',
    changeFrequency: 'weekly',
    priority: 1,
  },
  students: {
    path: '/students',
    title: 'For Students – Get hired on verified skills',
    description:
      'Skip the resume black hole. Build real projects, earn a signed, verifiable credential and get discovered by employers. Free for students.',
    ogHeadline: 'Get hired on verified capability.',
    ogTagline: 'Signed credentials and a Tier Trail employers trust. Free for students.',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  universities: {
    path: '/universities',
    title: 'For Universities & TPOs – Prove placement outcomes',
    description:
      'Cohort readiness analytics, verified placement data and accreditation-ready reports for placement offices and career centres.',
    ogHeadline: 'Get your students hired.',
    ogTagline: 'Cohort readiness analytics and verified placement outcomes.',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  company: {
    path: '/company',
    title: 'For Employers – Hire pre-verified talent',
    description:
      'Reach pre-qualified candidates with signed credentials, sandbox evidence and calibrated BARS scores. Cut screening time and cost per hire.',
    ogHeadline: 'Hire less. Hire right.',
    ogTagline: 'Pre-qualified candidates with signed, tamper-proof evidence.',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  universityContact: {
    path: '/universities/contact',
    title: 'Contact us – Universities & TPOs',
    description:
      'Talk to the SMART partnerships team about verified skills, placement workflows and readiness analytics for your campus.',
    ogHeadline: "Let's connect.",
    ogTagline: 'Bring verified skills and placement analytics to your campus.',
    changeFrequency: 'yearly',
    priority: 0.5,
  },
} satisfies Record<string, PageSeo>;

export type PageKey = keyof typeof PAGES;

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function ogImageAlt(page: PageSeo): string {
  return `${SITE_NAME} – ${page.ogHeadline} ${page.ogTagline}`;
}

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: 'light',
};

/** Site-wide defaults, exported by the root layout. */
export function rootMetadata(env: SeoEnv = BUILD_ENV): Metadata {
  const home = PAGES.home;
  const indexable = isIndexable(env);
  return {
    metadataBase: siteUrl(env),
    applicationName: SITE_NAME,
    title: { default: home.title, template: `%s | ${SITE_NAME}` },
    description: home.description,
    manifest: '/manifest.webmanifest',
    icons: portalIcons,
    formatDetection: { telephone: false, email: false, address: false },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_IN',
      title: home.title,
      description: home.description,
      url: home.path,
    },
    twitter: {
      card: 'summary_large_image',
      title: home.title,
      description: home.description,
    },
    alternates: { canonical: home.path },
  };
}

/**
 * Per-route metadata. Child `openGraph` / `twitter` objects replace the parent's
 * rather than merging, so every field is restated here. Images come from each
 * route's `opengraph-image.tsx` / `twitter-image.tsx`.
 */
export function pageMetadata(key: PageKey): Metadata {
  const page: PageSeo = PAGES[key];
  const fullTitle = key === 'home' ? page.title : `${page.title} | ${SITE_NAME}`;
  return {
    title: key === 'home' ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_IN',
      title: fullTitle,
      description: page.description,
      url: page.path,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: page.description,
    },
  };
}

export function robotsRules(env: SeoEnv = BUILD_ENV): MetadataRoute.Robots {
  const base = siteUrl(env);
  if (!isIndexable(env)) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Landing-only server routes. Portals (student/tpo/admin/company apps) live on
      // their own hosts and send `noindex` themselves.
      disallow: ['/api/', '/health'],
    },
    sitemap: new URL('sitemap.xml', base).toString(),
    host: base.origin,
  };
}

export function sitemapEntries(
  env: SeoEnv = BUILD_ENV,
  lastModified: Date = new Date(),
): MetadataRoute.Sitemap {
  const base = siteUrl(env);
  return Object.values(PAGES).map((page: PageSeo) => ({
    url: new URL(page.path.replace(/^\//, ''), base).toString(),
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

/** Organization + WebSite structured data for the root layout. */
export function jsonLd(env: SeoEnv = BUILD_ENV) {
  const base = siteUrl(env);
  const url = base.toString();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${url}#organization`,
        name: SITE_NAME,
        url,
        logo: new URL('icons/icon-512.png', base).toString(),
      },
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name: SITE_NAME,
        url,
        description: PAGES.home.description,
        inLanguage: 'en',
        publisher: { '@id': `${url}#organization` },
      },
    ],
  };
}
