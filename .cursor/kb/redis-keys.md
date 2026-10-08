# Redis key inventory

All keys **must** have TTL. Eviction: `volatile-lru`. No bare keys without expire.

| Entity             | Key                               | TTL     | Notes                                  |
| ------------------ | --------------------------------- | ------- | -------------------------------------- |
| Assessment session | `session:assessment:{attempt_id}` | 2 h     | Drafts; write-through flush ~5 s       |
| Rate limit window  | `rl:{…}:{id}`                     | ~60 s   | Sliding window / token bucket          |
| Auth claims cache  | `auth:token:{user_id}`            | 15 m    | Optional warm cache                    |
| L1 item forms      | `items:form:{track}:{level}`      | 24 h    | Warm cache for player                  |
| Cut scores         | `cut_scores:track:{track_id}`     | 7 d     | Invalidate on `hirekiwi.track.updated` |
| Verify payload     | `verify:cert:{certificate_id}`    | 1 h     | Public verify hot path                 |
| JD vectors         | `match:company:{jd_id}`           | 30 m    | Placement matching                     |
| BullMQ             | `bull:queue:{name}`               | managed | sandbox / audio / pdf                  |

## Event-driven invalidation (VV owns handlers)

| Event                           | Action                                                         |
| ------------------------------- | -------------------------------------------------------------- |
| `hirekiwi.assessment.submitted` | `DEL session:assessment:{id}` (+ related student result cache) |
| `hirekiwi.track.updated`        | `DEL cut_scores:track:{track_id}`                              |
| `hirekiwi.certificate.issued`   | Refresh `verify:cert:{id}`                                     |
| `hirekiwi.student.retested`     | `DEL student:results:{student_id}`                             |

Peak RAM estimate ~332 MB @ 50k concurrency → provision 2 GB. Alerts at 70% / 85%.
