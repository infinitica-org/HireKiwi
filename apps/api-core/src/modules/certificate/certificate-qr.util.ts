import QRCode from 'qrcode';

/**
 * Generates a vector SVG QR code for the given verification URL.
 */
export async function generateCertificateQrSvg(verificationUrl: string): Promise<string> {
  return QRCode.toString(verificationUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
  });
}

/**
 * Generates a high-resolution PNG QR code buffer for the given verification URL (e.g. for embedding into PDF).
 */
export async function generateCertificateQrPng(verificationUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(verificationUrl, {
    type: 'png',
    width: 600,
    margin: 2,
    errorCorrectionLevel: 'H',
  });
}

/**
 * Deterministic storage key for certificate QR code asset.
 */
export function certificateQrStorageKey(certificateId: string): string {
  return `certificates/qr/${certificateId}.svg`;
}

/**
 * Deterministic storage key for certificate PDF asset.
 */
export function certificatePdfStorageKey(certificateId: string): string {
  return `certificates/pdf/${certificateId}.pdf`;
}
