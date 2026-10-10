import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { extractFileEvidence, linksFromText } from './certificate-file-evidence.js';

const BADGE_URL = 'https://www.credly.com/badges/f7ae4be9-fd65-454d-874e-c6e2c3237d41';
const COURSERA_URL = 'https://coursera.org/verify/JJ6KNU4CKGFZ';

/** A real PDF the way issuers build them: printed text, a clickable link, and a QR image. */
async function certificatePdf(): Promise<Buffer> {
  const qr = await QRCode.toBuffer(BADGE_URL, { type: 'png', width: 240, margin: 2 });
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) =>
    doc.on('end', () => resolve(Buffer.concat(chunks))),
  );
  doc.fontSize(24).text('Certificate of Completion', 72, 72);
  doc.fontSize(14).text('Awarded to Test Learner', 72, 120);
  doc.fontSize(10).text(`Verify at ${COURSERA_URL}`, 72, 160, { link: COURSERA_URL });
  doc.image(qr, 500, 300, { width: 120 });
  doc.end();
  return done;
}

describe('extractFileEvidence', () => {
  it('reads the QR code in a PNG', async () => {
    const png = await QRCode.toBuffer(BADGE_URL, { type: 'png', width: 300 });
    const evidence = await extractFileEvidence(png, 'image/png');
    expect(evidence.links).toEqual([{ url: BADGE_URL, source: 'qr-code' }]);
  });

  it('finds the QR image, the clickable link and the printed URL in a PDF, QR first', async () => {
    const evidence = await extractFileEvidence(await certificatePdf(), 'application/pdf');
    expect(evidence.links[0]).toEqual({ url: BADGE_URL, source: 'qr-code' });
    expect(evidence.links).toContainEqual({ url: COURSERA_URL, source: 'pdf-link' });
    expect(evidence.text).toContain('Test Learner');
  }, 30_000);

  it('returns nothing (rather than throwing) for an image without a QR code', async () => {
    const blank = await QRCode.toBuffer('x', { type: 'png', width: 50 });
    // Corrupt the image data: a decodable header with no usable pixels.
    const evidence = await extractFileEvidence(blank.subarray(0, 40), 'image/png');
    expect(evidence.links).toEqual([]);
  });
});

describe('linksFromText', () => {
  it('builds the NPTEL lookup from a letter-spaced roll number', () => {
    expect(linksFromText('Roll No: N PTEL 21 GE15 S43363 22203133020 Elite')).toContainEqual({
      url: 'https://nptel.ac.in/noc/E_Certificate/NPTEL21GE15S4336322203133020',
      source: 'roll-number',
    });
  });

  it('trims trailing punctuation off printed URLs', () => {
    expect(linksFromText(`Verify at ${COURSERA_URL}.`)).toEqual([
      { url: COURSERA_URL, source: 'printed-text' },
    ]);
  });
});
