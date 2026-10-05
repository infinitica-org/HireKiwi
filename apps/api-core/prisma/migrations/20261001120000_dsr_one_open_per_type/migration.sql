-- S6-VV-159: at most one open (OPEN or IN_REVIEW) data-subject request per user and type.
-- createDataRequest checks first, but two concurrent creates both passed that check.

-- Close any duplicates that already slipped through. The oldest one stays open: its SLA clock
-- started first and it is the one an admin has most likely picked up.
UPDATE "data_subject_requests" AS d
SET "status" = 'REJECTED',
    "resolved_at" = now(),
    "resolution" = 'Closed automatically as a duplicate of an earlier open request of the same type.'
WHERE d."status" IN ('OPEN', 'IN_REVIEW')
  AND EXISTS (
    SELECT 1
    FROM "data_subject_requests" AS o
    WHERE o."user_id" = d."user_id"
      AND o."type" = d."type"
      AND o."status" IN ('OPEN', 'IN_REVIEW')
      AND (o."created_at", o."id") < (d."created_at", d."id")
  );

CREATE UNIQUE INDEX "data_subject_requests_one_open_per_type_idx"
  ON "data_subject_requests"("user_id", "type")
  WHERE "status" IN ('OPEN', 'IN_REVIEW');
