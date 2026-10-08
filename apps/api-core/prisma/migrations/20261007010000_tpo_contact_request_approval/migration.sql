-- AlterEnum
ALTER TYPE "TpoContactRequestStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "TpoContactRequestStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- AlterTable
ALTER TABLE "tpo_contact_requests" ADD COLUMN IF NOT EXISTS "institution_id" UUID;
