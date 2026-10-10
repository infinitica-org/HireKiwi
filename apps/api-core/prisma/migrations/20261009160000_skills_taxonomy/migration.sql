-- DropForeignKey
ALTER TABLE "job_opening_skills" DROP CONSTRAINT "job_opening_skills_skill_id_fkey";

-- DropForeignKey
ALTER TABLE "skill_claims" DROP CONSTRAINT "skill_claims_skill_id_fkey";

-- AlterTable
ALTER TABLE "job_opening_skills" ALTER COLUMN "skill_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "skill_claims" ALTER COLUMN "skill_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "skills" DROP CONSTRAINT "skills_pkey",
ADD COLUMN     "family" TEXT,
ADD COLUMN     "importance_tier" TEXT,
ADD COLUMN     "l1_format" TEXT,
ADD COLUMN     "l2_environment" TEXT,
ADD COLUMN     "l2_mode" TEXT,
ADD COLUMN     "l2_sandbox_fit" TEXT,
ADD COLUMN     "l5_deliverable" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "primary_parent_id" TEXT,
ADD COLUMN     "primary_weight" DOUBLE PRECISION,
ADD COLUMN     "programming_in_l2" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sfia_code" TEXT,
ADD COLUMN     "tool_category" TEXT,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "domain" SET DEFAULT 'GENERAL',
ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "capabilities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competency_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capability_id" TEXT NOT NULL,

    CONSTRAINT "competency_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "skill_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_categories" (
    "name" TEXT NOT NULL,
    "examples" TEXT,

    CONSTRAINT "tool_categories_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "parent_skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" TEXT,
    "l1_item_formats" TEXT,
    "l2_dominant_mode" TEXT,
    "recommended_family" TEXT,
    "weight_reliability" TEXT,
    "primary_item_count" INTEGER NOT NULL DEFAULT 0,
    "competency_group_id" TEXT NOT NULL,
    "capability_id" TEXT NOT NULL,

    CONSTRAINT "parent_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_parent_links" (
    "skill_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tier" TEXT,
    "tier_score" INTEGER,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "skill_parent_links_pkey" PRIMARY KEY ("skill_id","parent_id","role")
);

-- CreateTable
CREATE TABLE "assessment_levels" (
    "level" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT,
    "measures" TEXT,
    "delivery" TEXT,
    "scoring" TEXT,
    "unlocks_when" TEXT,

    CONSTRAINT "assessment_levels_pkey" PRIMARY KEY ("level")
);

-- CreateTable
CREATE TABLE "l2_modes" (
    "mode" TEXT NOT NULL,
    "description" TEXT,
    "hands_on_type" TEXT,
    "environment" TEXT,
    "auto_grading" TEXT,
    "l5_deliverable" TEXT,

    CONSTRAINT "l2_modes_pkey" PRIMARY KEY ("mode")
);

-- CreateTable
CREATE TABLE "ontology_edges" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "review_status" TEXT,
    "rationale" TEXT,

    CONSTRAINT "ontology_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "capabilities_name_key" ON "capabilities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "competency_groups_name_key" ON "competency_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skill_families_name_key" ON "skill_families"("name");

-- CreateIndex
CREATE INDEX "ontology_edges_source_idx" ON "ontology_edges"("source");

-- CreateIndex
CREATE INDEX "ontology_edges_target_idx" ON "ontology_edges"("target");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_primary_parent_id_fkey" FOREIGN KEY ("primary_parent_id") REFERENCES "parent_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_claims" ADD CONSTRAINT "skill_claims_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_opening_skills" ADD CONSTRAINT "job_opening_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_groups" ADD CONSTRAINT "competency_groups_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_skills" ADD CONSTRAINT "parent_skills_competency_group_id_fkey" FOREIGN KEY ("competency_group_id") REFERENCES "competency_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_skills" ADD CONSTRAINT "parent_skills_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_parent_links" ADD CONSTRAINT "skill_parent_links_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_parent_links" ADD CONSTRAINT "skill_parent_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
