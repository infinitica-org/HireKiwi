import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import hirekiwiTextImg from '../assets/images/Logos/WebP/samrt-text.png';
import hirekiwiLogoImg from '../assets/images/Logos/WebP/HireKiwi-logo.jpg';
import hirekiwiLogoTextImg from '../assets/images/Logos/WebP/hirekiwi-logo-text.jpg';

export { HIREKIWI_MARK_TEAL } from '../brand/colors';

export function resolveImageSource(asset: unknown): string {
  if (typeof asset === 'string') return asset;
  if (
    asset &&
    typeof asset === 'object' &&
    'src' in asset &&
    typeof (asset as { src: unknown }).src === 'string'
  ) {
    return (asset as { src: string }).src;
  }
  return '';
}

export const HIREKIWI_TEXT_LOGO_SRC: string = resolveImageSource(hirekiwiTextImg);
export const HIREKIWI_LOGO_SRC: string = resolveImageSource(hirekiwiLogoImg);
export const HIREKIWI_LOGO_TEXT_SRC: string = resolveImageSource(hirekiwiLogoTextImg);

export type HireKiwiLogoKind = 'text' | 'wordmark' | 'mark';
export type HireKiwiLogoTone = 'auto' | 'on-light' | 'on-dark';
export interface HireKiwiLogoProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  kind?: HireKiwiLogoKind;
  tone?: HireKiwiLogoTone;
  title?: string;
}

export function HireKiwiLogo({
  kind = 'text',
  tone: _tone = 'auto',
  title = 'HireKiwi',
  className,
  ...props
}: HireKiwiLogoProps) {
  if (kind === 'mark') {
    return (
      <span
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center overflow-hidden',
          className,
        )}
        {...props}
      >
        <img src={HIREKIWI_LOGO_SRC} alt={title} className="size-full object-contain" />
      </span>
    );
  }

  if (kind === 'wordmark') {
    return (
      <span
        className={cn('inline-flex h-8 w-auto shrink-0 items-center overflow-hidden', className)}
        {...props}
      >
        <img src={HIREKIWI_LOGO_TEXT_SRC} alt={title} className="h-full w-auto object-contain" />
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex h-8 w-auto shrink-0 items-center overflow-hidden', className)}
      {...props}
    >
      <img src={HIREKIWI_TEXT_LOGO_SRC} alt={title} className="h-full w-auto object-contain" />
    </span>
  );
}
