# Post-Pilot Report Template

> FabricViz AI — Pilot Cohort Analysis

This document provides a structured template for generating post-pilot reports after each pilot cohort completes their trial period.

---

## 1. Report Header

| Field | Value |
|---|---|
| **Report Date** | `YYYY-MM-DD` |
| **Pilot Period** | `YYYY-MM-DD` to `YYYY-MM-DD` |
| **Cohort Size** | _Number of showrooms / access codes issued_ |
| **Collections Enabled** | _e.g., Sofa, Curtain_ |
| **Prepared By** | _Engineer name_ |
| **Distribution** | _Stakeholder list_ |

---

## 2. Analytics Summary

### 2.1 Top Fabrics by Render Count

```sql
SELECT
  f.name AS fabric_name,
  f.brand,
  COUNT(rj.id) AS render_count
FROM render_jobs rj
JOIN fabrics f ON rj.fabric_id = f.id
WHERE rj.created_at BETWEEN '<start_date>' AND '<end_date>'
GROUP BY f.name, f.brand
ORDER BY render_count DESC
LIMIT 10;
```

| Rank | Fabric Name | Brand | Render Count |
|---|---|---|---|
| 1 | _TBD_ | _TBD_ | _TBD_ |
| 2 | _TBD_ | _TBD_ | _TBD_ |
| 3 | _TBD_ | _TBD_ | _TBD_ |

### 2.2 Most Used Room Templates

```sql
SELECT
  rt.name AS room_name,
  rt.category,
  COUNT(rj.id) AS usage_count
FROM render_jobs rj
JOIN room_templates rt ON rj.room_template_id = rt.id
WHERE rj.created_at BETWEEN '<start_date>' AND '<end_date>'
GROUP BY rt.name, rt.category
ORDER BY usage_count DESC
LIMIT 10;
```

| Rank | Room Template | Category | Usage Count |
|---|---|---|---|
| 1 | _TBD_ | _TBD_ | _TBD_ |
| 2 | _TBD_ | _TBD_ | _TBD_ |
| 3 | _TBD_ | _TBD_ | _TBD_ |

### 2.3 Render Success Rate

```sql
SELECT
  status,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM render_jobs
WHERE created_at BETWEEN '<start_date>' AND '<end_date>'
GROUP BY status;
```

| Status | Count | Percentage |
|---|---|---|
| `completed` | _TBD_ | _TBD_% |
| `failed` | _TBD_ | _TBD_% |
| `processing` | _TBD_ | _TBD_% |
| `queued` | _TBD_ | _TBD_% |

> **Target**: Failed < 5% of total renders.

### 2.4 Download Rate

```sql
SELECT
  COUNT(CASE WHEN downloaded = true THEN 1 END) AS downloaded,
  COUNT(*) AS total_completed,
  ROUND(
    COUNT(CASE WHEN downloaded = true THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2
  ) AS download_rate
FROM render_jobs
WHERE status = 'completed'
  AND created_at BETWEEN '<start_date>' AND '<end_date>';
```

| Metric | Value |
|---|---|
| Total Completed Renders | _TBD_ |
| Downloads | _TBD_ |
| Download Rate | _TBD_% |

### 2.5 History Usage

```sql
SELECT
  COUNT(*) AS total_history_views
FROM audit_logs
WHERE action = 'VIEW_HISTORY'
  AND created_at BETWEEN '<start_date>' AND '<end_date>';
```

| Metric | Value |
|---|---|
| Total History Views | _TBD_ |
| Unique Users Viewing History | _TBD_ |

### 2.6 Session Statistics

```sql
SELECT
  COUNT(DISTINCT access_code_id) AS unique_users,
  COUNT(*) AS total_sessions,
  AVG(EXTRACT(EPOCH FROM (expires_at - created_at))) / 60 AS avg_session_duration_min
FROM customer_sessions
WHERE created_at BETWEEN '<start_date>' AND '<end_date>';
```

| Metric | Value |
|---|---|
| Unique Users | _TBD_ |
| Total Sessions | _TBD_ |
| Avg Session Duration (min) | _TBD_ |

---

## 3. UX Funnel Analysis

```
  Access Code Entry
        │
        ▼  ──── Conversion: __% 
  Fabric Selection
        │
        ▼  ──── Conversion: __%
  Room Selection
        │
        ▼  ──── Conversion: __%
  Render Triggered
        │
        ▼  ──── Conversion: __%
  Download / Share
```

| Funnel Step | Users | Conversion Rate | Drop-off Rate |
|---|---|---|---|
| Access Code Entry | _TBD_ | 100% (baseline) | — |
| Fabric Selection | _TBD_ | _TBD_% | _TBD_% |
| Room Selection | _TBD_ | _TBD_% | _TBD_% |
| Render Triggered | _TBD_ | _TBD_% | _TBD_% |
| Download / Share | _TBD_ | _TBD_% | _TBD_% |

> **Key Metric**: End-to-end conversion (Access Code → Download) = _TBD_%

### Friction Points Identified

| Funnel Stage | Friction Observed | Severity | Proposed Fix |
|---|---|---|---|
| _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| _TBD_ | _TBD_ | _TBD_ | _TBD_ |

---

## 4. Support Ticket Summary

| Category | Ticket Count | Resolution Rate | Avg Resolution Time |
|---|---|---|---|
| Access Code Issues | _TBD_ | _TBD_% | _TBD_ |
| Render Failures | _TBD_ | _TBD_% | _TBD_ |
| Download Problems | _TBD_ | _TBD_% | _TBD_ |
| Credit Requests | _TBD_ | _TBD_% | _TBD_ |
| Image Quality Complaints | _TBD_ | _TBD_% | _TBD_ |
| Other | _TBD_ | _TBD_% | _TBD_ |
| **Total** | **_TBD_** | **_TBD_%** | **_TBD_** |

---

## 5. Pilot Assessment Quadrants

### ✅ What Worked

| # | Observation | Supporting Data |
|---|---|---|
| 1 | _TBD_ | _TBD_ |
| 2 | _TBD_ | _TBD_ |
| 3 | _TBD_ | _TBD_ |

### ❌ What Did Not Work

| # | Observation | Impact | Proposed Action |
|---|---|---|---|
| 1 | _TBD_ | _TBD_ | _TBD_ |
| 2 | _TBD_ | _TBD_ | _TBD_ |
| 3 | _TBD_ | _TBD_ | _TBD_ |

### 🔧 What Needs Fixing

| # | Issue | Severity | Target Sprint |
|---|---|---|---|
| 1 | _TBD_ | _TBD_ | _TBD_ |
| 2 | _TBD_ | _TBD_ | _TBD_ |
| 3 | _TBD_ | _TBD_ | _TBD_ |

### 💡 What Users Want Next

| # | Feature Request | Frequency | Feasibility | v2 Candidate? |
|---|---|---|---|---|
| 1 | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| 2 | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| 3 | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

---

## 6. Recommendations for Broader Rollout

### 6.1 Prerequisites Before Scaling

- [ ] Render success rate consistently > 95% over 2-week period
- [ ] P95 render latency < 15 seconds
- [ ] Storage backend moved to R2/S3 (not local)
- [ ] All P1/P2 bugs from pilot resolved
- [ ] Support intake process documented and tested
- [ ] Credit management workflow validated with pilot users

### 6.2 Scaling Recommendations

| Area | Current (Pilot) | Recommended (Rollout) |
|---|---|---|
| Showrooms | _TBD_ (pilot cohort) | 10-20 showrooms |
| Access Codes | _TBD_ codes issued | Scale proportionally |
| Worker Instances | 1 worker | 2-3 workers (horizontal scaling) |
| Storage | Local / R2 | R2 or S3 (production-grade) |
| Monitoring | UptimeRobot + logs | Add APM tool if budget permits |
| Support | Engineer-handled | Dedicated L1 support person |

### 6.3 Go / No-Go Checklist

| Criteria | Met? | Notes |
|---|---|---|
| Render success rate > 95% | ☐ | |
| No unresolved P1 bugs | ☐ | |
| Storage on cloud provider | ☐ | |
| Support process validated | ☐ | |
| User NPS > 7 | ☐ | |
| Credit workflow functional | ☐ | |

---

## Appendix: Report Generation Checklist

- [ ] Run all analytics queries against production database
- [ ] Export UptimeRobot uptime report for the pilot period
- [ ] Compile support tickets from WhatsApp/email logs
- [ ] Conduct user interviews (minimum 3 showroom operators)
- [ ] Review error logs for recurring issues
- [ ] Screenshot key dashboard metrics
- [ ] Share draft with stakeholders for review before finalizing
