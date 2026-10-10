-- Fences source-check runs: a run writes its result only while it is still the latest one queued.
ALTER TABLE "candidate_certificates" ADD COLUMN "verification_generation" INTEGER NOT NULL DEFAULT 0;
