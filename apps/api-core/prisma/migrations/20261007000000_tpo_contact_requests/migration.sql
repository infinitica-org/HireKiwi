-- CreateEnum
CREATE TYPE "TpoContactRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "tpo_contact_requests" (
    "id" UUID NOT NULL,
    "institution_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT,
    "status" "TpoContactRequestStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tpo_contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tpo_contact_requests_status_created_at_idx" ON "tpo_contact_requests"("status", "created_at");
