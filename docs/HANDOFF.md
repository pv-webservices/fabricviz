# FabricViz Operational Handoff Document

This document serves as the central runbook for the FabricViz support, operations, and development teams. It consolidates all system knowledge, troubleshooting flows, and escalation paths required to maintain the platform in Production.

## 1. System Architecture
FabricViz is a decoupled architecture consisting of:
1. **API (`apps/api`)**: Fastify-based REST API serving the Admin Dashboard and Customer Frontend.
2. **Worker (`apps/worker`)**: BullMQ consumer that orchestrates rendering jobs via the Nano Banana API.
3. **Database**: PostgreSQL (Primary data store).
4. **Cache/Queue**: Redis (BullMQ and Rate Limiting).

## 2. Core Runbooks

### Auth & Credits
- **Customer Auth**: Customers authenticate via 5-digit `access_codes`. These codes map to a `credit_limit`.
- **Granting Credits**: Use `POST /api/credits/:accessCodeId/grant` to adjust limits. Approved `credit_requests` automatically grant 100 credits.
- **Troubleshooting**: If a user is locked out due to the rate limiter (10 req/min), they must wait 60 seconds.

### Render Pipeline
- **Flow**: `POST /api/renders` -> Inserts to `render_jobs` (Queued) -> Picked up by BullMQ -> `processing` -> Calls Nano Banana -> Updates to `completed` or `failed`.
- **Troubleshooting Stuck Jobs**: If a job hangs in `processing` indefinitely, the worker may have crashed. Flush the queue by running:
  ```sql
  UPDATE render_jobs SET status = 'failed' WHERE status = 'processing';
  UPDATE visualizations SET status = 'failed' WHERE status = 'processing';
  ```

### Storage Cleanup
- Soft-deleted visualizations (`active = false`) are NOT automatically deleted from disk/cloud.
- **Action**: Admins must periodically call `DELETE /api/storage/cleanup` to permanently erase these assets and reclaim storage space.

## 3. Known Issues & Edge Cases
1. **Nano Banana API Timeouts**: Occasional 504 errors from the provider. BullMQ handles these automatically via its retry logic (max 3 attempts). If retries exhaust, `lib/telemetry.ts` emits a `CRITICAL` log.
2. **Missing Fabric Tags**: If a fabric is missing `tags` or `repeat` parameters, the Prompt Generator gracefully falls back to a generic prompt. However, visual quality may degrade. Ensure the Catalog is fully populated.

## 4. Rollback & Escalation
- **Rollback**: If an API deployment causes a high error rate (>1%), immediately revert the container image to the previous SHA. If database schema was changed, run the reverse migration (`DOWN`) corresponding to the specific sprint script.
- **Escalation**:
  - **L1 Support**: Handles credit requests, sample approvals, and catalog uploads.
  - **L2 Engineering**: Handles stuck render queues, database deadlocks, and Nano Banana API outages.

## 5. Directory Reference
- **API Documentation**: See `docs/API.md` for a comprehensive list of all endpoints, payloads, and authorization requirements.
- **Hypercare Guidelines**: See `hypercare_runbook.md` (Artifact) for the specific pilot-phase monitoring checklist.

## 6. Post-Launch Documentation Index

The following documents were created during the post-launch phase:

| Document | Purpose |
|---|---|
| [production-monitoring.md](production-monitoring.md) | Daily health checks, incident response, alerting setup |
| [post-pilot-report.md](post-pilot-report.md) | Pilot analytics, UX friction analysis, recommendations |
| [bug-backlog.md](bug-backlog.md) | Tracked bugs, tech debt, fix workflow |
| [v2-roadmap.md](v2-roadmap.md) | v2 feature priorities, sprint blocks, acceptance criteria |
| [support-operations.md](support-operations.md) | L1/L2 support tiers, troubleshooting scripts, maintenance |

## 7. Post-Launch Operations Structure

- **Monitoring**: UptimeRobot (uptime) + Structured JSON log files (application)
- **Alerting**: UptimeRobot email alerts + WhatsApp for P1/P2 incidents
- **On-Call**: Single engineer, no rotation
- **Support**: L1 (Operations) → L2 (Engineering)
- **Deployments**: Staging → Production via Docker Compose
- **Backups**: Daily pg_dump + Redis BGSAVE
