# Kafka topics

Payload schemas live in `@hirekiwi/contracts` (`events/topics.ts`, `events/payloads.ts`). Changing a payload = contract PR + every consumer named.

| Topic                                       | Producer-owner | Consumers                                         |
| ------------------------------------------- | -------------- | ------------------------------------------------- |
| `hirekiwi.user.created` / `updated`         | **Vishal V**   | Vedika (analytics)                                |
| `hirekiwi.assessment.started` / `submitted` | Vishal Bharath | Ramansh (eval), **Vishal V** (cache invalidation) |
| `hirekiwi.eval.requested`                   | Ramansh        | Ramansh (ai-gateway)                              |
| `hirekiwi.eval.completed`                   | Ramansh        | Vishal Bharath (cert), Vedika                     |
| `hirekiwi.track.updated`                    | Vedika         | **Vishal V** (cache), Vishal Bharath              |
| `hirekiwi.certificate.issued`               | Vishal Bharath | webhooks, analytics                               |
| `hirekiwi.placement.matched`                | Vedika         | webhooks, analytics                               |
| `hirekiwi.application.stage_changed`        | Vishal Bharath | placement, platform, users (My Applications)      |
| `hirekiwi.rate_limit.exceeded`              | **Vishal V**   | observability, integrity review                   |

## Platform notes

- VV owns producer/consumer base + **outbox** + DLQ (S1-VV-07).
- Prefer outbox over fire-and-forget so DB commit and publish stay consistent.
- Feature modules must not open raw Kafka clients — go through `platform/kafka`.
