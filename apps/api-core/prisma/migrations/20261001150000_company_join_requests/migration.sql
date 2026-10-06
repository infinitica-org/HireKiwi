-- S6-VV-107 (#340): requests to join an existing, approved company.
CREATE TYPE "CompanyJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "company_join_requests" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "status" "CompanyJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decided_by_id" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "reason" TEXT,
    "invitation_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_join_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "company_join_requests_company_id_status_idx" ON "company_join_requests"("company_id", "status");
CREATE INDEX "company_join_requests_session_id_idx" ON "company_join_requests"("session_id");

-- One open request per person per company (Prisma can't declare a partial index).
CREATE UNIQUE INDEX "company_join_requests_one_pending_idx" ON "company_join_requests"("company_id", "email") WHERE "status" = 'PENDING';

ALTER TABLE "company_join_requests" ADD CONSTRAINT "company_join_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
