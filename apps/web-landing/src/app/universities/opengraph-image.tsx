import { renderOgImage } from '@/lib/og-image';
import { OG_IMAGE_SIZE, PAGES, ogImageAlt } from '@/lib/seo';

export const alt = ogImageAlt(PAGES.universities);
export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderOgImage('universities');
}
