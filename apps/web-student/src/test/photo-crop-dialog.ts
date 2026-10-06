import { fireEvent, screen, waitFor } from '@testing-library/react';
import { expect, vi } from 'vitest';

/**
 * PhotoCropDialog (src/components/profile/PhotoCropDialog.tsx) draws the picked file onto a
 * canvas and reads it back with toBlob — neither is implemented by jsdom, and the <img> never
 * really decodes a picked File there either. Stub both so "Save photo" can run in tests, the
 * same way a real browser would after the image finishes loading.
 */
export function mockCanvasCrop(): void {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
    callback(new Blob(['cropped'], { type: 'image/jpeg' }));
  });
}

/** Fires the crop dialog's <img> load event, then clicks "Save photo". */
export async function confirmPhotoCrop(): Promise<void> {
  const dialog = await screen.findByRole('dialog', { name: /adjust profile photo/i });
  const img = dialog.querySelector('img');
  if (img) fireEvent.load(img);
  await waitFor(() => {
    const button = screen.getByRole('button', { name: /save photo/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
  fireEvent.click(screen.getByRole('button', { name: /save photo/i }));
}
