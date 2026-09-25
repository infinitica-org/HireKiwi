-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');
CREATE TYPE "EmployerSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD', 'CANCELED', 'EXPIRED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PAID', 'UNPAID', 'VOID');

-- AlterTable
ALTER TABLE "subscription_plans"
ADD COLUMN "max_active_jobs" INTEGER,
ADD COLUMN "max_candidate_searches" INTEGER,
ADD COLUMN "max_direct_messages" INTEGER,
ADD COLUMN "max_employer_seats" INTEGER;

-- CreateTable
CREATE TABLE "employer_subscriptions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "pending_plan_id" UUID,
    "razorpay_subscription_id" TEXT,
    "status" "EmployerSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "billing_interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "current_period_start" TIMESTAMPTZ(6) NOT NULL,
    "current_period_end" TIMESTAMPTZ(6) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMPTZ(6),
    "grace_period_ends_at" TIMESTAMPTZ(6),
    "is_enterprise_contract" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_usages" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "candidate_searches_count" INTEGER NOT NULL DEFAULT 0,
    "direct_messages_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscription_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "subscription_id" UUID,
    "razorpay_payment_id" TEXT,
    "razorpay_order_id" TEXT,
    "amount_inr" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL,
    "failure_reason" TEXT,
    "raw_webhook_payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_invoices" (
    "id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "company_id" UUID NOT NULL,
    "subscription_id" UUID,
    "transaction_id" UUID,
    "subtotal_inr" INTEGER NOT NULL,
    "applied_tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_inr" INTEGER NOT NULL DEFAULT 0,
    "total_inr" INTEGER NOT NULL,
    "gstin" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "pdf_storage_key" TEXT,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_contracts" (
    "id" UUID NOT NULL,
    "contract_number" TEXT NOT NULL,
    "company_id" UUID NOT NULL,
    "custom_price_inr" INTEGER NOT NULL,
    "billing_interval" "BillingInterval" NOT NULL,
    "max_active_jobs" INTEGER,
    "max_candidate_searches" INTEGER,
    "max_direct_messages" INTEGER,
    "max_employer_seats" INTEGER,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "terms_notes" TEXT,
    "approved_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enterprise_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employer_subscriptions_company_id_key" ON "employer_subscriptions"("company_id");
CREATE UNIQUE INDEX "employer_subscriptions_razorpay_subscription_id_key" ON "employer_subscriptions"("razorpay_subscription_id");
CREATE INDEX "employer_subscriptions_company_id_idx" ON "employer_subscriptions"("company_id");
CREATE INDEX "employer_subscriptions_status_idx" ON "employer_subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscription_usages_company_id_period_start_period_end_idx" ON "subscription_usages"("company_id", "period_start", "period_end");
CREATE UNIQUE INDEX "subscription_usages_company_id_period_start_key" ON "subscription_usages"("company_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_razorpay_payment_id_key" ON "payment_transactions"("razorpay_payment_id");
CREATE INDEX "payment_transactions_company_id_idx" ON "payment_transactions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "employer_invoices_invoice_number_key" ON "employer_invoices"("invoice_number");
CREATE INDEX "employer_invoices_company_id_idx" ON "employer_invoices"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_contracts_contract_number_key" ON "enterprise_contracts"("contract_number");
CREATE UNIQUE INDEX "enterprise_contracts_company_id_key" ON "enterprise_contracts"("company_id");

-- AddForeignKey
ALTER TABLE "employer_subscriptions" ADD CONSTRAINT "employer_subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employer_subscriptions" ADD CONSTRAINT "employer_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employer_subscriptions" ADD CONSTRAINT "employer_subscriptions_pending_plan_id_fkey" FOREIGN KEY ("pending_plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_usages" ADD CONSTRAINT "subscription_usages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "employer_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_invoices" ADD CONSTRAINT "employer_invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employer_invoices" ADD CONSTRAINT "employer_invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "employer_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employer_invoices" ADD CONSTRAINT "employer_invoices_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_contracts" ADD CONSTRAINT "enterprise_contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enterprise_contracts" ADD CONSTRAINT "enterprise_contracts_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
