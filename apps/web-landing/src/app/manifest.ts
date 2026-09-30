import type { MetadataRoute } from 'next';
import { PAGES, SITE_NAME, THEME_COLOR } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: PAGES.home.description,
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: THEME_COLOR,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
