# Support & Operations Manual

> FabricViz AI — L1/L2 Support Guide

This document defines the support tiers, troubleshooting scripts, database maintenance procedures, storage cleanup routines, and backup/recovery processes for the FabricViz platform.

---

## 1. Support Tiers

### L1 — Support Operations

| Responsibility | Description |
|---|---|
| Access Code Management | Issue, activate, deactivate, and troubleshoot 5-digit access codes |
| Credit Management | Check balances, grant additional credits, handle credit requests |
| Catalog Uploads | Upload new fabric images, manage fabric metadata and tags |
| Basic Troubleshooting | Guide users through common issues (login, download, credits) |
| Issue Escalation | Escalate unresolved issues to L2 Engineering |

### L2 — Engineering

| Responsibility | Description |
|---|---|
| Render Queue Management | Monitor BullMQ queue, flush stuck jobs, restart workers |
| Database Issues | Diagnose deadlocks, connection pool exhaustion, slow queries |
| API Outages | Investigate 5xx errors, review logs, restart services |
| Nano Banana Issues | Handle API timeouts, mock mode detection, prompt quality |
| Infrastructure | Docker container management, Nginx config, SSL certificates |
| Storage Issues | R2/S3 connectivity, file corruption, cleanup failures |

### Escalation Matrix

| Issue Type | First Responder | Escalation To | Escalation Trigger |
|---|---|---|---|
| Access code issues | L1 | L2 | Database query needed beyond standard lookups |
| Credit problems | L1 | L2 | API endpoint not responding |
| Render failures | L1 (initial triage) | L2 | Job stuck > 5 minutes or pattern of failures |
| Download errors | L1 | L2 | Storage backend connectivity issue |
| Platform outage | L2 (direct) | — | Immediate response required |

---

## 2. Common Troubleshooting Scripts

### 2.1 Render Job Diagnostics

**Check a specific render job:**
```sql
SELECT
  id, status, error_message,
  created_at, started_at, completed_at,
  fabric_id, room_template_id, access_code_id
FROM render_jobs
WHERE id = '<uuid>';
```

**Find recent failed jobs:**
```sql
SELECT id, error_message, created_at
FROM render_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;
```

**Flush stuck jobs** (jobs stuck in `processing` for more than 10 minutes):
```sql
UPDATE render_jobs
SET status = 'failed',
    error_message = 'Manually failed: stuck in processing'
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '10 minutes';
```

> ⚠️ **Caution**: Also update the corresponding `visualizations` table:
> ```sql
> UPDATE visualizations
> SET status = 'failed'
> WHERE status = 'processing'
>   AND updated_at < NOW() - INTERVAL '10 minutes';
> ```

### 2.2 Access Code & Credit Management

**Check customer credits:**
```sql
SELECT
  code, active, credit_limit, credits_used,
  (credit_limit - credits_used) AS credits_remaining,
  expires_at
FROM access_codes
WHERE code = '<code>';
```

**Grant additional credits** (via API):
```bash
curl -X POST https://<domain>/api/credits/<accessCodeId>/grant \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

**Deactivate a compromised access code** (via API):
```bash
curl -X PATCH https://<domain>/api/access-codes/<id> \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

**Clear all sessions for an access code:**
```sql
DELETE FROM customer_sessions
WHERE access_code_id = '<uuid>';
```

### 2.3 Queue & Worker Diagnostics

**Check BullMQ queue depth:**
```bash
redis-cli LLEN bull:render-queue:wait
redis-cli LLEN bull:render-queue:active
redis-cli LLEN bull:render-queue:failed
```

**View worker logs:**
```bash
docker logs fabricviz-worker --tail 50
```

**Restart the worker:**
```bash
docker compose -f infra/docker-compose.prod.yml restart worker
```

---

## 3. Database Maintenance

### 3.1 Weekly Vacuum

PostgreSQL's autovacuum handles routine maintenance, but a manual `VACUUM ANALYZE` should be run weekly to ensure optimal performance:

```sql
-- Run as superuser or database owner
VACUUM ANALYZE;
```

**Schedule via cron:**
```bash
# /etc/cron.d/fabricviz-vacuum
0 3 * * 0  fabricviz  psql -U fabricviz -d fabricviz -c "VACUUM ANALYZE;" >> /var/log/fabricviz-vacuum.log 2>&1
```

### 3.2 Index Health Check

Identify unused indexes that waste disk space and slow down writes:

```sql
SELECT
  schemaname, tablename, indexname,
  idx_scan, idx_tup_read, idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

> **Action**: Review unused indexes quarterly. Drop only after confirming they are not needed for foreign key constraints or unique enforcement.

### 3.3 Table Bloat Check

Identify tables with excessive bloat:

```sql
SELECT
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
  pg_size_pretty(
    pg_total_relation_size(schemaname || '.' || tablename) -
    pg_relation_size(schemaname || '.' || tablename)
  ) AS index_and_toast_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 10;
```

> **Action**: If a table's dead tuple ratio exceeds 20%, run `VACUUM FULL <table_name>;` during a maintenance window.

### 3.4 Connection Pool Monitoring

```sql
SELECT
  state, COUNT(*) AS connection_count
FROM pg_stat_activity
WHERE datname = 'fabricviz'
GROUP BY state;
```

> **Healthy**: `active` connections should be < 80% of `max_connections`. Idle connections should not exceed the pool size.

---

## 4. Storage Cleanup

### 4.1 Manual Cleanup

Trigger cleanup of soft-deleted assets:

```bash
curl -X DELETE https://<domain>/api/storage/cleanup \
  -H "Authorization: Bearer <admin_token>"
```

This removes files from the storage backend (local, R2, or S3) for all visualizations where `active = false`.

### 4.2 Scheduled Cleanup (Recommended)

Set up a weekly cron job to automate cleanup:

```bash
# /etc/cron.d/fabricviz-storage-cleanup
0 2 * * 1  fabricviz  curl -s -X DELETE https://localhost/api/storage/cleanup \
  -H "Authorization: Bearer <service_token>" >> /var/log/fabricviz-cleanup.log 2>&1
```

### 4.3 Storage Usage Monitoring

```bash
# Check storage summary via API
curl -s https://<domain>/api/storage/summary \
  -H "Authorization: Bearer <admin_token>" | jq .

# Check disk usage on VPS (for local storage mode)
df -h /opt/fabricviz/storage/
du -sh /opt/fabricviz/storage/*
```

---

## 5. Backup Procedures

### 5.1 PostgreSQL — Daily Backup

```bash
#!/bin/bash
# /opt/fabricviz/scripts/backup-db.sh

BACKUP_DIR="/opt/fabricviz/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="fabricviz_${TIMESTAMP}.sql.gz"

# Create backup
pg_dump -U fabricviz -d fabricviz | gzip > "${BACKUP_DIR}/${FILENAME}"

# Retain last 7 days
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +7 -delete

# Upload to offsite storage (R2/S3)
# aws s3 cp "${BACKUP_DIR}/${FILENAME}" s3://fabricviz-backups/postgres/

echo "[$(date)] Backup completed: ${FILENAME}"
```

**Schedule via cron:**
```bash
# /etc/cron.d/fabricviz-db-backup
0 1 * * *  fabricviz  /opt/fabricviz/scripts/backup-db.sh >> /var/log/fabricviz-backup.log 2>&1
```

### 5.2 Redis — Periodic Snapshot

```bash
# Trigger a background save
redis-cli BGSAVE

# Check last save time
redis-cli LASTSAVE

# Redis RDB file location (check redis.conf)
# Default: /var/lib/redis/dump.rdb
```

**Schedule via cron:**
```bash
# /etc/cron.d/fabricviz-redis-backup
0 1 * * *  fabricviz  redis-cli BGSAVE && cp /var/lib/redis/dump.rdb /opt/fabricviz/backups/redis/dump_$(date +\%Y\%m\%d).rdb 2>&1
```

### 5.3 Offsite Backup Upload

Upload backups to a remote location (R2, S3, or another server):

```bash
# Using rclone (configure once with `rclone config`)
rclone copy /opt/fabricviz/backups/ r2:fabricviz-backups/ --progress

# Or using AWS CLI for S3
aws s3 sync /opt/fabricviz/backups/ s3://fabricviz-backups/ --delete
```

---

## 6. Recovery Procedures

### 6.1 PostgreSQL Recovery

**Restore from pg_dump backup:**
```bash
# Stop the API and worker
docker compose -f infra/docker-compose.prod.yml stop api worker

# Drop and recreate the database
psql -U postgres -c "DROP DATABASE IF EXISTS fabricviz;"
psql -U postgres -c "CREATE DATABASE fabricviz OWNER fabricviz;"

# Restore from backup
gunzip -c /opt/fabricviz/backups/postgres/fabricviz_YYYYMMDD_HHMMSS.sql.gz | psql -U fabricviz -d fabricviz

# Restart services
docker compose -f infra/docker-compose.prod.yml up -d api worker
```

### 6.2 Redis Recovery

**Restore from RDB file:**
```bash
# Stop Redis
docker compose -f infra/docker-compose.prod.yml stop redis

# Replace the RDB file
cp /opt/fabricviz/backups/redis/dump_YYYYMMDD.rdb /var/lib/redis/dump.rdb

# Start Redis
docker compose -f infra/docker-compose.prod.yml start redis
```

> **Note**: Redis data (BullMQ queue state) is ephemeral. If Redis is lost, pending jobs will need to be re-queued. Completed job results are stored in PostgreSQL.

### 6.3 Full System Recovery

In case of complete VPS failure:

1. **Provision new VPS** with Docker and Docker Compose installed.
2. **Clone the repository** and checkout the production branch/tag.
3. **Restore environment variables** from secure backup (1Password, Vault, etc.).
4. **Restore PostgreSQL** from the latest offsite backup (Section 6.1).
5. **Restore Redis RDB** if available (Section 6.2).
6. **Start all services**: `docker compose -f infra/docker-compose.prod.yml up -d`
7. **Verify health**: `curl https://<domain>/health`
8. **Run smoke test**: Follow the checklist in `docs/bug-backlog.md` Section 4.
9. **Update DNS** if the VPS IP address changed.
10. **Notify users** of any service interruption and resolution.

---

## Appendix: Maintenance Calendar

| Task | Frequency | Timing | Owner |
|---|---|---|---|
| Health checks | Twice daily | 9:00 AM, 3:00 PM | Engineer |
| Storage cleanup | Weekly | Monday 2:00 AM (cron) | Automated |
| Database vacuum | Weekly | Sunday 3:00 AM (cron) | Automated |
| PostgreSQL backup | Daily | 1:00 AM (cron) | Automated |
| Redis snapshot | Daily | 1:00 AM (cron) | Automated |
| Offsite backup sync | Daily | 1:30 AM (cron) | Automated |
| Index health review | Quarterly | Manual | Engineer |
| Log rotation review | Monthly | Manual | Engineer |
| SSL certificate renewal | 30 days before expiry | UptimeRobot alert | Engineer |
