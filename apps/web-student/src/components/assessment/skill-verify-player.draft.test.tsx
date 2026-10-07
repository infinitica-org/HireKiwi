import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SdeSkillFormResponseItemSchema } from '@hirekiwi/contracts';
import { writeSkillVerifyDraft } from '@/lib/skill-verify-draft';
import type * as ExamModule from './skill-verify-exam';
import { SKILL_VERIFY_ANSWER_MAX_CHARS } from './skill-verify-exam';
import { SKILL_VERIFY_AUTOSAVE_MS, SkillVerifyPlayer } from './skill-verify-player';

const SESSION_ID = '33333333-3333-4333-8333-333333333333';
const assessment = vi.hoisted(() => ({
  prepareSkillVerify: vi.fn(),
  listSkillClaims: vi.fn(),
  startSkillVerify: vi.fn(),
  saveSkillVerify: vi.fn(),
  completeSkillVerify: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api', () => ({ api: { assessment, evaluation: { runSkillFormCode: vi.fn() } } }));
vi.mock('@/lib/proctoring/fullscreen', () => ({ releaseProctoringSession: vi.fn(async () => {}) }));
vi.mock('@/components/proctoring/proctoring-shell', async () => {
  const { useEffect } = await import('react');
  return {
    ProctoringShell: ({
      children,
      onReady,
    }: {
      children: React.ReactNode;
      onReady: () => void;
    }) => {
      useEffect(() => onReady(), [onReady]);
      return <div>{children}</div>;
    },
  };
});
vi.mock('./skill-verify-report', () => ({ SkillVerifyReport: () => <p>Report</p> }));
/** A stand-in exam that exposes the player's callbacks and state. */
vi.mock('./skill-verify-exam', async (importOriginal) => {
  const real = await importOriginal<typeof ExamModule>();
  return {
    ...real,
    SkillVerifyExam: (props: {
      answers: Record<number, { text?: string; selectedKey?: string }>;
      pending: boolean;
      onChangeText: (index: number, text: string) => void;
      onSubmit: () => void;
    }) => (
      <div>
        <p data-testid="answer-1">{props.answers[1]?.text ?? ''}</p>
        <button type="button" onClick={() => props.onChangeText(1, 'typed')}>
          type
        </button>
        <button type="button" disabled={props.pending} onClick={props.onSubmit}>
          submit
        </button>
      </div>
    ),
  };
});

const session = {
  sessionId: SESSION_ID,
  skillCode: 'JAVA',
  stage: 'DIAGNOSTIC',
  items: [{ index: 1 }],
  answers: [{ index: 1, text: 'from server' }],
};

describe('SkillVerifyPlayer answer safety (S6-VV-162, #613)', () => {
  beforeEach(() => {
    Object.values(assessment).forEach((fn) => fn.mockReset());
    assessment.prepareSkillVerify.mockResolvedValue({ sessionId: SESSION_ID });
    assessment.listSkillClaims.mockResolvedValue([]);
    assessment.startSkillVerify.mockResolvedValue(session);
    assessment.saveSkillVerify.mockResolvedValue(session);
  });
  afterEach(() => {
    vi.useRealTimers();
    window.sessionStorage.clear();
  });

  it('keeps the input cap in step with the server limit', () => {
    const at = (n: number) =>
      SdeSkillFormResponseItemSchema.safeParse({ index: 1, text: 'x'.repeat(n) });
    expect(at(SKILL_VERIFY_ANSWER_MAX_CHARS).success).toBe(true);
    expect(at(SKILL_VERIFY_ANSWER_MAX_CHARS + 1).success).toBe(false);
  });

  it('restores answers typed before a refresh over the last server save', async () => {
    writeSkillVerifyDraft(SESSION_ID, { 1: { text: 'typed before refresh' } });
    render(<SkillVerifyPlayer claimId="c-1" />);
    expect((await screen.findByTestId('answer-1')).textContent).toBe('typed before refresh');
  });

  it('autosaves unsaved answers on a timer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<SkillVerifyPlayer claimId="c-1" />);
    await screen.findByTestId('answer-1');
    fireEvent.click(screen.getByRole('button', { name: 'type' }));
    expect(window.sessionStorage.getItem(`hirekiwi.skill-verify.draft.${SESSION_ID}`)).toContain(
      'typed',
    );

    await act(async () => {
      vi.advanceTimersByTime(SKILL_VERIFY_AUTOSAVE_MS);
    });
    expect(assessment.saveSkillVerify).toHaveBeenCalledWith(SESSION_ID, {
      responses: [{ index: 1, text: 'typed', selectedKey: undefined }],
    });
  });

  it('sends one complete request however often Submit is clicked', async () => {
    let finish: (value: unknown) => void = () => undefined;
    assessment.completeSkillVerify.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<SkillVerifyPlayer claimId="c-1" />);
    const submit = await screen.findByRole('button', { name: 'submit' });

    fireEvent.click(submit);
    fireEvent.click(submit);
    fireEvent.click(submit);
    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(true));
    expect(assessment.completeSkillVerify).toHaveBeenCalledOnce();
    finish({ gradingAccepted: true });
  });
});
