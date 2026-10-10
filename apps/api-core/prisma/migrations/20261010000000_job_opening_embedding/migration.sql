-- Mirrors candidate_evidence_profiles.embedding: a persisted Stage 1 job-opening embedding,
-- so matching's vector pre-filter can do real pgvector cosine similarity job-side too, instead
-- of falling back to the in-memory 6-dim domain heuristic for every search.

ALTER TABLE "job_openings" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
ALTER TABLE "job_openings" ADD COLUMN IF NOT EXISTS "embedding_updated_at" TIMESTAMPTZ(6);
