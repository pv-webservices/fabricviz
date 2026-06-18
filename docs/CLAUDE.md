# FabricViz AI — Claude Code & Antigravity Project Context

> **Always read this file at the start of every session.**  
> This is the master system context for the FabricViz AI Textile Visualizer PWA.  
> All code generation, refactoring, and feature work must conform to this document.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Product name** | FabricViz AI |
| **Type** | Progressive Web App (PWA) — B2B sales tool |
| **Purpose** | Let showroom staff and customers visualize fabric on sofa, curtain, rug, wallpaper without typing AI prompts |
| **AI Engine** | Nano Banana 2.0 Image Generation API (server-side only) |
| **Competitor edge** | Zero-prompt UX, object-aware drape engine, stronger admin control, VPS-only deployment |

---

## 2. Monorepo Structure

```
fabricviz/
├── apps/
│   ├── web/                  → Next.js 14 PWA (customer + admin UI)
│   ├── api/                  → Fastify + TypeScript REST API
│   └── worker/               → BullMQ background render job processor
├── packages/
│   ├── ui/                   → Shared Shadcn/Tailwind component library
│   ├── domain/               → Shared TypeScript types, DTOs, Zod validators
│   └── config/               → Base tsconfig, ESLint, Tailwind config
├── infra/
│   ├── docker-compose.yml    → Full local dev stack
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   │   └── nginx.conf
│   └── postgres/
│       └── init.sql          → Full schema seed
├── docs/
│   ├── CLAUDE.md             → THIS FILE — always load as context
│   ├── PRD-BRD.md            → Product & Business Requirements
│   ├── SCHEMA.md             → Full PostgreSQL schema reference
│   ├── API.md                → Complete API specification
│   └── BLUEPRINT.md          → Enterprise delivery blueprint
├── .env.example
├── .gitignore
├── turbo.json
└── package.json              → pnpm workspace root
```

---

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Shadcn/UI | App Router, PWA via next-pwa |
| **Backend API** | Fastify, TypeScript, Zod | Runs on port 4000 |
| **Worker** | BullMQ + IORedis | Render job processor |
| **Database** | PostgreSQL 16 | Primary data store |
| **Cache / Queue** | Redis 7 | BullMQ queues + session cache |
| **Object Storage** | Cloudflare R2 / MinIO (local) | Fabric textures, room photos, renders |
| **AI Engine** | Nano Banana 2.0 | Server-side ONLY — never exposed to client |
| **Package manager** | pnpm workspaces + Turborepo | |
| **Deploy** | Docker Compose on single VPS + Nginx reverse proxy | |
| **CI/CD** | GitHub Actions | Lint → Test → Build → Deploy |

---

## 4. User Roles

| Role | Access |
|---|---|
| `super_admin` | Full system access, settings, all brands |
| `brand_admin` | Their brand's collections, rooms, customers, analytics |
| `sales_rep` | Read catalog, manage their customers |
| `showroom_user` | Customer-facing app only |
| `customer` | Access via 5-digit code — visualizer only |

---

## 5. Core Customer Flow

```
Enter 5-digit access code
  → Choose Your Fabric screen
    ├── Sofa Collections
    ├── Curtain Collections
    ├── Scan QR Code
    └── View All Fabrics
        → Collection Detail (fabric grid)
            → Fabric Detail (swatch, metadata, Visualize CTA)
                → Upload Screen
                    ├── Choose Sample Room
                    ├── Take Photo (camera)
                    └── Upload from Gallery
                        → Area Selection (if room supports both sofa + curtain)
                            → Rendering (async job, 3s polling)
                                → Result Screen (Before/After, Download, PDF)
                                    → Auto-saved to History
```

---

## 6. Object Types & Rendering Rules

Each object has its own server-side prompt recipe — users NEVER see or write prompts.

| Object | Key Rendering Rules |
|---|---|
| **Sofa** | Preserve arm contours, seat seams, cushion separation, shadow depth. Respect fabric repeat scale + orientation. |
| **Curtain** | Preserve pleats, vertical repeat, fold shadows. Enforce hanging realism. Support closed/semi-open/side-drape rooms. |
| **Rug** *(v2)* | Respect floor perspective and room depth. Apply pile texture with light shading. Keep rug edges aligned with floor. |
| **Wallpaper** *(v2)* | Detect wall planes. Preserve lighting gradients. Support full-wall and feature-wall modes. |

---

## 7. Database Tables (Summary)

Full schema is in `docs/SCHEMA.md` and `infra/postgres/init.sql`.

```
users                  → Admin and staff accounts
access_codes           → 5-digit customer access codes
customer_sessions      → JWT session records
collections            → Fabric collections (sofa/curtain/both)
collection_groups      → Collection categories
fabrics                → Individual fabric SKUs with full metadata
fabric_assets          → Swatch + texture image files
predefined_rooms       → Admin-uploaded sample room photos
room_assets            → Room image variants
visualizations         → Each completed render (before/after URLs)
render_jobs            → Async job queue records
requests               → Access code + quote requests
storage_snapshots      → Daily storage usage records
analytics_events       → All user actions for reporting
app_settings           → Global config (render mode, storage, branding)
audit_logs             → Admin action audit trail
```

---

## 8. API Base URLs

| Environment | API | Web |
|---|---|---|
| Local dev | `http://localhost:4000` | `http://localhost:3000` |
| Production | `https://api.yourdomain.com` | `https://app.yourdomain.com` |

Full API spec is in `docs/API.md`.

---

## 9. Environment Variables

All secrets are in `.env` (never committed). See `.env.example` for all required keys.

```env
# Database
DATABASE_URL=postgresql://fabricviz:password@localhost:5432/fabricviz

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=
JWT_EXPIRY=7d
ADMIN_JWT_SECRET=

# Nano Banana 2.0 (NEVER expose to frontend)
NANO_BANANA_API_KEY=
NANO_BANANA_API_URL=

# Storage (Cloudflare R2 or MinIO)
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=fabricviz

# App
NODE_ENV=development
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 10. Sprint Execution Order

Build in this exact sequence — never start frontend before backend is stable.

| Sprint | Scope |
|---|---|
| **Sprint 0** | Repo setup, Docker Compose, schema init, CI skeleton, env setup |
| **Sprint 1** | Auth service (access code verify, admin login, JWT, session) |
| **Sprint 2** | Collections + Fabrics CRUD, bulk import, texture processing |
| **Sprint 3** | Predefined Rooms CRUD, QR code resolver, Access Code management |
| **Sprint 4** | Render orchestration: job queue, Nano Banana adapter, object recipes |
| **Sprint 5** | Visualization history, storage service, upload pipeline |
| **Sprint 6** | Requests/approvals, analytics events, admin reports |
| **Sprint 7** | Customer PWA (Stitch → Antigravity) — frontend against stable APIs |
| **Sprint 8** | Admin UI (Stitch → Antigravity) — admin panel integration |
| **Sprint 9** | QA hardening, performance, mobile, PWA install, security pass |
| **Sprint 10** | Pilot rollout, hypercare, bug-fix burn-down |

---

## 11. Coding Standards

- **TypeScript strict mode** everywhere — no `any` types
- **Zod** for all API input validation (never trust raw request body)
- **Database access** via raw `pg` or `postgres.js` — no ORM (keep SQL visible)
- **Error handling**: All API errors return `{ success: false, error: { code, message } }`
- **Success responses**: All return `{ success: true, data: {...} }`
- **File naming**: `kebab-case` for files, `PascalCase` for components, `camelCase` for functions
- **Environment**: All secrets via env vars — never hardcode
- **AI prompts**: All Nano Banana prompt templates live in `apps/worker/src/recipes/` — never in frontend or routes

---

## 12. Nano Banana Integration Rules

- API key and all prompt logic live in `apps/worker/src/services/nano-banana.ts` ONLY
- Frontend never calls Nano Banana directly
- Frontend calls `POST /api/renders` → API creates a BullMQ job → Worker processes it
- Worker builds the prompt using object-type recipe + fabric metadata + room metadata
- Frontend polls `GET /api/renders/:jobId/status` every 3 seconds
- On success: worker saves before/after URLs to `visualizations` table
- On failure: worker retries once automatically, then marks job as `failed`

---

## 13. Current Task (Sprint 0)

When starting a new session in Antigravity IDE or Claude Code, run these tasks first:

1. Initialize pnpm workspace with Turborepo
2. Scaffold `apps/api` as Fastify + TypeScript app
3. Scaffold `apps/web` as Next.js 14 app with Tailwind + Shadcn
4. Scaffold `apps/worker` as BullMQ worker app
5. Create shared `packages/domain` with base TypeScript types
6. Write `infra/docker-compose.yml` with postgres, redis, api, worker, minio, nginx
7. Write `infra/postgres/init.sql` with full schema (see SCHEMA.md)
8. Write `.env.example` with all required keys
9. Setup GitHub Actions CI workflow (lint + typecheck on PR)
10. Verify `docker compose up` starts all services successfully

---

## 14. Definition of Done (Per Feature)

- [ ] TypeScript strict, no build errors
- [ ] Zod validation on all inputs
- [ ] Unit tests for business logic functions
- [ ] API returns consistent `{ success, data/error }` shape
- [ ] No secrets or AI prompts in frontend code
- [ ] Works at 375px mobile and 1280px desktop
- [ ] Passes ESLint with zero warnings

