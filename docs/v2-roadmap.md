# v2 Roadmap — Feature Priorities & Sprint Planning

> FabricViz AI — Beyond v1 Pilot

This document outlines the deferred features, proposed sprint allocations, acceptance criteria, and architecture changes needed for FabricViz v2. All timelines are **flexible** and driven by pilot feedback — no fixed dates.

---

## 1. Deferred Feature Priority Matrix

| # | Feature | Business Value | Effort | Priority | Proposed Sprint |
|---|---|---|---|---|---|
| 1 | Rug Rendering | High — Expands product catalog to floor coverings | Medium | 🔴 High | Sprint 11–12 |
| 2 | Wallpaper Rendering | High — Opens wall treatment vertical | High | 🔴 High | Sprint 12–13 |
| 3 | Credit Wallet | Medium — Enables pre-paid credit packs for showrooms | Medium | 🟡 Medium | Sprint 11 |
| 4 | CRM Integration | Medium — Connects render history to showroom CRM | Medium | 🟡 Medium | Sprint 14 |
| 5 | Multi-Brand SaaS | High — Enables multi-tenant white-label deployment | Very High | 🔴 High | Sprint 15–16 |
| 6 | Client-Side HEIC Compression | Low–Medium — Reduces upload bandwidth on iOS | Low | 🟢 Low | Sprint 11 |
| 7 | WebSockets Live Status | Medium — Real-time render progress feedback | Medium | 🟡 Medium | Sprint 13 |
| 8 | Penetration Testing | High (Compliance) — Security audit for enterprise clients | Medium | 🔴 High | Sprint 11 |
| 9 | 3D Visual Mapping | Low (Innovation) — AR/3D fabric visualization | Very High | 🔵 Experimental | Sprint 17+ |

> **Note:** Sprint numbers are relative to v1 completion. Actual scheduling depends on pilot feedback, resource availability, and business priorities.

---

## 2. Acceptance Criteria

### Feature 1: Rug Rendering

| # | Criterion |
|---|---|
| 1 | User can select "Rug" as a product category and browse rug-specific room templates |
| 2 | Nano Banana generates floor-perspective renders with accurate fabric pattern scaling |
| 3 | Render quality matches or exceeds sofa/curtain baseline (assessed by stakeholder review) |

### Feature 2: Wallpaper Rendering

| # | Criterion |
|---|---|
| 1 | User can select "Wallpaper" category with wall-specific room templates |
| 2 | Prompt generator handles repeat patterns and seamless tiling parameters |
| 3 | Renders show correct wall coverage without visible seams or distortion |

### Feature 3: Credit Wallet

| # | Criterion |
|---|---|
| 1 | Showroom admin can purchase credit packs via a payment flow (or manual assignment) |
| 2 | Credits deduct per render and display remaining balance to the customer |
| 3 | Low-credit warnings trigger at configurable thresholds (e.g., 10 credits remaining) |

### Feature 4: CRM Integration

| # | Criterion |
|---|---|
| 1 | Render history and customer session data can be exported to external CRM via webhook |
| 2 | Webhook payload includes fabric, room, render status, and timestamp |
| 3 | Failed webhook deliveries retry up to 3 times with exponential backoff |

### Feature 5: Multi-Brand SaaS

| # | Criterion |
|---|---|
| 1 | Each brand/tenant has isolated data (fabrics, rooms, renders, access codes) |
| 2 | Admin dashboard supports brand switching with tenant-scoped views |
| 3 | Custom branding (logo, colors) per tenant without code changes |

### Feature 6: Client-Side HEIC Compression

| # | Criterion |
|---|---|
| 1 | iOS users uploading HEIC images have them auto-converted to JPEG client-side |
| 2 | Conversion happens before upload, reducing bandwidth by ~50% |
| 3 | No quality loss visible to end users in the final render |

### Feature 7: WebSockets Live Status

| # | Criterion |
|---|---|
| 1 | Customer sees real-time render progress (queued → processing → completed) without polling |
| 2 | WebSocket connection auto-reconnects on network interruption |
| 3 | Falls back to HTTP polling if WebSocket is unavailable |

### Feature 8: Penetration Testing

| # | Criterion |
|---|---|
| 1 | External security firm completes OWASP Top 10 assessment |
| 2 | All critical and high findings remediated before broader rollout |
| 3 | Security report archived and available for enterprise client requests |

### Feature 9: 3D Visual Mapping

| # | Criterion |
|---|---|
| 1 | Proof-of-concept: fabric texture mapped onto a 3D room model in-browser |
| 2 | User can rotate and zoom the 3D view |
| 3 | Performance: renders at 30fps on mid-range mobile devices |

---

## 3. Architecture Changes Required

### 3.1 WebSocket Server

- **Purpose**: Real-time render status updates (Feature 7).
- **Approach**: Add a WebSocket server (e.g., `ws` or `Socket.IO`) alongside the Fastify API.
- **Impact**: New process or integrated into the API server. Requires Redis pub/sub for worker → API → client communication.

### 3.2 Tenant Isolation Layer

- **Purpose**: Multi-brand SaaS (Feature 5).
- **Approach**: Add `tenant_id` foreign key to all core tables. Implement row-level filtering middleware.
- **Impact**: Database schema migration for all tables. API middleware for tenant context. Admin dashboard multi-tenant views.

### 3.3 New Nano Banana Recipes

- **Purpose**: Rug and wallpaper rendering (Features 1, 2).
- **Approach**: Develop new prompt templates for floor and wall perspectives. May require new room template categories.
- **Impact**: Prompt generator updates. New room template seeds. Potential Nano Banana API parameter changes.

### 3.4 Billing Tables

- **Purpose**: Credit wallet (Feature 3).
- **Approach**: New `credit_transactions` table tracking purchases, deductions, and refunds. Optional payment gateway integration.
- **Impact**: New database tables. API endpoints for credit management. Frontend credit display components.

### 3.5 Webhook Dispatcher

- **Purpose**: CRM integration (Feature 4).
- **Approach**: BullMQ job that fires HTTP POST to configured webhook URLs on render completion.
- **Impact**: New `webhooks` table for URL configuration. New BullMQ queue for webhook delivery. Retry logic with exponential backoff.

### 3.6 Plane Detection / 3D Pipeline

- **Purpose**: 3D visual mapping (Feature 9).
- **Approach**: Client-side 3D rendering with Three.js or Babylon.js. Server provides texture-mapped UV coordinates.
- **Impact**: Major frontend addition. New asset pipeline for 3D room models. Significant R&D effort.

---

## 4. Dependencies & Prerequisites

| Feature | Dependencies | Prerequisites |
|---|---|---|
| Rug Rendering | Nano Banana floor-perspective support | Room template assets for floor views |
| Wallpaper Rendering | Nano Banana wall-perspective support | Seamless tiling logic in prompt generator |
| Credit Wallet | Payment gateway (optional) | Billing schema design |
| CRM Integration | External CRM API documentation | Webhook schema agreement with CRM vendors |
| Multi-Brand SaaS | Tenant isolation migration | All v1 bugs resolved |
| HEIC Compression | Client-side image processing library | iOS device testing matrix |
| WebSockets | Redis pub/sub | WebSocket-compatible hosting (already Docker-based) |
| Penetration Testing | External security vendor contract | Staging environment with production-like data |
| 3D Visual Mapping | Three.js / Babylon.js evaluation | 3D room model assets |

---

## 5. Timeline Philosophy

> **All timelines are flexible.** Sprint numbers are relative, not calendar-fixed.

Prioritization is driven by:
1. **Pilot feedback** — What do users actually need?
2. **Business impact** — Which features unlock revenue or new markets?
3. **Technical risk** — Which features de-risk the platform?
4. **Effort-to-value ratio** — Quick wins first, moonshots later.

### Proposed Sprint Sequence

```
Sprint 11  ──  HEIC Compression + Credit Wallet + Pen Testing
                (Quick wins + compliance)
                    │
Sprint 12  ──  Rug Rendering
                (Catalog expansion)
                    │
Sprint 13  ──  Wallpaper Rendering + WebSockets
                (More products + better UX)
                    │
Sprint 14  ──  CRM Integration
                (Enterprise readiness)
                    │
Sprint 15-16 ── Multi-Brand SaaS
                (Scale to multiple tenants)
                    │
Sprint 17+  ──  3D Visual Mapping
                (Innovation / R&D)
```

> This sequence can be re-ordered based on pilot findings. The post-pilot report (see `post-pilot-report.md`) will inform final sprint planning.
