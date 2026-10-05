-- AlterTable
ALTER TABLE "enforcement_actions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "profile_access_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "trust_appeals" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "trust_cases" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "trust_reports" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_account_holds" ALTER COLUMN "id" DROP DEFAULT;
