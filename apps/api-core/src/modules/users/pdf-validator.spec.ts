import { describe, expect, it } from 'vitest';
import { RESUME_VALIDATION_MESSAGES } from '@hirekiwi/contracts';
import { validateAndExtractPdfResume } from './pdf-validator.js';

describe('validateAndExtractPdfResume', () => {
  it('rejects files without %PDF- magic bytes', () => {
    const fakeBuffer = Buffer.from('PK\x03\x04 fake zip or docx archive content that is not pdf');
    const result = validateAndExtractPdfResume(fakeBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(RESUME_VALIDATION_MESSAGES.ONLY_PDF_ALLOWED);
  });

  it('rejects buffers shorter than 32 bytes', () => {
    const tiny = Buffer.from('%PDF-1.4');
    const result = validateAndExtractPdfResume(tiny);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(RESUME_VALIDATION_MESSAGES.ONLY_PDF_ALLOWED);
  });

  it('rejects structurally corrupt PDF without EOF, streams, or objects', () => {
    const corrupt = Buffer.from(
      '%PDF-1.4 followed by random noise without structure ' + 'x'.repeat(40),
    );
    const result = validateAndExtractPdfResume(corrupt);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(RESUME_VALIDATION_MESSAGES.CORRUPTED_OR_UNREADABLE);
  });

  it('rejects structurally valid PDF that has empty or sparse text (< 40 characters)', () => {
    const sparse = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Length 10 >>\nstream\nShort\nendstream\nendobj\n%%EOF',
    );
    const result = validateAndExtractPdfResume(sparse);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(RESUME_VALIDATION_MESSAGES.CORRUPTED_OR_UNREADABLE);
  });

  it('extracts readable text from stream with Tj operators', () => {
    const pdf = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Length 120 >>\nstream\n' +
        'BT /F1 12 Tf (Jane Doe) Tj\n' +
        '(jane@example.com) Tj\n' +
        '(Software Engineer with experience in TypeScript and React) Tj ET\n' +
        'endstream\nendobj\n%%EOF',
    );
    const result = validateAndExtractPdfResume(pdf);
    expect(result.valid).toBe(true);
    expect(result.extractedText).toContain('Jane Doe');
    expect(result.extractedText).toContain('TypeScript');
  });

  it('extracts text from TJ array tokens with sub-token formatting', () => {
    const pdf = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Length 150 >>\nstream\n' +
        'BT /F1 12 Tf [ (Senior) 20 (Full) 10 (Stack) 15 (Developer) ] TJ\n' +
        '[ (Education:) 10 (B.Tech) 20 (in) 10 (Computer) 10 (Science) ] TJ ET\n' +
        'endstream\nendobj\n%%EOF',
    );
    const result = validateAndExtractPdfResume(pdf);
    expect(result.valid).toBe(true);
    expect(result.extractedText).toContain('Senior Full Stack Developer');
    expect(result.extractedText).toContain('Education: B.Tech in Computer Science');
  });

  it('extracts and maps CMap characters and ligatures correctly', () => {
    // A stream with a ToUnicode CMap mapping 0001 -> 00660069 ("fi") and 0002 -> 0041 ("A")
    const cmapStream =
      '/CIDInit /ProcSet findresource begin\n' +
      '12 dict begin\n' +
      'begincmap\n' +
      '1 beginbfchar\n' +
      '<0001> <00660069>\n' +
      '<0002> <0041>\n' +
      'endbfchar\n' +
      'endcmap\n';

    const textStream =
      'BT /F1 12 Tf <00010002> Tj\n' +
      '(Professional Experience in Scientific Software Engineering) Tj ET\n';

    const pdf = Buffer.from(
      '%PDF-1.4\n' +
        '1 0 obj\n<< /Length ' +
        cmapStream.length +
        ' >>\nstream\n' +
        cmapStream +
        '\nendstream\nendobj\n' +
        '2 0 obj\n<< /Length ' +
        textStream.length +
        ' >>\nstream\n' +
        textStream +
        '\nendstream\nendobj\n' +
        '%%EOF',
    );

    const result = validateAndExtractPdfResume(pdf);
    expect(result.valid).toBe(true);
    expect(result.extractedText).toContain('fiA');
    expect(result.extractedText).toContain('Professional Experience');
  });

  it('extracts UTF-16BE encoded literal strings', () => {
    // UTF-16BE for "Resume - John Doe"
    const utf16BE = Buffer.from(
      '\xFE\xFF\x00R\x00e\x00s\x00u\x00m\x00e\x00 \x00-\x00 \x00J\x00o\x00h\x00n\x00 \x00D\x00o\x00e',
      'latin1',
    );
    const pdf = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
        '(' +
        utf16BE.toString('latin1') +
        ') Tj\n' +
        '(Work Experience: Software Developer at CloudCorp for 3 years) Tj\n' +
        'endstream\nendobj\n%%EOF',
      'latin1',
    );

    const result = validateAndExtractPdfResume(pdf);
    expect(result.valid).toBe(true);
    expect(result.extractedText).toContain('Resume - John Doe');
    expect(result.extractedText).toContain('Work Experience');
  });
});
