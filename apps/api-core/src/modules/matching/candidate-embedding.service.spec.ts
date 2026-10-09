import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CandidateEmbeddingService } from './candidate-embedding.service.js';

describe('S8-RM-XX: CandidateEmbeddingService', () => {
  let prisma: any;
  let aiGateway: any;
  let service: CandidateEmbeddingService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: vi.fn() },
      skillClaim: { findMany: vi.fn().mockResolvedValue([]) },
      $executeRaw: vi.fn().mockResolvedValue(undefined),
    };
    aiGateway = { embedText: vi.fn() };
    service = new CandidateEmbeddingService(prisma, aiGateway);
  });

  describe('buildProfileText', () => {
    it('returns null for an unknown student', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      expect(await service.buildProfileText('missing')).toBeNull();
    });

    it('returns null when the candidate has no track and no verified skills', async () => {
      prisma.user.findUnique.mockResolvedValue({ primaryTrack: null });
      prisma.skillClaim.findMany.mockResolvedValue([]);
      expect(await service.buildProfileText('s1')).toBeNull();
    });

    it('summarizes track and verified skills into stable text', async () => {
      prisma.user.findUnique.mockResolvedValue({
        primaryTrack: { code: 'TECH_FULLSTACK', name: 'Full-Stack Engineering' },
      });
      prisma.skillClaim.findMany.mockResolvedValue([
        { proficiency: 'ADVANCED', finalProficiency: null, skill: { name: 'React' } },
        { proficiency: 'INTERMEDIATE', finalProficiency: 'PROFESSIONAL', skill: { name: 'SQL' } },
      ]);

      const text = await service.buildProfileText('s1');
      expect(text).toContain('Track: Full-Stack Engineering (TECH_FULLSTACK)');
      expect(text).toContain('React (ADVANCED)');
      // Prefers finalProficiency over declared proficiency when present.
      expect(text).toContain('SQL (PROFESSIONAL)');
    });
  });

  describe('generateAndStoreEmbedding', () => {
    it('is a no-op and never calls the embedding provider when there is nothing to embed', async () => {
      prisma.user.findUnique.mockResolvedValue({ primaryTrack: null });
      prisma.skillClaim.findMany.mockResolvedValue([]);

      const result = await service.generateAndStoreEmbedding('s1');

      expect(result).toBe(false);
      expect(aiGateway.embedText).not.toHaveBeenCalled();
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });

    it('embeds and upserts the profile when there is verified data', async () => {
      prisma.user.findUnique.mockResolvedValue({
        primaryTrack: { code: 'TECH_FULLSTACK', name: 'Full-Stack Engineering' },
      });
      prisma.skillClaim.findMany.mockResolvedValue([
        { proficiency: 'ADVANCED', finalProficiency: null, skill: { name: 'React' } },
      ]);
      aiGateway.embedText.mockResolvedValue(new Array(1536).fill(0.01));

      const result = await service.generateAndStoreEmbedding('s1');

      expect(result).toBe(true);
      expect(aiGateway.embedText).toHaveBeenCalledWith(expect.stringContaining('React'));
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('rejects an embedding of the wrong dimensionality rather than silently truncating it', async () => {
      prisma.user.findUnique.mockResolvedValue({
        primaryTrack: { code: 'TECH_FULLSTACK', name: 'Full-Stack Engineering' },
      });
      prisma.skillClaim.findMany.mockResolvedValue([
        { proficiency: 'ADVANCED', finalProficiency: null, skill: { name: 'React' } },
      ]);
      aiGateway.embedText.mockResolvedValue([0.1, 0.2]);

      await expect(service.generateAndStoreEmbedding('s1')).rejects.toThrow(/1536-dim/);
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });
  });
});
