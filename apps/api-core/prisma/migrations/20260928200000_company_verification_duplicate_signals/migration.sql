-- S6-VV-110 (#347): near-duplicate companies found at submit, shown to the verification reviewer.
ALTER TABLE "company_verifications" ADD COLUMN "duplicate_signals" JSONB;
