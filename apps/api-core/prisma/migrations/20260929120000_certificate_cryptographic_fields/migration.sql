-- AlterTable
ALTER TABLE "certificates" ADD COLUMN "signature" TEXT,
ADD COLUMN "qr_code_key" TEXT,
ADD COLUMN "pdf_key" TEXT;
