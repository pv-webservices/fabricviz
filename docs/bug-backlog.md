# Bug Backlog & Technical Debt Tracker

> FabricViz AI — Issue Management

This document tracks known bugs, technical debt items, and the bug fix workflow for the FabricViz platform.

---

## 1. Bug Entry Template

Use the following template when logging new bugs:

```
### BUG-XXX: [Title]

| Field | Value |
|---|---|
| **ID** | BUG-XXX |
| **Severity** | P1 / P2 / P3 / P4 |
| **Component** | API / Worker / Frontend / Database / Storage / Infrastructure |
| **Reported Date** | YYYY-MM-DD |
| **Reporter** | Name or source |
| **Status** | Open / In Progress / Fixed / Verified / Closed |

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:** What should happen.

**Actual Behavior:** What actually happens.

**Root Cause:** Analysis of why this happens.

**Fix:** Description of the fix applied.

**Test:** How to verify the fix works.
```

---

## 2. Active Bug Backlog

### BUG-001: Storage service uses mock URLs when in local mode

| Field | Value |
|---|---|
| **ID** | BUG-001 |
| **Severity** | P2 (downgraded from P1) |
| **Component** | Storage |
| **Reported Date** | 2026-06-18 |
| **Reporter** | Internal audit |
| **Status** | Open — Tracked |

**Steps to Reproduce:**
1. Configure storage mode to `local` in environment variables.
2. Upload a fabric image or trigger a render.
3. Inspect the returned `output_url` in the render job record.

**Expected Behavior:** URLs should resolve to accessible file paths on the local filesystem served via the API.

**Actual Behavior:** Storage service returns mock/placeholder URLs (e.g., `https://mock-storage.example.com/...`) that do not resolve to real files.

**Root Cause:** The storage abstraction layer was initially built with mock implementations for local mode during development. The service now supports env-driven configuration (`LOCAL`, `R2`, `S3`), but the local adapter still returns mock-formatted URLs in certain code paths.

**Fix:** Audit the local storage adapter to ensure all URL generation paths return valid, servable local file URLs. Ensure the API serves static files from the configured local storage directory.

**Test:** Deploy with `STORAGE_MODE=local`, upload a fabric, trigger a render, and verify the output URL returns the actual rendered image.

> **Note:** Downgraded from P1 to P2 because storage is now env-driven. Production deployments using R2 or S3 are unaffected. This only impacts local-mode development and single-VPS deployments.

---

### BUG-002: Nano Banana uses mock stub until real API key is configured

| Field | Value |
|---|---|
| **ID** | BUG-002 |
| **Severity** | P2 (downgraded from P1) |
| **Component** | Worker |
| **Reported Date** | 2026-06-18 |
| **Reporter** | Internal audit |
| **Status** | Open — Tracked |

**Steps to Reproduce:**
1. Start the worker without setting the `NANO_BANANA_API_KEY` environment variable.
2. Submit a render job via the API.
3. Observe the worker processing the job.

**Expected Behavior:** Worker should either call the real Nano Banana 2.0 API or fail gracefully with a clear error.

**Actual Behavior:** Worker uses a mock/stub implementation that returns placeholder render results without calling the actual Nano Banana API.

**Root Cause:** The Nano Banana client was built with a conditional mock: if no API key is configured, it falls back to a stub that simulates successful renders. This was intentional for development but should be clearly flagged in production.

**Fix:** Add startup validation that logs a `WARN` when mock mode is active. In production (`NODE_ENV=production`), either require a valid API key or fail fast with a clear error message.

**Test:**
1. Start worker without API key → verify `WARN` log is emitted.
2. Start worker with `NODE_ENV=production` and no API key → verify startup fails with clear error.
3. Start worker with valid API key → verify real Nano Banana API is called.

> **Note:** Downgraded from P1 to P2 because the mock is now conditional and clearly documented. Production deployments must set the API key.

---

### BUG-003: No formal database migration runner

| Field | Value |
|---|---|
| **ID** | BUG-003 |
| **Severity** | P3 |
| **Component** | Database / Infrastructure |
| **Reported Date** | 2026-06-18 |
| **Reporter** | Internal audit |
| **Status** | Open — Tracked |

**Steps to Reproduce:**
1. Review the project for a migration tool (e.g., `knex migrate`, `prisma migrate`, `node-pg-migrate`).
2. Observe that migrations are managed as raw SQL scripts in the `migrations/` directory.

**Expected Behavior:** A formal migration runner tracks which migrations have been applied, supports `UP` and `DOWN` operations, and prevents duplicate execution.

**Actual Behavior:** Migrations are raw `.sql` files that must be manually applied via `psql`. No tracking table exists to record which migrations have been run.

**Root Cause:** Migration tooling was deferred during the rapid sprint-based development to reduce dependencies. The SQL scripts work but lack automation and safety guarantees.

**Fix:** Integrate a lightweight migration runner (e.g., `node-pg-migrate` or `postgres-migrations`). Create a `schema_migrations` tracking table. Wrap existing SQL scripts as versioned migrations.

**Test:**
1. Run `migrate up` on a fresh database → verify all tables are created.
2. Run `migrate down` → verify rollback works.
3. Run `migrate up` twice → verify idempotency (no duplicate errors).

---

### BUG-004: Soft-deleted assets require manual cleanup

| Field | Value |
|---|---|
| **ID** | BUG-004 |
| **Severity** | P3 |
| **Component** | Storage / API |
| **Reported Date** | 2026-06-18 |
| **Reporter** | Internal audit |
| **Status** | Open — Tracked |

**Steps to Reproduce:**
1. Delete a visualization via the admin dashboard (soft-delete sets `active = false`).
2. Check the storage backend (local directory, R2, or S3).
3. Observe that the rendered image file still exists on storage.

**Expected Behavior:** Soft-deleted assets should be automatically purged from storage after a configurable retention period (e.g., 7 days).

**Actual Behavior:** Soft-deleted assets remain in storage indefinitely until an admin manually calls `DELETE /api/storage/cleanup`.

**Root Cause:** Automated cleanup was deferred. The API exposes a manual cleanup endpoint, but no scheduled job exists to invoke it.

**Fix:** Add a scheduled BullMQ repeatable job (or cron) that runs `DELETE /api/storage/cleanup` weekly. Add a configurable retention period before permanent deletion.

**Test:**
1. Soft-delete a visualization.
2. Wait for the cleanup job to run (or trigger manually).
3. Verify the file is removed from storage.
4. Verify the database record is either hard-deleted or marked as purged.

---

## 3. Bug Fix Workflow

```
  Report
    │
    ▼
  Triage (assign severity P1–P4)
    │
    ▼
  Root Cause Analysis
    │
    ▼
  Fix on Feature Branch
    │
    ▼
  Add / Update Tests
    │
    ▼
  Run Regression Suite
    │
    ▼
  Code Review (self-review for single engineer)
    │
    ▼
  Deploy to Staging
    │
    ▼
  Verify Fix in Staging
    │
    ▼
  Deploy to Production
    │
    ▼
  Verify Fix in Production
    │
    ▼
  Close Bug
```

### Workflow Rules

| Rule | Description |
|---|---|
| **Branch naming** | `fix/BUG-XXX-short-description` |
| **Commit message** | `fix(component): BUG-XXX — description` |
| **P1/P2 hotfix** | May skip staging; deploy directly to production with immediate verification |
| **P3/P4 fix** | Must go through full staging → production pipeline |
| **Regression** | All fixes must pass the regression suite before merge |

---

## 4. Regression Suite

### Automated Tests

```bash
# Run the full test suite
pnpm test

# Run tests for a specific component
pnpm test -- --filter=api
pnpm test -- --filter=worker
```

### Manual Smoke Test Checklist

Perform after every production deployment:

- [ ] **Access Code Login**: Enter a valid 5-digit code → session created
- [ ] **Fabric Catalog**: Browse fabrics → images load, filters work
- [ ] **Room Selection**: Select a room template → preview displays
- [ ] **Render Trigger**: Submit a render → job queued and completes
- [ ] **Download**: Download a completed render → image file received
- [ ] **History**: View render history → previous renders listed
- [ ] **Admin Dashboard**: Login as admin → analytics and management functional
- [ ] **Credits**: Check credit balance → accurate count displayed
- [ ] **Storage Cleanup**: Trigger cleanup → no errors, storage reclaimed
- [ ] **Health Endpoint**: `GET /health` → returns `200 OK`

---

## 5. Bug Metrics

| Metric | Current | Target |
|---|---|---|
| Open P1 Bugs | 0 | 0 |
| Open P2 Bugs | 2 (BUG-001, BUG-002) | 0 |
| Open P3 Bugs | 2 (BUG-003, BUG-004) | Track |
| Open P4 Bugs | 0 | Track |
| Mean Time to Fix (P1/P2) | — | < 24 hours |
| Mean Time to Fix (P3/P4) | — | < 1 sprint |
| Regression Rate | — | < 5% |
