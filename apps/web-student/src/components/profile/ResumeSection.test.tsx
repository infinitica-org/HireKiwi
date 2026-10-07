import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResumeSection } from './ResumeSection';
import { extractResumeRawText } from '@/lib/extract-resume-text';

const getResume = vi.fn();
const uploadResume = vi.fn();
const parseResume = vi.fn();
const deleteResume = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    users: {
      getResume: () => getResume(),
      uploadResume: (...args: unknown[]) => uploadResume(...args),
      parseResume: (...args: unknown[]) => parseResume(...args),
      deleteResume: (...args: unknown[]) => deleteResume(...args),
    },
  },
}));

vi.mock('@/lib/extract-resume-text', () => ({
  extractResumeRawText: vi.fn(),
}));

const validResumeText = `
  Vishal Bharath R
  Email: vishal@example.com | Phone: +91 9876543210
  Education: B.Tech in Artificial Intelligence, KEC (2022 - 2026)
  Technical Skills: TypeScript, React, Python, PostgreSQL, Node.js
  Work Experience: Software Engineer Intern at Infinitica
  Projects: HireKiwi Talent Discovery Platform
`;

const mockUploadSuccess = {
  resumeFile: {
    fileName: 'resume.pdf',
    objectKey: 'resumes/user/resume.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1200,
    uploadedAt: '2026-09-12T10:00:00.000Z',
  },
  resumeFiles: [
    {
      fileName: 'resume.pdf',
      objectKey: 'resumes/user/resume.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1200,
      uploadedAt: '2026-09-12T10:00:00.000Z',
    },
  ],
};

describe('ResumeSection', () => {
  beforeEach(() => {
    getResume.mockReset();
    uploadResume.mockReset();
    parseResume.mockReset();
    deleteResume.mockReset();
    vi.mocked(extractResumeRawText).mockReset();
    vi.mocked(extractResumeRawText).mockResolvedValue(validResumeText);

    getResume.mockResolvedValue({ resumeFile: null, resumeFiles: [] });
    uploadResume.mockResolvedValue(mockUploadSuccess);
    parseResume.mockResolvedValue({ status: 'PARSED', draft: { parseConfidence: 0.8 } });
  });

  it('renders empty state without top-right upload button and with prominent requirements', async () => {
    render(<ResumeSection />);
    expect(await screen.findByText(/No resume yet/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Upload your resume/i })).toBeDefined();

    // Top-right header action button must not exist
    expect(screen.queryByRole('button', { name: /^Upload resume$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Replace resume$/i })).toBeNull();

    // Prominent requirements must be rendered
    expect(screen.getByText('PDF only')).toBeDefined();
    expect(screen.getByText('Maximum size: 5 MB')).toBeDefined();
  });

  it('uploads a valid PDF resume when none exists and shows parse success message', async () => {
    render(<ResumeSection />);
    expect(await screen.findByText(/No resume yet/i)).toBeDefined();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([validResumeText], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadResume).toHaveBeenCalled();
      expect(screen.getByText('resume.pdf')).toBeDefined();
    });
  });

  it('renders existing resume with Remove Resume action and no upload button', async () => {
    getResume.mockResolvedValue({
      resumeFile: {
        fileName: 'active-resume.pdf',
        objectKey: 'resumes/user/active-resume.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1000,
        uploadedAt: '2026-09-01T10:00:00.000Z',
      },
      resumeFiles: [
        {
          fileName: 'active-resume.pdf',
          objectKey: 'resumes/user/active-resume.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 1000,
          uploadedAt: '2026-09-01T10:00:00.000Z',
        },
      ],
    });

    render(<ResumeSection />);
    expect(await screen.findByText('active-resume.pdf')).toBeDefined();
    expect(screen.getByRole('button', { name: /Remove Resume/i })).toBeDefined();

    // No upload or replace button should exist
    expect(screen.queryByRole('button', { name: /Upload your resume/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Upload resume$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Replace resume$/i })).toBeNull();
  });

  it('requires confirmation to remove existing resume then transitions to empty state allowing upload', async () => {
    getResume.mockResolvedValue({
      resumeFile: {
        fileName: 'my-resume.pdf',
        objectKey: 'resumes/user/my-resume.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1000,
        uploadedAt: '2026-09-01T10:00:00.000Z',
      },
      resumeFiles: [
        {
          fileName: 'my-resume.pdf',
          objectKey: 'resumes/user/my-resume.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 1000,
          uploadedAt: '2026-09-01T10:00:00.000Z',
        },
      ],
    });
    deleteResume.mockResolvedValue({ resumeFiles: [] });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ResumeSection />);
    expect(await screen.findByText('my-resume.pdf')).toBeDefined();

    const removeBtn = screen.getByRole('button', { name: /Remove Resume/i });
    fireEvent.click(removeBtn);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteResume).toHaveBeenCalledWith('resumes/user/my-resume.pdf');
      expect(screen.getByText(/No resume yet/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Upload your resume/i })).toBeDefined();
    });

    confirmSpy.mockRestore();
  });

  // ──────────────────────────────────────────────────────────
  // BUG 2 fix: non-PDF files must NEVER enter uploading state
  // ──────────────────────────────────────────────────────────

  it('rejects .docx file immediately without calling API and without entering uploading state', async () => {
    render(<ResumeSection />);
    await screen.findByText(/No resume yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const docxFile = new File(['content'], 'resume.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(input, { target: { files: [docxFile] } });

    // Error must appear without any API call
    await waitFor(() => {
      expect(screen.getByText('Only PDF resumes are allowed.')).toBeDefined();
    });
    expect(uploadResume).not.toHaveBeenCalled();
    // Uploading... text must never appear
    expect(screen.queryByText(/Uploading resume/i)).toBeNull();
  });

  it('rejects .jpg file immediately without calling API', async () => {
    render(<ResumeSection />);
    await screen.findByText(/No resume yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const imgFile = new File(['GIF89a'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [imgFile] } });

    await waitFor(() => {
      expect(screen.getByText('Only PDF resumes are allowed.')).toBeDefined();
    });
    expect(uploadResume).not.toHaveBeenCalled();
    expect(screen.queryByText(/Uploading resume/i)).toBeNull();
  });

  it('rejects .txt file immediately without calling API', async () => {
    render(<ResumeSection />);
    await screen.findByText(/No resume yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const txtFile = new File(['hello world'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [txtFile] } });

    await waitFor(() => {
      expect(screen.getByText('Only PDF resumes are allowed.')).toBeDefined();
    });
    expect(uploadResume).not.toHaveBeenCalled();
  });

  it('rejects files larger than 5 MB before calling API', async () => {
    render(<ResumeSection />);
    await screen.findByText(/No resume yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['a'], 'huge.pdf', { type: 'application/pdf' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(uploadResume).not.toHaveBeenCalled();
      expect(screen.getByText('Resume must be 5 MB or smaller.')).toBeDefined();
    });
    expect(screen.queryByText(/Uploading resume/i)).toBeNull();
  });

  // ──────────────────────────────────────────────────────────
  // BUG 2 fix: spinner must always terminate on any error
  // ──────────────────────────────────────────────────────────

  it('clears uploading state when API returns a 400 validation error', async () => {
    const apiError = Object.assign(
      new Error("The uploaded document doesn't appear to be a resume."),
      {
        isSmartApiError: true,
        message: "The uploaded document doesn't appear to be a resume.",
      },
    );
    uploadResume.mockRejectedValueOnce(apiError);

    render(<ResumeSection />);
    await screen.findByText(/No resume yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([validResumeText], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/Uploading resume/i)).toBeNull();
      expect(
        screen.getByText("The uploaded document doesn't appear to be a resume."),
      ).toBeDefined();
    });
  });

  it('clears uploading state and shows network error when fetch fails', async () => {
    uploadResume.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<ResumeSection />);
    await screen.findByText(/No resume yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([validResumeText], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/Uploading resume/i)).toBeNull();
      expect(screen.getByText('Failed to fetch')).toBeDefined();
    });
  });

  it('clears uploading state when upload times out (AbortError)', async () => {
    uploadResume.mockRejectedValueOnce(
      Object.assign(new DOMException('Upload aborted', 'AbortError')),
    );

    render(<ResumeSection />);
    await screen.findByText(/No resume yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([validResumeText], 'resume.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByText(/Uploading resume/i)).toBeNull();
      expect(screen.getByText(/timed out/i)).toBeDefined();
    });
  });

  it('does not call API for non-PDF so spinner never appears regardless of API latency', async () => {
    // Even if the API were to hang forever, this should never enter uploading state.
    uploadResume.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    render(<ResumeSection />);
    await screen.findByText(/No resume yet/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const zipFile = new File(['PK\x03\x04'], 'archive.zip', { type: 'application/zip' });
    fireEvent.change(input, { target: { files: [zipFile] } });

    await waitFor(() => {
      expect(screen.getByText('Only PDF resumes are allowed.')).toBeDefined();
    });
    // API must NOT have been called
    expect(uploadResume).not.toHaveBeenCalled();
    expect(screen.queryByText(/Uploading resume/i)).toBeNull();
  });
});
