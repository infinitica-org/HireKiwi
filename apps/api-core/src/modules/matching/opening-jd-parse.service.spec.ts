import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { OpeningJdParseService } from './opening-jd-parse.service.js';

describe('OpeningJdParseService (Th6-I610)', () => {
  const openingId = randomUUID();

  function setupService(aiGatewayFails = false) {
    const prisma = {
      jobOpening: {
        findUnique: vi.fn().mockResolvedValue({
          id: openingId,
          companyName: 'Infinitica Labs',
          roleTitle: 'Senior Full Stack Engineer',
          rawText: 'Looking for a senior developer with extensive Python and SQL experience.',
          requiredSkills: [],
        }),
        update: vi
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: openingId, ...data })),
      },
      skill: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { id: randomUUID(), code: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT' },
          ]),
      },
      jobOpeningSkill: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    const gateway = {
      complete: aiGatewayFails
        ? vi.fn().mockRejectedValue(new Error('AI Gateway 504 Gateway Timeout'))
        : vi.fn().mockResolvedValue({
            output: {
              requiredSkills: [
                {
                  skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
                  minProficiency: 'ADVANCED',
                },
              ],
              emphasisedCapabilities: [],
              parseConfidence: 0.85,
            },
          }),
    };

    const service = new OpeningJdParseService(prisma as never, gateway as never);
    return { service, prisma, gateway };
  }

  it('parses opening successfully via AI Gateway when healthy', async () => {
    const { service, prisma, gateway } = setupService(false);
    await service.parseOpening(openingId);

    expect(gateway.complete).toHaveBeenCalled();
    expect(prisma.jobOpening.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: openingId },
        data: expect.objectContaining({
          jdParseStatus: 'PARSED',
          parseConfidence: 0.85,
        }),
      }),
    );
  });

  it('fails safely to offline keyword extraction when AI gateway experiences upstream timeout', async () => {
    const { service, prisma, gateway } = setupService(true);
    await service.parseOpening(openingId);

    expect(gateway.complete).toHaveBeenCalled();
    // Rather than failing with FAILED, it safely extracts via heuristic fallback and sets PARSED
    expect(prisma.jobOpening.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: openingId },
        data: expect.objectContaining({
          jdParseStatus: 'PARSED',
          parseConfidence: 0.65,
        }),
      }),
    );
  });
});
