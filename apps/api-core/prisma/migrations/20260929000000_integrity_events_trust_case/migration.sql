-- S6-VV-157: schema.prisma links IntegrityEvent to TrustCase (T26-T34 trust work, #345) and
-- indexes CorroborationReviewFlag.trustCaseId, but no migration ever created them. On a database
-- built from migrations every IntegrityEvent query failed with "column trust_case_id does not exist".
-- IF NOT EXISTS keeps this safe on databases where the column was already added by `db push`.

ALTER TABLE "integrity_events" ADD COLUMN IF NOT EXISTS "trust_case_id" UUID;

CREATE INDEX IF NOT EXISTS "integrity_events_trust_case_id_idx" ON "integrity_events"("trust_case_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integrity_events_trust_case_id_fkey'
  ) THEN
    ALTER TABLE "integrity_events"
      ADD CONSTRAINT "integrity_events_trust_case_id_fkey"
      FOREIGN KEY ("trust_case_id") REFERENCES "trust_cases"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "corroboration_review_flags_trust_case_id_idx"
  ON "corroboration_review_flags"("trust_case_id");
