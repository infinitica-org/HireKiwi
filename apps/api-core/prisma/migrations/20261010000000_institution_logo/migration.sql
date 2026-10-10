-- The logo a college uploads, shown to its students.
ALTER TABLE "institutions" ADD COLUMN IF NOT EXISTS "logo_storage_key" TEXT;
