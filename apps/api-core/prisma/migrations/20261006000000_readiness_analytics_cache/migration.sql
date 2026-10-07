-- Th6-607: cache tables behind the TPO cohort readiness dashboard (rebuilt per institution).
CREATE TABLE "readiness_analytics_students" (
    "user_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "campus" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT 'Unspecified',
    "grad_year" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readiness_analytics_students_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "readiness_analytics_students_institution_id_tier_idx" ON "readiness_analytics_students"("institution_id", "tier");
CREATE INDEX "readiness_analytics_students_institution_id_computed_at_idx" ON "readiness_analytics_students"("institution_id", "computed_at");
CREATE INDEX "readiness_analytics_students_scope_idx" ON "readiness_analytics_students"("institution_id", "department", "campus", "grad_year");

CREATE TABLE "readiness_analytics_cells" (
    "institution_id" UUID NOT NULL,
    "department" TEXT NOT NULL,
    "campus" TEXT NOT NULL DEFAULT '',
    "grad_year" INTEGER NOT NULL DEFAULT 0,
    "domain_id" TEXT NOT NULL,
    "student_count" INTEGER NOT NULL,
    "score_sum" DOUBLE PRECISION NOT NULL,
    "below_target_count" INTEGER NOT NULL,

    CONSTRAINT "readiness_analytics_cells_pkey" PRIMARY KEY ("institution_id", "department", "campus", "grad_year", "domain_id")
);

CREATE INDEX "readiness_analytics_cells_institution_id_domain_id_idx" ON "readiness_analytics_cells"("institution_id", "domain_id");
