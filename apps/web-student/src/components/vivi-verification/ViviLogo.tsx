import { VIVI_LOGO_SRC } from '@hirekiwi/ui';

/**
 * The Vivi logo (colour flower mark + black "vivi" wordmark, transparent background). The black
 * wordmark needs a light background. Every "Powered by Vivi" label uses this one component.
 */
export function ViviLogo({ className = 'h-5' }: { className?: string }) {
  return (
    // Static asset resolved by the ui package; not routed through next/image.
    <img src={VIVI_LOGO_SRC} alt="Vivi" className={`w-auto ${className}`} draggable={false} />
  );
}
