# HireKiwi on Unified High-End VPS — Production (Blue-Green) & Development

**Policy:** [`docs/delivery/BRANCHING.md`](../../docs/delivery/BRANCHING.md) · **Database:** [`docs/delivery/DATABASE.md`](../../docs/delivery/DATABASE.md) · **ADR-0009**

---

## 1. Executive Topology Overview

HireKiwi runs on a single, high-performance Linux VPS (Ubuntu 24.04: 32 vCPU, 128 GB RAM, NVMe storage) hosting **both Production and Development in strictly isolated Docker Compose networks**.

Production utilizes an automated **Blue-Green Zero-Downtime Deployment Engine** driven by Caddy, ensuring 0 ms connection drops and instant automated rollback.

The architecture is built on 12-factor cloud-native principles, functioning as a direct bridge for our scheduled lift-and-shift migration to AWS (ECS/RDS/ElastiCache).

| Environment                  | Compose Project                 | Public TLS (Caddy)            | Domains Served                                                                                      |
| :--------------------------- | :------------------------------ | :---------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Production (Active Slot)** | `hirekiwi-prod-blue` or `green` | Yes — Automated Let's Encrypt | `hirekiwi.online`, `app.`, `api.`, `tpo.`, `admin.`, `verify.`, `docs.`                             |
| **Development**              | `hirekiwi-dev`                  | Yes — Automated Let's Encrypt | `dev.hirekiwi.online`, `dev.app.`, `dev.api.`, `dev.tpo.`, `dev.admin.`, `dev.verify.`, `dev.docs.` |

---

## 2. DNS & Ingress Routing (Cloudflare Anycast → Single VPS IP)

All DNS A-records point to the single VPS public IP through Cloudflare (Proxy enabled: WAF, DDoS, and TLS 1.3):

```
[ Internet Traffic ]
        │
[ Cloudflare Anycast CDN & WAF ]
        │
        ▼ (Port 80 / 443)
[ Host Caddy Reverse Proxy ]
        │
   ┌────┴──────────────────────────────────────────┐
   ▼ (*.hirekiwi.online)                        ▼ (*.dev.hirekiwi.online)
[ Production Active Slot: Blue or Green ]        [ Isolated Dev Stack: hirekiwi-dev ]
- Blue: api:3000, web:3001-3006                  - api:3020, web:3021-3026
- Green: api:3010, web:3011-3016                 - Isolated Postgres 16 Dev DB
```

---

## 3. Automated Blue-Green Zero-Downtime Deployment Engine

Deployments to production run through [`scripts/blue-green-deploy.sh`](../../scripts/blue-green-deploy.sh):

```bash
# Execute zero-downtime production deployment:
bash scripts/blue-green-deploy.sh prod

# Deploy dev environment (full stack or selective service):
bash scripts/deploy-vps.sh dev
bash scripts/deploy-vps.sh dev web-student
```

### Execution Lifecycle:

1. **Target Identification:** Reads `.deploy_state_prod`. If `blue` is active, the deployment targets `green`.
2. **Sequential Container Build:** Builds updated service images for the target color sequentially to avoid host CPU/I-O throttling.
3. **Target Boot:** Starts target containers on their dedicated internal port range (e.g., Green API on `3010`).
4. **Health Probe Gate:** Polls `http://127.0.0.1:3010/health` and `/ready` up to 30 times. If probes fail, the deployment **aborts immediately**, leaving active traffic on Blue completely untouched.
5. **Database Migration:** Executes forward-only Prisma migrations on the shared production database: `npx prisma migrate deploy`.
6. **Zero-Downtime Traffic Switch:** Dynamically updates Caddy's upstream mapping and triggers `caddy reload`. Caddy shifts 100% of live traffic to Green in < 50ms with zero dropped TCP connections.
7. **Graceful Drain:** Waits 15 seconds for in-flight requests on Blue to complete, then spins down Blue containers.
8. **State Commit:** Writes `green` to `.deploy_state_prod`.

---

## 4. Server Security Hardening & Zero Public DB Exposure

The VPS host is hardened against unauthorized network access:

- **`ufw` Firewall Rules:** Only ports `22` (SSH), `80` (HTTP), and `443` (HTTPS) are open to the internet.
- **Localhost Binding:** PostgreSQL (`5432`), Redis (`6379`), Redpanda (`19092`), and MinIO (`9000`) are bound strictly to `127.0.0.1`.
- **SSH Bastion Tunneling:** Administrative access to databases and Prisma Studio requires authenticated key-based SSH tunnels:
  ```bash
  # Tunnel to Production Database:
  ssh -L 5432:127.0.0.1:5432 deploy@<vps-ip>

  # Tunnel to Prisma Studio:
  ssh -L 5555:127.0.0.1:5555 deploy@<vps-ip>
  ```
- **Fail2ban & SSH Hardening:** Password authentication disabled (`PasswordAuthentication no`), root login disabled (`PermitRootLogin prohibit-password`).

---

## 5. Scheduled AWS Cloud Migration Bridge (Zero-Code Lift & Shift)

Because the architecture follows 12-factor cloud principles, transitioning to AWS involves zero application code modifications:

| VPS Component                | AWS Target Service                  | Migration Mechanism                                               |
| :--------------------------- | :---------------------------------- | :---------------------------------------------------------------- |
| **Container Runtime**        | AWS ECS Fargate / EKS               | Run identical Docker images (`apps/<app>/Dockerfile`).            |
| **PostgreSQL 16 + pgvector** | AWS RDS PostgreSQL (Multi-AZ)       | Point `DATABASE_URL` to RDS endpoint; run `pg_dump / pg_restore`. |
| **Redis 7 Cluster**          | AWS ElastiCache for Redis           | Point `REDIS_URL` to ElastiCache cluster endpoint.                |
| **Redpanda Event Bus**       | AWS MSK / Redpanda Cloud            | Point `KAFKA_BROKERS` to AWS MSK bootstrap servers.               |
| **MinIO / Local Storage**    | AWS S3 Standard Storage             | Set `S3_ENDPOINT` to `s3.amazonaws.com` with IAM credentials.     |
| **Caddy Ingress**            | AWS Application Load Balancer (ALB) | Route 53 DNS + ACM TLS Certificates + ALB Target Groups.          |
