import { describe, expect, it } from 'vitest';
import {
  certificatePdfStorageKey,
  certificateQrStorageKey,
  generateCertificateQrPng,
  generateCertificateQrSvg,
} from './certificate-qr.util.js';

describe('Certificate QR Utilities', () => {
  const verificationUrl =
    'https://verify.smart.com/cert/11111111-1111-4111-8111-111111111111?sig=abcdef0123456789';

  it('11. QR contains the exact verification URL and renders valid SVG', async () => {
    const svg = await generateCertificateQrSvg(verificationUrl);

    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('generates a valid high-resolution PNG buffer for PDF embedding', async () => {
    const pngBuffer = await generateCertificateQrPng(verificationUrl);

    expect(Buffer.isBuffer(pngBuffer)).toBe(true);
    expect(pngBuffer.length).toBeGreaterThan(100);
    // Check PNG signature bytes
    expect(pngBuffer[0]).toBe(0x89);
    expect(pngBuffer[1]).toBe(0x50); // P
    expect(pngBuffer[2]).toBe(0x4e); // N
    expect(pngBuffer[3]).toBe(0x47); // G
  });

  it('12. QR and PDF storage keys are deterministic and namespaced', () => {
    const certId = '11111111-1111-4111-8111-111111111111';
    expect(certificateQrStorageKey(certId)).toBe(
      'certificates/qr/11111111-1111-4111-8111-111111111111.svg',
    );
    expect(certificatePdfStorageKey(certId)).toBe(
      'certificates/pdf/11111111-1111-4111-8111-111111111111.pdf',
    );
  });
});
