import PDFDocument from 'pdfkit';

export interface CertificatePdfData {
  certificateId: string;
  candidateName: string;
  trackName: string;
  highestLevelCleared: number;
  headlineTier: string;
  tierTrail: Record<string, string>;
  issuedAt: Date;
  signature: string;
  verificationUrl: string;
  qrPngBuffer?: Buffer;
}

/**
 * Generates an official SMART Readiness Certificate PDF document as a Buffer.
 */
export async function generateCertificatePdfBuffer(data: CertificatePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        info: {
          Title: `SMART Readiness Certificate - ${data.candidateName}`,
          Author: 'HireKiwi Platform Certification Authority',
          Subject: `${data.trackName} Readiness Credential`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const width = doc.page.width;
      const height = doc.page.height;

      // Decorative outer and inner borders
      doc
        .rect(20, 20, width - 40, height - 40)
        .lineWidth(3)
        .strokeColor('#0f172a')
        .stroke();
      doc
        .rect(26, 26, width - 52, height - 52)
        .lineWidth(1)
        .strokeColor('#94a3b8')
        .stroke();

      // Header Branding
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text('SMART', 60, 55, { align: 'left' });
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('INTELLECTUAL TALENT NETWORK · READINESS CERTIFICATION', 60, 88);

      // Certificate Title
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('CERTIFICATE OF READINESS', 60, 130, { align: 'center', width: width - 120 });
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('This is officially awarded and cryptographically verified to', 60, 160, {
          align: 'center',
          width: width - 120,
        });

      // Candidate Name
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(data.candidateName, 60, 185, { align: 'center', width: width - 120 });

      // Track & Headline Achievement
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#334155')
        .text(`for demonstrating verified competency in the specialization track:`, 60, 225, {
          align: 'center',
          width: width - 120,
        });
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#0369a1')
        .text(data.trackName.toUpperCase(), 60, 245, { align: 'center', width: width - 120 });

      // Headline Tier Badge & Highest Level
      const headlineBadgeText = `HEADLINE STATUS: ${data.headlineTier} (LEVEL ${data.highestLevelCleared} CLEARED)`;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(headlineBadgeText, 60, 280, { align: 'center', width: width - 120 });

      // Tier Trail Grid Box
      const trailY = 320;
      doc.rect(60, trailY, width - 260, 50).fillAndStroke('#f8fafc', '#cbd5e1');

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#475569')
        .text('VERIFIED TIER TRAIL BY LEVEL', 70, trailY + 8);

      const levels = ['L1', 'L2', 'L3', 'L4', 'L5'];
      const colWidth = (width - 280) / 5;
      levels.forEach((lvl, idx) => {
        const x = 70 + idx * colWidth;
        const tier = data.tierTrail[lvl] ?? '—';
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(lvl, x, trailY + 24);
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor(
            tier === 'GOLD'
              ? '#b45309'
              : tier === 'SILVER'
                ? '#475569'
                : tier === 'BRONZE'
                  ? '#b45309'
                  : '#94a3b8',
          )
          .text(tier, x, trailY + 35);
      });

      // QR Code on right side
      if (data.qrPngBuffer) {
        doc.image(data.qrPngBuffer, width - 180, 290, { width: 110, height: 110 });
      }

      // Footer - Metadata & Cryptographic Hash
      const footerY = height - 95;
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#475569')
        .text(`CERTIFICATE ID: ${data.certificateId}`, 60, footerY);
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`ISSUED AT: ${data.issuedAt.toISOString()}`, 60, footerY + 12);
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`VERIFICATION URL: ${data.verificationUrl}`, 60, footerY + 24);

      doc
        .fontSize(7)
        .font('Courier')
        .fillColor('#94a3b8')
        .text(`SHA-256 SIGNATURE: ${data.signature}`, 60, footerY + 38, { width: width - 200 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
