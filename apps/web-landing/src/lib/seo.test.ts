import { describe, expect, it } from 'vitest';
import {
  HOME_TITLE,
  PAGES,
  isIndexable,
  jsonLd,
  pageMetadata,
  robotsRules,
  rootMetadata,
  sitemapEntries,
} from './seo';

const prod = { NEXT_PUBLIC_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://smart.test' };

describe('landing SEO config', () => {
  it('keeps titles and descriptions within search-result limits', () => {
    expect(HOME_TITLE.length).toBeLessThanOrEqual(60);
    for (const [key, page] of Object.entries(PAGES)) {
      const fullTitle = key === 'home' ? page.title : `${page.title} | HireKiwi`;
      expect(fullTitle.length, page.path).toBeLessThanOrEqual(60);
      expect(page.description.length, page.path).toBeLessThanOrEqual(155);
    }
  });

  it('is indexable only in production', () => {
    expect(isIndexable(prod)).toBe(true);
    expect(isIndexable({ SMART_ENV: 'prod' })).toBe(true);
    expect(isIndexable({ VERCEL_ENV: 'production' })).toBe(true);
    expect(isIndexable({})).toBe(false);
    expect(isIndexable({ NEXT_PUBLIC_ENV: 'staging', SMART_ENV: 'prod' })).toBe(false);
    expect(isIndexable({ VERCEL_ENV: 'preview' })).toBe(false);
  });

  it('disallows everything and sets noindex outside production', () => {
    const env = { NEXT_PUBLIC_ENV: 'staging' };
    expect(robotsRules(env)).toEqual({ rules: { userAgent: '*', disallow: '/' } });
    expect(rootMetadata(env).robots).toMatchObject({ index: false, follow: false });
  });

  it('allows public routes and points to the sitemap in production', () => {
    const robots = robotsRules(prod);
    expect(robots.rules).toMatchObject({ allow: '/', disallow: ['/api/', '/health'] });
    expect(robots.sitemap).toBe('https://smart.test/sitemap.xml');
    expect(rootMetadata(prod).robots).toMatchObject({ index: true, follow: true });
  });

  it('lists every public route in the sitemap with absolute URLs', () => {
    const urls = sitemapEntries(prod).map((e) => e.url);
    expect(urls).toEqual([
      'https://smart.test/',
      'https://smart.test/students',
      'https://smart.test/universities',
      'https://smart.test/company',
      'https://smart.test/universities/contact',
    ]);
  });

  it('builds per-route canonical, OpenGraph and Twitter metadata', () => {
    const meta = pageMetadata('company');
    expect(meta.alternates?.canonical).toBe('/company');
    expect(meta.openGraph).toMatchObject({ url: '/company', type: 'website', locale: 'en_IN' });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('emits Organization and WebSite JSON-LD', () => {
    const types = jsonLd(prod)['@graph'].map((n) => n['@type']);
    expect(types).toEqual(['Organization', 'WebSite']);
  });
});
