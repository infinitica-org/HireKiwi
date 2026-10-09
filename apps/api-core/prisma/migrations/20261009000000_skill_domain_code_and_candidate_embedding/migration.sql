-- S8-RM-XX: literal A-E domain tagging on skills, and a persisted Stage 1 candidate
-- profile embedding, so matching no longer collapses every radar axis onto the same
-- aggregate signal and Stage 1 can do real pgvector similarity instead of only an
-- in-memory heuristic.

ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "domain_code" "DomainCode";
CREATE INDEX IF NOT EXISTS "skills_domain_code_active_idx" ON "skills"("domain_code", "active");

ALTER TABLE "candidate_evidence_profiles" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
ALTER TABLE "candidate_evidence_profiles" ADD COLUMN IF NOT EXISTS "embedding_updated_at" TIMESTAMPTZ(6);
