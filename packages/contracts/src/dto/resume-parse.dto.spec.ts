import { describe, expect, it } from 'vitest';
import {
  CANDIDATE_RESUME_FILES_MAX,
  CandidateResumeFilesSchema,
  ParseResumeRequestSchema,
  ParseResumeResponseSchema,
  ResumeParseDraftSchema,
  validateResumeDocumentText,
} from './resume-parse.dto.js';

const sampleDraft = {
  basicInfo: { firstName: 'Asha', lastName: 'Iyer' },
  education: [{ institutionName: 'PSG College of Technology', degree: 'B.E.' }],
  experiences: [{ role: 'Intern', company: 'Infinitica' }],
  skills: [
    { type: 'technical' as const, name: 'Python', proficiency: 'INTERMEDIATE' as const },
    { type: 'language' as const, name: 'Tamil', proficiency: 'NATIVE' as const },
  ],
  parseConfidence: 0.82,
  missingFields: ['education.0.endDate'],
};

describe('ParseResumeRequestSchema', () => {
  it('accepts extracted resume text', () => {
    const parsed = ParseResumeRequestSchema.parse({
      rawText: 'A'.repeat(40),
    });
    expect(parsed.rawText?.length).toBe(40);
  });

  it('accepts an object key for a stored resume', () => {
    expect(() => ParseResumeRequestSchema.parse({ objectKey: 'resumes/u1/cv.pdf' })).not.toThrow();
  });

  it('rejects an empty body so we never spend tokens on nothing', () => {
    expect(ParseResumeRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('ResumeParseDraftSchema', () => {
  it('accepts a sparse but valid extract', () => {
    const parsed = ResumeParseDraftSchema.parse(sampleDraft);
    expect(parsed.skills).toHaveLength(2);
    expect(parsed.experiences[0]?.tags).toEqual([]);
  });

  it('rejects a verification-style proficiency on a language row', () => {
    const parsed = ResumeParseDraftSchema.safeParse({
      ...sampleDraft,
      skills: [{ type: 'language', name: 'English', proficiency: 'INTERMEDIATE' }],
    });
    expect(parsed.success).toBe(false);
  });

  it('allows an empty draft when the resume has nothing extractable', () => {
    const parsed = ResumeParseDraftSchema.parse({ parseConfidence: 0.2 });
    expect(parsed.education).toEqual([]);
    expect(parsed.skills).toEqual([]);
    expect(parsed.licenses).toEqual([]);
  });

  it('accepts a license or certification row', () => {
    const parsed = ResumeParseDraftSchema.parse({
      ...sampleDraft,
      licenses: [{ name: 'AWS Cloud Practitioner', issuer: 'Amazon' }],
    });
    expect(parsed.licenses).toHaveLength(1);
  });
});

describe('CandidateResumeFilesSchema', () => {
  it(`allows up to ${CANDIDATE_RESUME_FILES_MAX} stored file`, () => {
    const files = [
      {
        fileName: 'cv-0.pdf',
        objectKey: 'resumes/u1/cv-0.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1000,
        uploadedAt: '2026-09-12T10:00:00.000Z',
      },
    ];
    expect(CandidateResumeFilesSchema.parse(files)).toHaveLength(1);
    const secondFile = {
      fileName: 'cv-1.pdf',
      objectKey: 'resumes/u1/cv-1.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1000,
      uploadedAt: '2026-09-12T11:00:00.000Z',
    };
    expect(CandidateResumeFilesSchema.safeParse([...files, secondFile]).success).toBe(false);
  });
});

describe('ParseResumeResponseSchema', () => {
  it('allows FAILED with a null draft so the form stays manually editable', () => {
    const parsed = ParseResumeResponseSchema.parse({ status: 'FAILED', draft: null });
    expect(parsed.draft).toBeNull();
  });
});

describe('validateResumeDocumentText', () => {
  it('accepts valid resume text containing standard sections', () => {
    const validResume = `
      Vishal Bharath R
      Email: vishal@example.com | Phone: +91 9876543210 | LinkedIn: linkedin.com/in/vishal
      
      Education
      B.Tech in Artificial Intelligence & Data Science, KEC (2022 - 2026)
      
      Technical Skills
      TypeScript, React, Node.js, Python, PostgreSQL, Fastify
      
      Work Experience
      Software Engineer Intern at Infinitica (Jan 2026 - Present)
      Built verified capability profiles and microservices.
      
      Projects
      Smart Talent Discovery Platform - Full-stack web application.
    `;
    const result = validateResumeDocumentText(validResume);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects short or empty text as corrupted/unreadable', () => {
    const result = validateResumeDocumentText('Short text');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('This PDF appears to be corrupted or unreadable.');
  });

  it('rejects course certificates', () => {
    const certificateText = `
      Certificate of Completion
      This is to certify that John Doe has successfully completed the course
      Advanced Python Programming on Udemy. Issued on October 2026.
    `;
    const result = validateResumeDocumentText(certificateText);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("The uploaded document doesn't appear to be a resume.");
  });

  it('rejects academic marksheets', () => {
    const marksheetText = `
      Statement of Marks and Semester Grade Report
      Student Name: Jane Doe | Roll No: 12345
      Subject Code: CS101 - Grade: A - SGPA: 8.9
      Provisional Certificate Issued by University Controller of Examinations.
    `;
    const result = validateResumeDocumentText(marksheetText);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("The uploaded document doesn't appear to be a resume.");
  });

  it('rejects offer letters', () => {
    const offerLetterText = `
      Offer of Employment - Letter of Appointment
      Dear Candidate, we are pleased to offer you the position of Software Engineer
      with an annual fixed CTC of 8 LPA. Please sign and return acceptance.
    `;
    const result = validateResumeDocumentText(offerLetterText);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("The uploaded document doesn't appear to be a resume.");
  });

  it('rejects invoices and billing receipts', () => {
    const invoiceText = `
      Tax Invoice
      Invoice No: INV-2026-001
      Bill To: ABC Technologies Pvt Ltd
      GSTIN: 33AAAAA0000A1Z5
      Total Amount Due: INR 50,000 | Payment Receipt
    `;
    const result = validateResumeDocumentText(invoiceText);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("The uploaded document doesn't appear to be a resume.");
  });

  it('accepts resume with only Experience and Skills', () => {
    const text = `
      John Doe
      Email: john@example.com | Phone: 9876543210
      Professional Experience
      Senior Backend Engineer at TechCorp (2020 - Present)
      Designed distributed microservices and event queues.
      Technical Skills
      TypeScript, Node.js, PostgreSQL, Redis, Docker, Kafka
    `;
    const result = validateResumeDocumentText(text);
    expect(result.isValid).toBe(true);
  });

  it('accepts resume with Education, Skills, and Projects', () => {
    const text = `
      Priya Sharma
      priya.sharma@example.com | +91 9123456780 | github.com/priyasharma
      Academics & Education
      B.Tech Computer Science, Anna University (2022 - 2026)
      Technical Skills
      Python, Fastify, PyTorch, React, TailwindCSS
      Key Projects
      AI Resume Screener - Full-stack talent intelligence tool
    `;
    const result = validateResumeDocumentText(text);
    expect(result.isValid).toBe(true);
  });

  it('accepts resume without Summary', () => {
    const text = `
      Alex Miller | alex@example.com | linkedin.com/in/alexmiller
      Work Experience
      Product Engineer at SaaS Labs (2023 - Present)
      Education
      B.S. in Software Engineering, Waterloo
      Technical Skills
      React, TypeScript, GraphQL, Next.js
    `;
    const result = validateResumeDocumentText(text);
    expect(result.isValid).toBe(true);
  });

  it('accepts resume without Projects', () => {
    const text = `
      Ananya Sen | ananya@example.com
      Professional Summary
      Experienced QA automation engineer with 4 years in testing.
      Professional Experience
      SDET II at FinTech Ltd (2022 - Present)
      Education
      B.E. Information Technology
      Technical Skills
      Playwright, Cypress, Vitest, Jest, Python
    `;
    const result = validateResumeDocumentText(text);
    expect(result.isValid).toBe(true);
  });

  it('accepts resume without Certifications', () => {
    const text = `
      David Kim | david@example.com | Phone: +1 555 123 4567
      Work Experience
      Frontend Developer at CloudBase
      Education
      B.S. Computer Science
      Skills
      HTML5, CSS3, JavaScript, Vue.js, Tailwind
      Projects
      Personal portfolio site and open-source UI libraries
    `;
    const result = validateResumeDocumentText(text);
    expect(result.isValid).toBe(true);
  });

  it('rejects bank statements', () => {
    const bankText = `
      Bank Statement
      Account Statement for Account No 123456789
      Available Balance: 50,000 INR
      Opening Balance: 40,000 Closing Balance: 50,000
      Transaction History: ATM withdrawal 10,000
    `;
    const result = validateResumeDocumentText(bankText);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("The uploaded document doesn't appear to be a resume.");
  });

  it('rejects project reports submitted for degree', () => {
    const reportText = `
      A Project Report Submitted In Partial Fulfillment of the Requirements
      for the Degree of Bachelor of Technology in Computer Science.
      Chapter 1: Introduction
      Table of Contents
      Literature Survey of Deep Learning Methods.
    `;
    const result = validateResumeDocumentText(reportText);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("The uploaded document doesn't appear to be a resume.");
  });

  it('rejects identity cards (voter id, election commission)', () => {
    const idText = `
      Election Commission of India
      Voter ID Card - Electoral Photo Identity Card
      Name: Rahul Verma | Epic No: ABC1234567
      Father's Name: S. Verma | Age: 24 | Gender: Male
    `;
    const result = validateResumeDocumentText(idText);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("The uploaded document doesn't appear to be a resume.");
  });

  it('rejects generic text without resume sections', () => {
    const genericText = `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.
    `;
    const result = validateResumeDocumentText(genericText);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("The uploaded document doesn't appear to be a resume.");
  });
});
