-- Brand rename: SMART -> HireKiwi. The QLIX assessment payload column keeps its data; only the name changes.
ALTER TABLE "qlix_check_results" RENAME COLUMN "smart_assessment_json" TO "hirekiwi_assessment_json";
