-- IRT calibration + shadow scoring infrastructure (fix/stage1-vector-target-from-job-skills).
-- Shadow use only: nothing here is read by v1 scoring. v1 continues to use
-- items.difficulty_tag and weighted-item scoring unchanged.
-- Owner: Ramansh.

-- AlterTable: item-level IRT 2PL parameters, null until calibrated.
ALTER TABLE "items" ADD COLUMN "irt_discrimination" DECIMAL(6,4);
ALTER TABLE "items" ADD COLUMN "irt_difficulty" DECIMAL(6,4);
ALTER TABLE "items" ADD COLUMN "irt_calibration_status" "CalibrationStatus" NOT NULL DEFAULT 'NOT_CALIBRATED';
ALTER TABLE "items" ADD COLUMN "irt_sample_size" INTEGER;
ALTER TABLE "items" ADD COLUMN "irt_calibrated_at" TIMESTAMPTZ(6);
ALTER TABLE "items" ADD COLUMN "irt_model_version" TEXT;

-- CreateIndex
CREATE INDEX "items_irt_calibration_status_idx" ON "items"("irt_calibration_status");

-- CreateTable: one row per calibration run against a level's item pool.
CREATE TABLE "irt_calibration_runs" (
    "id" UUID NOT NULL,
    "level_id" UUID NOT NULL,
    "items_calibrated" INTEGER NOT NULL,
    "items_frozen" INTEGER NOT NULL,
    "total_responses" INTEGER NOT NULL,
    "iterations" INTEGER NOT NULL,
    "converged" BOOLEAN NOT NULL,
    "model_version" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "irt_calibration_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "irt_calibration_runs_level_id_created_at_idx" ON "irt_calibration_runs"("level_id", "created_at");

-- AddForeignKey
ALTER TABLE "irt_calibration_runs" ADD CONSTRAINT "irt_calibration_runs_level_id_fkey"
    FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: shadow IRT ability estimate per attempt. Never joined into LevelResult.
CREATE TABLE "irt_shadow_estimates" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "calibration_run_id" UUID,
    "theta" DECIMAL(6,4),
    "standard_error" DECIMAL(6,4),
    "items_used" INTEGER NOT NULL,
    "items_skipped_uncalibrated" INTEGER NOT NULL,
    "inconclusive" BOOLEAN NOT NULL DEFAULT false,
    "model_version" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "irt_shadow_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "irt_shadow_estimates_attempt_id_key" ON "irt_shadow_estimates"("attempt_id");

-- CreateIndex
CREATE INDEX "irt_shadow_estimates_calibration_run_id_idx" ON "irt_shadow_estimates"("calibration_run_id");

-- AddForeignKey
ALTER TABLE "irt_shadow_estimates" ADD CONSTRAINT "irt_shadow_estimates_attempt_id_fkey"
    FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irt_shadow_estimates" ADD CONSTRAINT "irt_shadow_estimates_calibration_run_id_fkey"
    FOREIGN KEY ("calibration_run_id") REFERENCES "irt_calibration_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
