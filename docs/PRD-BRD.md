# FabricViz AI — Product & Business Requirements Document
**Version:** 1.0 | **Date:** June 2026 | **Status:** Approved for Sprint 0

---

## Part A — Business Requirements (BRD)

### Executive Summary

FabricViz AI is a zero-prompt fabric visualization PWA that enables textile showroom staff, dealers, and customers to see how any fabric looks draped on a sofa, curtain, rug, or wallpaper — without writing AI prompts. The system is built to increase fabric sales conversion by replacing the imagination gap between a fabric swatch and a finished room scene.

The competitive advantage over existing solutions is: a fully guided, prompt-free UX; object-aware AI rendering per item type; stronger admin content controls; and a lean VPS-based deployment that reduces monthly operating costs by 60–75% versus Lovable-hosted alternatives.

---

### Business Goals

| Goal | Metric | Target |
|---|---|---|
| Increase demo-to-inquiry rate | Quote requests per session | ≥ 15% |
| Reduce sales cycle friction | Time from fabric selection to render | < 45 seconds |
| Improve admin efficiency | Fabrics onboarded per hour | ≥ 30 SKUs/hr |
| Lower client infra cost | Monthly cost vs competitor | < ₹2,000/mo |
| Enable multi-showroom scale | Active access codes | ≥ 100 simultaneous |

---

### Stakeholder Matrix

| Role | Interest | Involvement |
|---|---|---|
| Client owner | ROI, sales lift | Final approvals, UAT sign-off |
| Brand admin | Content quality, catalog accuracy | Daily user, sprint demos |
| Showroom sales exec | Speed, ease of use in client meetings | Key persona, usability testing |
| Dealer/distributor | B2B client tools | Pilot test group |
| End customer | Visualization quality, trust | Final consumer, usability |
| Support operator | Request triage, credits | Admin panel user |
| Developer (you) | Architecture quality, delivery | Build + DevOps ownership |

---

### User Personas

**Persona 1 — Brand Admin (Priya, Merchandising Manager)**  
Desktop user. Manages 500+ fabric SKUs across 12 collections. Needs fast bulk import, visual QA of textures, and real-time analytics on which fabrics drive enquiries.

**Persona 2 — Showroom Sales Exec (Ravi, Interior Sales)**  
Tablet in showroom. Shows clients fabric options on room templates. Needs one-tap fabric switching, compare mode, and instant PDF export for follow-up.

**Persona 3 — Dealer/Distributor (Anjali, B2B Rep)**  
Mobile, on the road. Shares visualization links with interior designers. Needs QR entry, gallery upload mode, and WhatsApp-ready exports.

**Persona 4 — End Customer (Meera, Homeowner)**  
Mobile, self-serve. Received an access code from dealer. Wants to try fabrics on her uploaded living room photo. Needs guided UX with no technical knowledge required.

**Persona 5 — Support Operator (Suresh, Operations)**  
Desktop admin panel. Approves access code requests, manages credits, monitors storage, handles incidents.

---

### In-Scope v1

- 5-digit access code login + remember-device
- Fabric collection browsing (sofa + curtain in v1)
- All-fabric search with multi-filter
- QR code collection entry
- Predefined sample room selection
- Camera capture + gallery upload
- Object area selection (when room supports both)
- AI render via Nano Banana 2.0 (async + sync modes)
- Before/After result view
- Image download + branded PDF download
- History retention (configurable 30 or 50 items)
- Admin CRUD: collections, fabrics, rooms, customers, requests
- Storage dashboard with per-customer quota tracking
- Analytics dashboard (visualizations, top fabrics, cities)
- Global settings (render mode, storage mode, branding, support contacts)

### Out-of-Scope v1 (v2 Roadmap)

- Rug and wallpaper object types
- Open public registration
- Full e-commerce checkout
- Real-time collaborative editing
- CRM integration
- Multi-brand SaaS portal
- On-device offline AI inference
- Credit/wallet system (may simplify to plan-based entitlement)

---

### Business Constraints

| Constraint | Detail |
|---|---|
| Cost | Monthly infra must stay under ₹2,000 |
| Team | Lean — single full-stack developer + AI integration |
| Traffic | Moderate — showroom + dealer use, not mass consumer |
| Asset quality | Realism depends on high-res source fabric swatches |
| Timeline | MVP in 8–10 weeks from Sprint 0 |

---

### Business Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Poor swatch asset quality | Renders look unrealistic, client loses trust | Define strict onboarding spec upfront, reject low-res assets |
| Weak AI draping realism | Product fails demo in showroom | Object-aware prompt recipes per type, confidence scoring |
| Scope creep | Delayed delivery | Strict MVP freeze, formal change request process |
| Platform lock-in | High switching cost | Own full codebase, VPS deploy, abstract AI provider |
| Storage growth | VPS disk fills up | Configurable retention limits, quota monitoring |
| Mobile performance | PWA adoption drops | Device lab QA, image optimization, progressive enhancement |

---

### Business Decisions at Kickoff

1. **Object types in v1**: Sofa + Curtain confirmed. Rug + Wallpaper → v2.
2. **Credits vs plans**: Simplified plan-based entitlement (no wallet complexity in v1).
3. **Deployment**: Single VPS (Hostinger/Hetzner) with Docker Compose + Nginx.
4. **QR code in v1**: Yes, included.
5. **Quote/sample request in v1**: Yes, basic form + WhatsApp CTA.

---

## Part B — Product Requirements (PRD)

### Product Vision

FabricViz AI eliminates the imagination gap in fabric sales. A customer should be able to pick any fabric and see exactly how it will look in their room — on their sofa or curtain — in under 60 seconds, with zero technical knowledge required.

### Core Product Principles

1. **Zero prompts** — users select, not describe. System decides how to render.
2. **Object-aware realism** — every object type has its own rendering recipe.
3. **Mobile-first** — optimized for showroom tablets and customer phones.
4. **Admin-first content** — catalog quality controls before customer experience.
5. **Sales-conversion focus** — every render ends with a clear sales CTA.
6. **Progressive enhancement** — works on slow connections, installable as PWA.
7. **Lean infrastructure** — single VPS, no unnecessary managed services.

---

### Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind, Shadcn/UI | App Router, SSR, PWA support |
| Backend | Fastify, TypeScript, Zod | Fast, typed, schema-first |
| Database | PostgreSQL 16 | Relational, reliable, free |
| Queue | Redis 7 + BullMQ | Async render jobs |
| Storage | Cloudflare R2 / MinIO | Cheap object storage |
| AI Engine | Nano Banana 2.0 | Cost-effective, precise for textile tasks |
| Package mgr | pnpm + Turborepo | Fast monorepo |
| Deploy | Docker Compose on VPS | Single platform, low cost |
| CI/CD | GitHub Actions | Free for small teams |

---

### Customer Screen Inventory

| # | Screen | Description |
|---|---|---|
| 1 | Login / Access Code | 5-digit entry, remember device, request code link |
| 2 | Choose Your Fabric | Entry hub: Sofa, Curtain, QR, All Fabrics |
| 3 | Sofa Collections | Filterable collection grid (sofa-compatible only) |
| 4 | Curtain Collections | Filterable collection grid (curtain-compatible only) |
| 5 | Collection Detail | Fabric grid with search, color, quality filters |
| 6 | Fabric Detail | Swatch, metadata, feature badges, Visualize CTA |
| 7 | All Fabrics | Full catalog with multi-filter (color, quality, end-use, tags) |
| 8 | Scan QR Code | Camera QR decode → direct to collection |
| 9 | Upload Your Room | Choose sample room / take photo / upload gallery |
| 10 | Sample Room Picker | Predefined room grid filtered by fabric end-use |
| 11 | Select Area | Zone selector (sofa OR curtain) for multi-object rooms |
| 12 | Rendering | Progress screen with elapsed timer and fabric preview |
| 13 | Result | Before/After toggle, download image, download PDF, retry |
| 14 | History | Grid of past renders: thumbnail, fabric, date, delete |

---

### Admin Screen Inventory

| # | Screen | Description |
|---|---|---|
| 1 | Dashboard | KPIs: renders today, active customers, pending requests |
| 2 | Collections | Collection grid with CRUD, active toggle, QR URL |
| 3 | Add/Edit Collection | Name, description, thumbnail, group, QR URL, active |
| 4 | Fabrics | Fabric grid per collection + bulk import |
| 5 | Add/Edit Fabric | All metadata: code, swatch, texture, repeat dims, price, features |
| 6 | Predefined Rooms | Room grid with CRUD, end-use flag, display order |
| 7 | Add/Edit Room | Name, photo, end-use (sofa/curtain/both), active toggle |
| 8 | Customers | Access code list with stats, sessions, status |
| 9 | Add/Edit Customer | Code, name, company, phone, credit limit |
| 10 | Requests | Access code requests with approve/reject |
| 11 | Credits | Credit requests and history (v1: read-only) |
| 12 | Storage | Total records, file count, DB size, per-customer quota bars |
| 13 | Analytics | Render counts, top fabrics, top collections, city breakdown, trend chart |
| 14 | Settings | Site name, URLs, support email, WhatsApp, render mode, storage mode, tutorial video |

---

### Functional Requirements

#### Authentication
- Users enter a 5-digit access code validated server-side
- Successful validation issues a signed JWT session token
- Remember-device stores session token (7-day expiry)
- Forgot code: submit name + phone → admin receives request
- New user: request code form → admin approves and sends code

#### Fabric Catalog
- Collections grouped by end-use: sofa, curtain, both
- Each collection: name, description, thumbnail, group, QR URL, active flag
- Each fabric: name, code, swatch image, texture image, color family, quality, tags, end-use, repeat width (mm), repeat height (mm), fabric width (cm), price (INR), feature flags, active flag
- Feature flags: High Martindale, Fade Resistant, Water Repellent, Stain Repellent, Antimicrobial, Premium Quality
- Bulk import via Excel (XLSX) with validation and error report
- Admin can process/normalize texture images before publish

#### QR Code
- Each collection can have an optional QR URL
- Customer scans QR from physical card → app opens collection directly
- QR resolves via `GET /api/qr/:code` → redirects to collection

#### Room & Upload
- Admin creates predefined rooms: photo, name, end-use flag, display order, active toggle
- Customer picks from rooms filtered by selected fabric's end-use
- Camera capture opens device camera (iOS/Android native)
- Gallery upload: JPEG/PNG, max 10 MB
- Uploaded room photos deleted after render completes (privacy)

#### Area Selection
- Shown only when room supports both sofa and curtain
- Single tap selects the zone
- Zone selection drives the server-side render recipe

#### Rendering
- All render logic is server-side only — user never sees prompts
- Backend builds hidden structured prompt from: object type + fabric metadata + room type + input mode
- Two modes: sync (direct response) and async (job queue) — configurable in settings
- Async mode: client polls `GET /api/renders/:jobId/status` every 3 seconds
- Auto-retry once on failure; after max retries → show clean error with retry button
- Successful render stored with before + after URLs

#### Result & History
- Before/After toggle on result screen
- Fabric metadata + disclaimer banner below result
- Download Image (full-resolution) + Download PDF (branded: swatch + room + fabric info)
- Post-render CTAs: Try Another Fabric, Try Another Photo, Request Sample, Start Fresh
- Auto-saved to history
- History: max 30–50 items (configurable), per-customer
- Each history item: thumbnail, fabric code, collection, object type, date, view/delete

---

### Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Collection grid loads in < 2s on 4G mobile |
| Performance | Render initiation response < 1s |
| Performance | Async render completion 30–60s |
| Reliability | 99.5% uptime target |
| Reliability | Graceful degradation if Nano Banana is slow/unavailable |
| Security | All AI API keys remain server-side only |
| Security | Access code validation is server-side only |
| Security | Admin actions are audit-logged |
| Privacy | Uploaded photos deleted after render completes |
| Scalability | Worker scales independently from API |
| PWA | App is installable, caches key assets for offline browsing |
| Accessibility | Keyboard navigation + ARIA on all key screens |
| Browser | Chrome, Safari, Firefox, Edge, Samsung Browser |
| Mobile | iOS 15+, Android 10+ |

---

### MVP Feature Checklist

| Feature | In MVP |
|---|---|
| Access code login | ✅ |
| Collection and fabric browsing | ✅ |
| QR code flow | ✅ |
| Predefined room selection | ✅ |
| Camera and gallery upload | ✅ |
| Sofa rendering | ✅ |
| Curtain rendering | ✅ |
| Rug rendering | ❌ v2 |
| Wallpaper rendering | ❌ v2 |
| Result download (image + PDF) | ✅ |
| History | ✅ |
| Admin full CRUD | ✅ |
| Analytics dashboard | ✅ |
| Storage dashboard | ✅ |
| Settings management | ✅ |
| Credit wallet | ❌ v2 |
| CRM integration | ❌ v2 |
| Multi-brand SaaS mode | ❌ v2 |

---

### Sprint Plan

| Sprint | Week | Scope |
|---|---|---|
| Sprint 0 | Week 1 | Repo setup, monorepo, Docker, schema, CI skeleton |
| Sprint 1 | Week 2 | Auth: access code verify, admin login, JWT, sessions |
| Sprint 2 | Week 3 | Collections + Fabrics CRUD, bulk import, texture processing |
| Sprint 3 | Week 4 | Rooms CRUD, QR resolver, access code management |
| Sprint 4 | Week 5 | Render orchestration: BullMQ, Nano Banana adapter, recipes |
| Sprint 5 | Week 6 | Upload pipeline, visualization history, storage service |
| Sprint 6 | Week 7 | Requests/approvals, analytics events, admin reports |
| Sprint 7 | Week 8 | Customer PWA (Stitch → Antigravity), frontend integration |
| Sprint 8 | Week 9 | Admin UI (Stitch → Antigravity), full panel integration |
| Sprint 9 | Week 10 | QA hardening, mobile testing, security pass, performance |
| Sprint 10 | Week 11 | Pilot rollout, hypercare, UAT, bug-fix burn-down |

---

### Acceptance Criteria

- User can enter a valid 5-digit access code and reach the Choose Your Fabric screen
- User can browse collections, filter by color/quality, and select a fabric
- User can choose a predefined sample room or upload a photo
- User can render sofa and curtain visualizations via Nano Banana 2.0
- User can download the render as image and as branded PDF
- User can view and delete history items (up to configured limit)
- Admin can create a collection, add fabrics with metadata, and mark room as active
- Admin can approve or reject an access code request
- Analytics dashboard shows render counts by date and by collection
- All AI API keys are confirmed absent from any frontend bundle

---

### Delivery Governance

| Cadence | Activity |
|---|---|
| Daily | Stand-up: blockers, progress, deployment status |
| Weekly | Sprint review + client demo of new features |
| Weekly | Backlog refinement: groom next sprint stories |
| Biweekly | RAID log review: risks, assumptions, issues, deps |
| End of sprint | Release readiness checklist before merge to main |

