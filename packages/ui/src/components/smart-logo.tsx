import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import smartTextImg from '../assets/images/Logos/WebP/samrt-text.png';
import smartLogoImg from '../assets/images/Logos/WebP/Smart-logo.jpg';
import smartLogoTextImg from '../assets/images/Logos/WebP/smart-logo-text.jpg';

export { SMART_MARK_TEAL } from '../brand/colors';

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

export const SMART_TEXT_LOGO_SRC: string = resolveImageSource(smartTextImg);
export const SMART_LOGO_SRC: string = resolveImageSource(smartLogoImg);
export const SMART_LOGO_TEXT_SRC: string = resolveImageSource(smartLogoTextImg);
export type SmartLogoKind = 'text' | 'wordmark' | 'mark';
export type SmartLogoTone = 'auto' | 'on-light' | 'on-dark';
export interface SmartLogoProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  kind?: SmartLogoKind;
  tone?: SmartLogoTone;
  title?: string;
}

export function SmartLogo({
  kind = 'text',
  tone: _tone = 'auto',
  title = 'SMART',
  className,
  ...props
}: SmartLogoProps) {
  if (kind === 'mark') {
    return (
      <span
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center overflow-hidden',
          className,
        )}
        {...props}
      >
        <img src={SMART_LOGO_SRC} alt={title} className="size-full object-contain" />
      </span>
    );
  }

  if (kind === 'wordmark') {
    return (
      <span
        className={cn('inline-flex h-8 w-auto shrink-0 items-center overflow-hidden', className)}
        {...props}
      >
        <img src={SMART_LOGO_TEXT_SRC} alt={title} className="h-full w-auto object-contain" />
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex h-8 w-auto shrink-0 items-center overflow-hidden', className)}
      {...props}
    >
      <img src={SMART_TEXT_LOGO_SRC} alt={title} className="h-full w-auto object-contain" />
    </span>
  );
}
