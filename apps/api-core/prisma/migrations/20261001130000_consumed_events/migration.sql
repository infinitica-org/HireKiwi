-- S6-VV-123 (#592): consumer-side dedupe for at-least-once Kafka delivery.
CREATE TABLE "consumed_events" (
    "consumer_group" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "consumed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumed_events_pkey" PRIMARY KEY ("consumer_group","event_id")
);

CREATE INDEX "consumed_events_consumed_at_idx" ON "consumed_events"("consumed_at");
