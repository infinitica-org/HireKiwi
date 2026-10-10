'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';

const VIEW = 280;
const OUTPUT = 512;
const MAX_ZOOM = 3;

interface PhotoCropDialogProps {
  /** The picked file; the dialog is open while this is non-null. */
  file: File | null;
  onCancel: () => void;
  /** Receives a square JPEG of the chosen area, ready to upload. */
  onConfirm: (cropped: File) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Move and zoom a photo inside a round crop area, then export the square it covers. */
export function PhotoCropDialog({ file, onCancel, onConfirm }: PhotoCropDialogProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setNatural(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [file, onCancel]);

  if (!file || !src) return null;

  // "Cover" scale: the short side of the photo exactly fills the crop area at zoom 1.
  const baseScale = natural ? Math.max(VIEW / natural.w, VIEW / natural.h) : 1;
  const scale = baseScale * zoom;
  const dw = (natural?.w ?? VIEW) * scale;
  const dh = (natural?.h ?? VIEW) * scale;
  const maxX = Math.max(0, (dw - VIEW) / 2);
  const maxY = Math.max(0, (dh - VIEW) / 2);
  const x = clamp(offset.x, -maxX, maxX);
  const y = clamp(offset.y, -maxY, maxY);

  const setZoomClamped = (next: number) => setZoom(clamp(next, 1, MAX_ZOOM));

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startY: event.clientY, ox: x, oy: y };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + event.clientX - drag.current.startX,
      y: drag.current.oy + event.clientY - drag.current.startY,
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const confirm = async () => {
    const img = imgRef.current;
    if (!img || !natural) return;
    setSaving(true);
    try {
      const left = (VIEW - dw) / 2 + x;
      const top = (VIEW - dh) / 2 + y;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(
        img,
        -left / scale,
        -top / scale,
        VIEW / scale,
        VIEW / scale,
        0,
        0,
        OUTPUT,
        OUTPUT,
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.9),
      );
      if (!blob) return;
      const name = `${file.name.replace(/\.[^.]+$/, '') || 'profile-photo'}.jpg`;
      onConfirm(new File([blob], name, { type: 'image/jpeg' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs font-sans"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Adjust profile photo"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-[#161616]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Adjust profile photo
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Drag to position. Use the slider or scroll to zoom.
        </p>

        <div
          className="relative mx-auto mt-4 cursor-grab touch-none overflow-hidden rounded-md bg-zinc-900 select-none active:cursor-grabbing"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(event) => setZoomClamped(zoom - event.deltaY * 0.0015)}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(event) =>
              setNatural({
                w: event.currentTarget.naturalWidth,
                h: event.currentTarget.naturalHeight,
              })
            }
            className="pointer-events-none absolute max-w-none"
            style={{
              width: dw,
              height: dh,
              left: (VIEW - dw) / 2 + x,
              top: (VIEW - dh) / 2 + y,
            }}
          />
          {/* Round crop area: everything outside the circle is dimmed */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ring-2 ring-white/80"
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoomClamped(zoom - 0.2)}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Minus className="size-4" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoomClamped(Number(event.target.value))}
            aria-label="Zoom"
            className="flex-1 accent-zinc-900 dark:accent-white"
          />
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoomClamped(zoom + 0.2)}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={!natural || saving}
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950"
            >
              Save photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
