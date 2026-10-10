import { pathToFileURL } from 'node:url';
import jpeg from 'jpeg-js';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

/** Where in an uploaded certificate a verification link was found. */
export type FoundLinkSource = 'qr-code' | 'pdf-link' | 'printed-text' | 'roll-number';

export interface FoundLink {
  url: string;
  source: FoundLinkSource;
}

export interface FileEvidence {
  /** Candidate verification links, most trustworthy source first. */
  links: FoundLink[];
  /** The document's own text layer (PDFs only; images aren't OCR'd). Never proof on its own. */
  text: string;
}

const MAX_PDF_PAGES = 3;
const MAX_IMAGES_PER_PAGE = 8;
const MAX_LINKS = 5;
/** Larger scans are downscaled before QR detection: finder patterns survive, decode time drops. */
const QR_SCAN_MAX_SIDE = 1600;
const MAX_IMAGE_MEGAPIXELS = 40;
/** e.g. NPTEL21GE15S4336322203133020 — the roll number NPTEL prints on every certificate. */
const NPTEL_ROLL_PATTERN = /NPTEL\d{2}[A-Z]{2,4}\d{1,3}S\d{5,}/u;
const URL_IN_TEXT_PATTERN = /\bhttps?:\/\/[^\s<>"')]+/giu;

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs', {
  with: { 'resolution-mode': 'import' },
});
let pdfjsPromise: Promise<PdfJs> | null = null;

/**
 * pdfjs is ESM-only and slow to load, so this CommonJS module imports it once, on first use. The
 * legacy build is the one meant for Node (no DOM, no worker thread needed).
 */
function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= (async () => {
    const entry = require.resolve('pdfjs-dist/legacy/build/pdf.mjs');
    return (await import(pathToFileURL(entry).href)) as PdfJs;
  })();
  return pdfjsPromise;
}

/**
 * Pulls verification links out of an uploaded certificate: QR codes (in images, or images inside a
 * PDF), clickable PDF links, URLs printed in the PDF's text, and NPTEL roll numbers. The links are
 * only leads — they're verified against the issuer like a pasted link, never trusted by themselves.
 */
export async function extractFileEvidence(buffer: Buffer, mimeType: string): Promise<FileEvidence> {
  if (mimeType === 'application/pdf') return extractFromPdf(buffer);
  if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    const image = decodeImage(buffer, mimeType);
    const qr = image ? scanQr(image) : null;
    return { links: qr ? toLinks([{ url: qr, source: 'qr-code' }]) : [], text: '' };
  }
  return { links: [], text: '' };
}

/** Finds links in plain text (printed URLs, NPTEL roll numbers); used for PDFs and tests. */
export function linksFromText(text: string): FoundLink[] {
  const found: FoundLink[] = [];
  for (const match of text.matchAll(URL_IN_TEXT_PATTERN)) {
    found.push({ url: match[0].replace(/[.,;:]+$/u, ''), source: 'printed-text' });
  }
  // Certificate PDFs often letter-space their text ("N PTEL 21 GE…"), so look again without spaces.
  const roll = NPTEL_ROLL_PATTERN.exec(text.replace(/\s+/gu, ''))?.[0];
  if (roll) {
    found.push({ url: `https://nptel.ac.in/noc/E_Certificate/${roll}`, source: 'roll-number' });
  }
  return found;
}

async function extractFromPdf(buffer: Buffer): Promise<FileEvidence> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    useWorkerFetch: false,
  });
  try {
    const doc = await task.promise;
    const qrLinks: FoundLink[] = [];
    const annotationLinks: FoundLink[] = [];
    const textParts: string[] = [];

    for (let pageNumber = 1; pageNumber <= Math.min(doc.numPages, MAX_PDF_PAGES); pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      textParts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
      for (const annotation of await page.getAnnotations()) {
        const url = (annotation as { url?: unknown }).url;
        if (typeof url === 'string') annotationLinks.push({ url, source: 'pdf-link' });
      }
      const operators = await page.getOperatorList();
      let images = 0;
      for (let i = 0; i < operators.fnArray.length && images < MAX_IMAGES_PER_PAGE; i++) {
        if (operators.fnArray[i] !== pdfjs.OPS.paintImageXObject) continue;
        images++;
        const name = (operators.argsArray[i] as unknown[])[0];
        if (typeof name !== 'string') continue;
        const image = await pdfImage(page, name);
        const qr = image ? scanQr(image) : null;
        if (qr) qrLinks.push({ url: qr, source: 'qr-code' });
      }
    }

    const text = textParts.join('\n');
    return { links: toLinks([...qrLinks, ...annotationLinks, ...linksFromText(text)]), text };
  } finally {
    await task.destroy();
  }
}

interface RgbaImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** A decoded image XObject from pdfjs, converted to RGBA. Only raw pixel kinds are handled. */
async function pdfImage(
  page: { objs: { get: (name: string, callback: (value: unknown) => void) => void } },
  name: string,
): Promise<RgbaImage | null> {
  const object = await new Promise<unknown>((resolve) => page.objs.get(name, resolve));
  const image = object as { width?: number; height?: number; kind?: number; data?: Uint8Array };
  const { width, height, kind, data } = image ?? {};
  if (!width || !height || !data || width * height > MAX_IMAGE_MEGAPIXELS * 1e6) return null;
  const rgba = new Uint8ClampedArray(width * height * 4);
  if (kind === 3 /* RGBA_32BPP */) {
    rgba.set(data.subarray(0, rgba.length));
  } else if (kind === 2 /* RGB_24BPP */) {
    for (let p = 0, q = 0; p < width * height; p++, q += 3) {
      rgba[p * 4] = data[q] ?? 0;
      rgba[p * 4 + 1] = data[q + 1] ?? 0;
      rgba[p * 4 + 2] = data[q + 2] ?? 0;
      rgba[p * 4 + 3] = 255;
    }
  } else if (kind === 1 /* GRAYSCALE_1BPP */) {
    const rowBytes = Math.ceil(width / 8);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bit = ((data[y * rowBytes + (x >> 3)] ?? 0) >> (7 - (x & 7))) & 1;
        const value = bit ? 255 : 0;
        const o = (y * width + x) * 4;
        rgba[o] = rgba[o + 1] = rgba[o + 2] = value;
        rgba[o + 3] = 255;
      }
    }
  } else {
    return null;
  }
  return { data: rgba, width, height };
}

function decodeImage(buffer: Buffer, mimeType: string): RgbaImage | null {
  try {
    if (mimeType === 'image/png') {
      const png = PNG.sync.read(buffer);
      if (png.width * png.height > MAX_IMAGE_MEGAPIXELS * 1e6) return null;
      return { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height };
    }
    const decoded = jpeg.decode(buffer, {
      useTArray: true,
      formatAsRGBA: true,
      maxResolutionInMP: MAX_IMAGE_MEGAPIXELS,
      maxMemoryUsageInMB: 512,
    });
    return {
      data: new Uint8ClampedArray(decoded.data),
      width: decoded.width,
      height: decoded.height,
    };
  } catch {
    return null;
  }
}

/** Decodes a QR code, downscaling first so a full-page scan stays fast. */
function scanQr(image: RgbaImage): string | null {
  const scale = Math.max(1, Math.ceil(Math.max(image.width, image.height) / QR_SCAN_MAX_SIDE));
  const target = scale === 1 ? image : downscale(image, scale);
  const found = jsQR(target.data, target.width, target.height, {
    inversionAttempts: 'attemptBoth',
  });
  return found?.data.trim() || null;
}

function downscale(image: RgbaImage, factor: number): RgbaImage {
  const width = Math.floor(image.width / factor);
  const height = Math.floor(image.height / factor);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (y * factor * image.width + x * factor) * 4;
      const target = (y * width + x) * 4;
      data[target] = image.data[source] ?? 0;
      data[target + 1] = image.data[source + 1] ?? 0;
      data[target + 2] = image.data[source + 2] ?? 0;
      data[target + 3] = 255;
    }
  }
  return { data, width, height };
}

/** Keeps http(s) links only, first occurrence wins, capped. */
function toLinks(candidates: FoundLink[]): FoundLink[] {
  const seen = new Set<string>();
  const links: FoundLink[] = [];
  for (const candidate of candidates) {
    let url: URL;
    try {
      url = new URL(candidate.url);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
    const key = url.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ url: key, source: candidate.source });
    if (links.length >= MAX_LINKS) break;
  }
  return links;
}
