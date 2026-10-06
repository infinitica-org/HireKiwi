import icon32 from '../assets/favicons/icon-32.png';
import icon192 from '../assets/favicons/icon-192.png';
import icon512 from '../assets/favicons/icon-512.png';
import appleTouchIcon from '../assets/favicons/apple-touch-icon.png';
import favicon from '../assets/favicons/favicon.ico';

/**
 * The browser-tab icon for every SMART portal, defined once.
 *
 * Each portal's root layout sets `icons: portalIcons` instead of keeping its own copy of the
 * files, so changing the logo here changes all of them. Server-safe on purpose: no React and no
 * client code, so a layout can import it without pulling in the component bundle.
 *
 *   import { portalIcons } from '@hirekiwi/ui/brand/portal-icons';
 *   export const metadata: Metadata = { icons: portalIcons };
 */

interface PortalIcon {
  url: string;
  sizes?: string;
  type?: string;
}

/** Bundlers hand back either a URL string or `{ src }` for an imported image. */
function sourceOf(asset: unknown): string {
  if (typeof asset === 'string') return asset;
  if (asset && typeof asset === 'object' && 'src' in asset) {
    const { src } = asset as { src: unknown };
    if (typeof src === 'string') return src;
  }
  return '';
}

export const portalIcons: {
  icon: PortalIcon[];
  shortcut: PortalIcon[];
  apple: PortalIcon[];
} = {
  icon: [
    { url: sourceOf(icon32), sizes: '32x32', type: 'image/png' },
    { url: sourceOf(icon192), sizes: '192x192', type: 'image/png' },
    { url: sourceOf(icon512), sizes: '512x512', type: 'image/png' },
  ],
  shortcut: [{ url: sourceOf(favicon), type: 'image/x-icon' }],
  apple: [{ url: sourceOf(appleTouchIcon), sizes: '180x180', type: 'image/png' }],
};
