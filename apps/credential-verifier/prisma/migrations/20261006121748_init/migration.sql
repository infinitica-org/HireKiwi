-- CreateEnum
CREATE TYPE "IssuerTrustStatus" AS ENUM ('TRUSTED', 'UNVERIFIED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('PROFESSIONAL_CERTIFICATION', 'COURSE_COMPLETION', 'PROFESSIONAL_CERTIFICATE', 'DIGITAL_BADGE', 'DEGREE', 'LICENSE', 'TRAINING_CREDENTIAL', 'SKILL_CREDENTIAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'VERIFIED_WITH_WARNINGS', 'EXPIRED', 'REVOKED', 'SUSPENDED', 'INVALID', 'NOT_FOUND', 'UNVERIFIABLE', 'DOCUMENT_ONLY', 'VERIFICATION_PENDING', 'VERIFICATION_ERROR');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('UNVERIFIED', 'DOCUMENT_PARSED', 'ISSUER_RECORD_MATCH', 'CREDENTIAL_PLATFORM_VERIFIED', 'CRYPTOGRAPHICALLY_VERIFIED');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('CREDLY', 'OPEN_BADGES', 'W3C_VC', 'ISSUER_VERIFICATION_PAGE', 'USER_MEDIATED_PROFILE', 'DOCUMENT_PARSE');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('OFFICIAL_API', 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT', 'PUBLIC_CREDENTIAL_PLATFORM', 'PUBLIC_ISSUER_VERIFICATION_PAGE', 'USER_MEDIATED', 'UNSUPPORTED');

-- CreateEnum
CREATE TYPE "CredentialInputType" AS ENUM ('URL', 'QR_CODE', 'PDF', 'IMAGE', 'JSON_CREDENTIAL', 'ISSUER_AND_ID', 'PASTED_TEXT');

-- CreateEnum
CREATE TYPE "CheckResult" AS ENUM ('PASS', 'FAIL', 'SKIP', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "Issuer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "issuerType" TEXT NOT NULL,
    "trustStatus" "IssuerTrustStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issuer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "externalIdentifier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credentialType" "CredentialType" NOT NULL,
    "level" TEXT,
    "skills" TEXT[],
    "framework" TEXT,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "credentialType" "CredentialType" NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "status" "VerificationStatus" NOT NULL DEFAULT 'VERIFICATION_PENDING',
    "source" "CredentialInputType" NOT NULL,
    "sourceIdentifier" TEXT,
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "method" "VerificationMethod" NOT NULL,
    "provider" TEXT,
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "adapterVersion" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCheck" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "checkName" TEXT NOT NULL,
    "result" "CheckResult" NOT NULL,
    "detail" TEXT,

    CONSTRAINT "VerificationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEvidence" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "url" TEXT,
    "fileRef" TEXT,
    "metadata" JSONB,

    CONSTRAINT "VerificationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationAttempt" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT NOT NULL,
    "error" TEXT,
    "durationMs" INTEGER,

    CONSTRAINT "VerificationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssuerAdapter" (
    "id" TEXT NOT NULL,
    "issuerId" TEXT,
    "adapterName" TEXT NOT NULL,
    "integrationType" "IntegrationType" NOT NULL,
    "capabilities" JSONB NOT NULL,
    "confidence" "ConfidenceLevel",
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssuerAdapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustRegistryEntry" (
    "id" TEXT NOT NULL,
    "issuerId" TEXT,
    "platformName" TEXT,
    "trustLevel" TEXT NOT NULL,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustRegistryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Issuer_domain_key" ON "Issuer"("domain");

-- CreateIndex
CREATE INDEX "Credential_issuerId_idx" ON "Credential"("issuerId");

-- CreateIndex
CREATE INDEX "Credential_status_idx" ON "Credential"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_sourceIdentifier_key" ON "Credential"("sourceIdentifier");

-- CreateIndex
CREATE INDEX "Verification_credentialId_idx" ON "Verification"("credentialId");

-- CreateIndex
CREATE INDEX "Verification_verificationLevel_idx" ON "Verification"("verificationLevel");

-- CreateIndex
CREATE INDEX "VerificationCheck_verificationId_idx" ON "VerificationCheck"("verificationId");

-- CreateIndex
CREATE INDEX "VerificationEvidence_verificationId_idx" ON "VerificationEvidence"("verificationId");

-- CreateIndex
CREATE INDEX "VerificationAttempt_verificationId_idx" ON "VerificationAttempt"("verificationId");

-- CreateIndex
CREATE INDEX "IssuerAdapter_issuerId_idx" ON "IssuerAdapter"("issuerId");

-- CreateIndex
CREATE INDEX "TrustRegistryEntry_issuerId_idx" ON "TrustRegistryEntry"("issuerId");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCheck" ADD CONSTRAINT "VerificationCheck_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "Verification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvidence" ADD CONSTRAINT "VerificationEvidence_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "Verification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAttempt" ADD CONSTRAINT "VerificationAttempt_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "Verification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuerAdapter" ADD CONSTRAINT "IssuerAdapter_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustRegistryEntry" ADD CONSTRAINT "TrustRegistryEntry_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
