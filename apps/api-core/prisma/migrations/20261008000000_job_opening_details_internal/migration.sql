-- Job posting sections: candidate-facing details and company-only internal notes (JSONB, both optional).
ALTER TABLE "job_openings" ADD COLUMN "details" JSONB, ADD COLUMN "internal" JSONB;
