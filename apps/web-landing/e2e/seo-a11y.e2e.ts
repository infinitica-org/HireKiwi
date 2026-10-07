import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/students', '/universities', '/company', '/universities/contact'];

function metaContent(html: string, attr: 'property' | 'name', key: string): string | undefined {
  const re = new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`);
  return re.exec(html)?.[1];
}

test.describe('landing SEO tags', () => {
  for (const route of ROUTES) {
    test(`${route} has OpenGraph, Twitter and canonical tags`, async ({ request }) => {
      const res = await request.get(route);
      expect(res.status()).toBe(200);
      const html = await res.text();

      for (const key of ['og:title', 'og:description', 'og:image', 'og:url', 'og:image:alt']) {
        expect(metaContent(html, 'property', key), key).toBeTruthy();
      }
      expect(metaContent(html, 'property', 'og:type')).toBe('website');
      expect(metaContent(html, 'property', 'og:site_name')).toBe('HireKiwi');
      expect(metaContent(html, 'name', 'twitter:card')).toBe('summary_large_image');
      expect(metaContent(html, 'name', 'twitter:image')).toBeTruthy();
      expect(metaContent(html, 'name', 'description')?.length ?? 0).toBeLessThanOrEqual(155);
      expect(html).toMatch(/<link rel="canonical" href="https?:\/\/[^"]+"/);
      expect(html).toContain('<html lang="en"');
      expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    });
  }

  test('home has title, JSON-LD and a 1200x630 share image', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('<title>HireKiwi – Verified skills. The right fit, faster.</title>');
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"@type":"WebSite"');

    const og = await request.get('/opengraph-image');
    expect(og.status()).toBe(200);
    expect(og.headers()['content-type']).toContain('image/png');
  });

  test('robots.txt and sitemap.xml are served', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const robotsText = await robots.text();
    expect(robotsText).toContain('Allow: /');
    expect(robotsText).toContain('Disallow: /api/');
    expect(robotsText).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/);

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    for (const route of ROUTES.filter((r) => r !== '/')) {
      expect(xml).toContain(`${route}</loc>`);
    }
  });
});

test.describe('landing accessibility (axe)', () => {
  for (const route of ROUTES) {
    test(`${route} has no critical or serious violations`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/cdn-cookieyes.com/**', (r) => r.abort());
      await page.goto(route);
      // Scroll through so whileInView sections render before scanning.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 50));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(700);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );
      expect(
        blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    });
  }
});
