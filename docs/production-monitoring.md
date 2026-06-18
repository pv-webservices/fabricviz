# Production Monitoring & Incident Response

> FabricViz AI — Post-Launch Operations Guide

This document defines the monitoring infrastructure, daily health-check routines, incident response workflows, and customer support intake procedures for the FabricViz production environment.

---

## 1. Monitoring Infrastructure

### 1.1 Uptime Monitoring — UptimeRobot

| Setting | Value |
|---|---|
| Monitor Type | HTTP(s) |
| URL | `https://<domain>/health` |
| Method | `GET` |
| Interval | 5 minutes |
| Alert Contacts | Email (primary) + WhatsApp (P1/P2) |
| Expected Status | `200 OK` with `{ "status": "ok" }` |

**Setup Steps:**
1. Create a free UptimeRobot account at [uptimerobot.com](https://uptimerobot.com).
2. Add a new HTTP(s) monitor pointing to `GET /health`.
3. Configure alert contacts: primary email + WhatsApp integration.
4. Set the check interval to **5 minutes**.
5. Enable SSL certificate expiry monitoring (30-day warning).

### 1.2 Application Logging

FabricViz emits **structured JSON logs** to the filesystem:

| Log File | Source | Description |
|---|---|---|
| `./logs/fabricviz-api.log` | API server (Fastify) | Request/response logs, auth events, errors |
| `./logs/fabricviz-worker.log` | Worker (BullMQ) | Job processing, Nano Banana calls, retries |

#### Log Levels

| Level | Usage |
|---|---|
| `INFO` | Normal operations — requests served, jobs completed |
| `WARN` | Degraded state — slow queries, retry attempts, approaching limits |
| `ERROR` | Failures — unhandled exceptions, failed renders, DB connection errors |
| `CRITICAL` | System-wide impact — all retries exhausted, storage full, worker crash |

#### Sample Log Entry

```json
{
  "level": "ERROR",
  "timestamp": "2026-06-18T09:15:32.441Z",
  "service": "fabricviz-api",
  "message": "Render job failed after 3 retries",
  "jobId": "rj_abc123",
  "error": "NanoBananaTimeoutError: upstream timeout after 30s",
  "traceId": "tr_xyz789"
}
```

### 1.3 Log Rotation

Recommended `logrotate` configuration for the VPS:

```bash
# /etc/logrotate.d/fabricviz
/opt/fabricviz/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 fabricviz fabricviz
    postrotate
        docker kill --signal=USR1 fabricviz-api fabricviz-worker 2>/dev/null || true
    endscript
}
```

- **Retention**: 14 days of compressed logs.
- **Frequency**: Daily rotation.
- **Compression**: gzip after one day delay.

---

## 2. Daily Health-Check Routine

> Perform at **9:00 AM** and **3:00 PM** local time.

| # | Check | How to Verify | Healthy Threshold |
|---|---|---|---|
| 1 | Render success/failure rate | `GET /api/analytics/dashboard` → `renderStatusCounts` | Failed < 5% of total |
| 2 | BullMQ queue depth | `redis-cli LLEN bull:render-queue:wait` | < 50 pending jobs |
| 3 | Storage usage | `GET /api/storage/summary` | Disk utilization < 80% |
| 4 | Active sessions | `SELECT COUNT(*) FROM customer_sessions WHERE expires_at > NOW();` | Informational (no threshold) |
| 5 | API 5xx rate | Check `./logs/fabricviz-api.log` for `ERROR`/`CRITICAL` entries in last 6 hours | < 0.5% of total requests |
| 6 | Worker heartbeat | `docker logs fabricviz-worker --tail 10` | Worker alive and processing |
| 7 | P95 render latency | See query below | < 15 seconds |

### P95 Render Latency Query

```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_render_seconds
FROM render_jobs
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '24 hours';
```

> **Action on breach**: If any threshold is exceeded, escalate per the Incident Response Workflow (Section 3).

---

## 3. Incident Response Workflow

### 3.1 Severity Definitions

| Severity | Definition | Response Time | Examples |
|---|---|---|---|
| **P1 — Critical** | Platform fully down or data loss risk | **15 minutes** | API unresponsive, database crash, storage corruption |
| **P2 — Major** | Core feature broken, workaround unavailable | **1 hour** | Render pipeline stuck, Nano Banana API down, auth failures |
| **P3 — Moderate** | Feature degraded, workaround available | **4 hours** | Slow renders (> 30s), intermittent download failures |
| **P4 — Low** | Cosmetic or minor, no user impact | **Next business day** | UI glitch, non-critical log warnings, minor text errors |

### 3.2 Escalation Flow

FabricViz operates as a **single-engineer system** — no on-call rotation required.

```
UptimeRobot Alert / User Report
        │
        ▼
  Engineer receives alert
  (Email + WhatsApp for P1/P2)
        │
        ▼
  Assess severity (P1–P4)
        │
        ├── P1/P2 → Immediate action
        │             Acknowledge within response time
        │             Begin diagnosis + fix
        │             Notify pilot users if service impacted
        │
        └── P3/P4 → Log issue in bug backlog
                     Schedule fix in next sprint
```

### 3.3 Rollback Playbook

When a deployment causes production issues:

**Step 1 — Halt the worker** (stop processing new jobs):
```bash
docker compose -f infra/docker-compose.prod.yml stop worker
```

**Step 2 — Revert the API** (force-recreate with previous image):
```bash
docker compose -f infra/docker-compose.prod.yml up -d --force-recreate api
```

**Step 3 — Reverse migrations** (if schema changes were deployed):
```bash
# Identify the last migration applied and run its DOWN script
# Example:
psql -U fabricviz -d fabricviz -f migrations/sprint-XX-down.sql
```

**Step 4 — Notify pilot users**:
- Send a WhatsApp broadcast or email to affected users.
- Include: what happened, current status, and expected resolution time.

**Step 5 — Post-incident review**:
- Document root cause in `docs/bug-backlog.md`.
- Update monitoring if a gap was identified.

---

## 4. Customer Support Intake

| Issue Type | Intake Method | Resolution Steps | Escalation |
|---|---|---|---|
| **Access Code Not Working** | WhatsApp / Email | 1. Verify code exists: `SELECT * FROM access_codes WHERE code = '<code>';` 2. Check `active` flag 3. Check `expires_at` 4. Re-issue if needed | L2 if DB issue |
| **Render Failure** | WhatsApp / Email | 1. Get job ID from user or `render_jobs` table 2. Check `status` and `error_message` 3. Retry via admin dashboard or re-queue | L2 if Nano Banana outage |
| **Download Not Working** | WhatsApp / Email | 1. Verify `output_url` in `render_jobs` 2. Check storage backend connectivity 3. Re-generate signed URL if expired | L2 if storage outage |
| **Credits Exhausted** | WhatsApp / Email | 1. Check `credit_limit` and `credits_used` on `access_codes` 2. Grant additional credits via `POST /api/credits/:accessCodeId/grant` | None (L1 resolved) |
| **Image Quality Issues** | WhatsApp / Email | 1. Check fabric metadata (tags, repeat info) 2. Verify room template resolution 3. Check Nano Banana prompt quality 4. Re-render with updated metadata | L2 if systematic |

---

## 5. Known Issues & Workarounds

| # | Issue | Symptom | Workaround | Status |
|---|---|---|---|---|
| 1 | Nano Banana API timeouts | Render jobs fail with `504` or `NanoBananaTimeoutError` | BullMQ automatically retries up to 3 times. If all retries exhaust, a `CRITICAL` log is emitted. No manual action needed unless recurring. | Mitigated (retry logic) |
| 2 | Missing fabric metadata | Renders produce generic/low-quality output | The Prompt Generator falls back to a generic prompt. Fix by populating missing `tags` and `repeat` fields in the catalog. | Workaround in place |
| 3 | Soft-deleted assets not auto-purged | Storage usage grows over time as deleted visualizations remain on disk/cloud | Admin must periodically call `DELETE /api/storage/cleanup` to reclaim space. Recommend weekly cron. | Manual cleanup required |
| 4 | Rate limiter lockout | Users get `429 Too Many Requests` after 10 requests/minute | User must wait **60 seconds** for the rate limit window to reset. No admin override available. | By design |
| 5 | Local storage mode limitations | Assets stored on local filesystem are not distributed; tied to single VPS | Only affects development/single-VPS deployments. Production should use R2 or S3 via environment configuration. | Acceptable for v1 |
| 6 | Redis memory under load | Redis OOM errors if queue backlog grows very large | Monitor queue depth (Check #2 in health routine). Scale Redis `maxmemory` or flush stale jobs. | Monitor |

---

## Appendix: Quick Reference Commands

```bash
# Check API health
curl -s https://<domain>/health | jq .

# Check queue depth
redis-cli LLEN bull:render-queue:wait

# Tail API logs
tail -f ./logs/fabricviz-api.log | jq .

# Tail worker logs
tail -f ./logs/fabricviz-worker.log | jq .

# Check running containers
docker compose -f infra/docker-compose.prod.yml ps

# Restart all services
docker compose -f infra/docker-compose.prod.yml restart

# View resource usage
docker stats --no-stream
```
