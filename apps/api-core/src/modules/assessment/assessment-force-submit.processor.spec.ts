import { describe, expect, it, vi } from 'vitest';
import { AssessmentForceSubmitProcessor } from './assessment-force-submit.processor.js';

describe('AssessmentForceSubmitProcessor', () => {
  it('delegates to AssessmentService.forceSubmitAttempt with the attemptId', async () => {
    const assessmentService = { forceSubmitAttempt: vi.fn().mockResolvedValue(undefined) };
    const dlq = { add: vi.fn() };
    const processor = new AssessmentForceSubmitProcessor(assessmentService as never, dlq as never);

    await processor.process({
      id: 'force-submit:attempt-1',
      data: { attemptId: 'attempt-1', studentId: 'student-1' },
    } as never);

    expect(assessmentService.forceSubmitAttempt).toHaveBeenCalledWith('attempt-1');
  });

  it('propagates an error so DlqAwareProcessor can route to DLQ on final attempt', async () => {
    const assessmentService = {
      forceSubmitAttempt: vi.fn().mockRejectedValue(new Error('db connection error')),
    };
    const dlq = { add: vi.fn() };
    const processor = new AssessmentForceSubmitProcessor(assessmentService as never, dlq as never);

    await expect(
      processor.process({
        id: 'force-submit:attempt-1',
        data: { attemptId: 'attempt-1', studentId: 'student-1' },
      } as never),
    ).rejects.toThrow('db connection error');
  });
});
