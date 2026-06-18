# FabricViz AI — Project Setup Prompt
## Use this prompt in Claude Code or Antigravity IDE to scaffold Sprint 0

---

## 🚀 CLAUDE CODE SETUP PROMPT (Sprint 0)

Copy and paste this into Claude Code to initialize the full project:

```
You are building FabricViz AI — a zero-prompt AI fabric visualization PWA for textile showrooms.

Read docs/CLAUDE.md first. That is your permanent system context. Follow every rule in it.

Your task is Sprint 0: set up the full monorepo from scratch. The folder is already created and open in Antigravity IDE. Do the following steps in order:

STEP 1 — Initialize pnpm workspace + Turborepo
- Create root package.json with pnpm workspaces config pointing to apps/* and packages/*
- Create turbo.json with build, dev, lint, typecheck pipeline
- Create .gitignore (Node, Next.js, env files, dist, .turbo)
- Create .env.example with ALL required env variables (see CLAUDE.md section 9)

STEP 2 — Create packages/domain
- Init package with TypeScript strict mode
- Create src/types/index.ts with core shared types:
  - User, AccessCode, CustomerSession
  - Collection, Fabric, FabricFeatureFlags
  - PredefinedRoom
  - Visualization, RenderJob, RenderStatus
  - Request, AnalyticsEvent, AppSettings
  - ApiResponse<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } }
- Export all types from index

STEP 3 — Create packages/config
- Base tsconfig.json (strict mode, ES2022, bundler moduleResolution)
- eslint.config.js base (TypeScript + import rules)
- tailwind.config.base.js

STEP 4 — Scaffold apps/api (Fastify backend)
- Init with TypeScript, Fastify, @fastify/cors, @fastify/jwt, @fastify/multipart
- Add zod, postgres (pg), ioredis, bullmq as dependencies
- Create src/index.ts — Fastify server on PORT env var (default 4000)
- Create src/plugins/ — cors.ts, jwt.ts, database.ts, redis.ts
- Create src/routes/ — health.ts (GET /health → { status: 'ok', timestamp })
- Create src/config.ts — typed env validation using zod
- Create Dockerfile for production build

STEP 5 — Scaffold apps/worker (BullMQ processor)
- Init with TypeScript, bullmq, ioredis
- Create src/index.ts — connects to Redis, registers render queue worker
- Create src/queues/render-queue.ts — queue definition with name 'render-jobs'
- Create src/workers/render-worker.ts — skeleton processor that logs job data
- Create src/recipes/ folder with empty files: sofa-recipe.ts, curtain-recipe.ts
- Create src/services/nano-banana.ts — skeleton provider adapter (API key from env)
- Create Dockerfile

STEP 6 — Scaffold apps/web (Next.js 14 PWA)
- Init Next.js 14 with App Router, TypeScript, Tailwind CSS
- Install shadcn/ui, next-pwa, lucide-react
- Create src/app/layout.tsx with base HTML shell, metadata, viewport
- Create src/app/page.tsx — simple redirect to /login
- Create src/app/(customer)/login/page.tsx — skeleton access code entry page
- Create src/app/(admin)/admin/page.tsx — skeleton admin dashboard
- Create public/manifest.json — PWA manifest (name: FabricViz AI, theme: #01696f)
- Create public/sw.js placeholder
- Create next.config.ts with next-pwa config

STEP 7 — Create infra/docker-compose.yml
Services:
  postgres:
    image: postgres:16-alpine
    env: POSTGRES_DB=fabricviz, POSTGRES_USER=fabricviz, POSTGRES_PASSWORD from env
    volumes: postgres_data:/var/lib/postgresql/data
    ports: 5432:5432
    healthcheck: pg_isready

  redis:
    image: redis:7-alpine
    ports: 6379:6379
    volumes: redis_data:/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: 9000:9000, 9001:9001
    env: MINIO_ROOT_USER, MINIO_ROOT_PASSWORD
    volumes: minio_data:/data

  api:
    build: ./apps/api
    ports: 4000:4000
    env_file: .env
    depends_on: postgres, redis
    volumes: .:/app (dev only)

  worker:
    build: ./apps/worker
    env_file: .env
    depends_on: postgres, redis

  nginx:
    image: nginx:alpine
    ports: 80:80
    volumes: ./infra/nginx/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on: api

volumes: postgres_data, redis_data, minio_data

STEP 8 — Create infra/postgres/init.sql
Write the complete PostgreSQL schema with these tables (full DDL):

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','brand_admin','sales_rep','showroom_user')),
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(5) UNIQUE NOT NULL,
  customer_name TEXT,
  company_name TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  render_count INTEGER DEFAULT 0,
  credit_limit INTEGER DEFAULT 100,
  credits_used INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id UUID REFERENCES access_codes(id),
  token_hash TEXT NOT NULL,
  device_fingerprint TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  group_id UUID REFERENCES collection_groups(id),
  end_use TEXT NOT NULL CHECK (end_use IN ('sofa','curtain','rug','wallpaper','both')),
  qr_code TEXT,
  qr_url TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  swatch_url TEXT,
  texture_url TEXT,
  color_family TEXT,
  quality TEXT,
  tags TEXT[],
  end_use TEXT NOT NULL CHECK (end_use IN ('sofa','curtain','rug','wallpaper','both')),
  repeat_width_mm NUMERIC,
  repeat_height_mm NUMERIC,
  fabric_width_cm NUMERIC,
  price_inr NUMERIC,
  feature_flags JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE predefined_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  end_use TEXT NOT NULL CHECK (end_use IN ('sofa','curtain','both')),
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id UUID REFERENCES access_codes(id),
  fabric_id UUID REFERENCES fabrics(id),
  room_id UUID REFERENCES predefined_rooms(id),
  uploaded_photo_url TEXT,
  object_type TEXT NOT NULL CHECK (object_type IN ('sofa','curtain','rug','wallpaper')),
  source_type TEXT NOT NULL CHECK (source_type IN ('template','predefined_room','upload','camera')),
  before_url TEXT,
  after_url TEXT,
  pdf_url TEXT,
  render_job_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visualization_id UUID REFERENCES visualizations(id),
  queue_job_id TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed','retrying')),
  attempt_count INTEGER DEFAULT 0,
  error_message TEXT,
  provider TEXT DEFAULT 'nano_banana',
  prompt_used TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('access_code_request','quote_request','sample_request')),
  name TEXT,
  company TEXT,
  phone TEXT,
  email TEXT,
  fabric_id UUID REFERENCES fabrics(id),
  visualization_id UUID REFERENCES visualizations(id),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  handled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  access_code_id UUID REFERENCES access_codes(id),
  fabric_id UUID REFERENCES fabrics(id),
  collection_id UUID REFERENCES collections(id),
  visualization_id UUID REFERENCES visualizations(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fabrics_collection ON fabrics(collection_id);
CREATE INDEX idx_fabrics_end_use ON fabrics(end_use);
CREATE INDEX idx_visualizations_access_code ON visualizations(access_code_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_render_jobs_status ON render_jobs(status);

-- Default settings seed
INSERT INTO app_settings (key, value) VALUES
  ('site_name', 'FabricViz AI'),
  ('support_email', ''),
  ('support_whatsapp', ''),
  ('render_mode', 'async'),
  ('storage_mode', 'cloud'),
  ('history_limit', '50'),
  ('tutorial_video_url', '');

STEP 9 — Create infra/nginx/nginx.conf
- Proxy /api/* to http://api:4000
- Proxy /* to http://web:3000 (when web service is added)
- Set client_max_body_size 20m (for room photo uploads)
- Add gzip compression

STEP 10 — Create GitHub Actions CI workflow
File: .github/workflows/ci.yml
- Trigger on: push to main, pull_request to main
- Jobs: lint (pnpm lint), typecheck (pnpm typecheck), build (pnpm build)
- Use pnpm/action-setup@v3 with pnpm version 9
- Cache: ~/.pnpm-store

After all steps complete, run:
  docker compose up --build

And verify:
  curl http://localhost:4000/health → { "status": "ok" }
  Postgres is accepting connections
  Redis is running
  MinIO console is accessible at http://localhost:9001

Report any errors and fix them before finishing.
```

---

## 🎨 ANTIGRAVITY IDE — First UI Session Prompt (Sprint 7)

> Use this AFTER backend APIs are stable (Sprint 6 complete)

```
You are building the customer-facing PWA for FabricViz AI.

Read docs/CLAUDE.md and docs/PRD-BRD.md first. These are your permanent context.

The backend API is running at http://localhost:4000. All API contracts are defined in docs/API.md.

Your task is to build the Customer PWA screens in apps/web using Next.js 14 App Router + Tailwind + Shadcn/UI.

Design system:
- Primary color: #01696f (Hydra Teal)
- Background: #f7f6f2 (warm beige)
- Font: Satoshi (Fontshare) for body, display weights for headings
- Radius: consistent 0.75rem on cards, 9999px on pills
- Mobile-first: design at 375px, expand to 1280px
- Dark mode: support via data-theme toggle
- No gradient buttons — solid accent color only
- No colored side borders on cards — use surface elevation

Build these screens in order:

SCREEN 1 — /login (Access Code Entry)
- Large centered 5-digit OTP input (5 separate boxes)
- "Remember this device" checkbox
- "Request Access Code" link → /request-code
- Primary button: "Enter Showroom"
- Calls POST /api/auth/verify-code
- On success: stores JWT in memory, redirects to /choose-fabric
- Loading state on button, clear error message on invalid code
- FabricViz AI logo SVG at top

SCREEN 2 — /choose-fabric (Entry Hub)
- Top: greeting with customer name (from JWT)
- 4 large tap cards in 2x2 grid:
  → Sofa Collections (sofa icon)
  → Curtain Collections (curtain icon)
  → Scan QR Code (qr-code icon)
  → View All Fabrics (grid icon)
- Bottom: "Your History" shortcut link
- Logout button in header

SCREEN 3 — /collections/sofa and /collections/curtain
- Filter bar: color family chips, quality dropdown, search input
- Fabric collection cards: thumbnail, name, fabric count badge
- Tap → goes to /collections/:id

SCREEN 4 — /collections/:id (Collection Detail)
- Collection hero: thumbnail, name, description
- Fabric grid: swatch image, fabric name, code, color chip, feature badges
- Search + filter within collection
- Each fabric card: tap → /fabrics/:id

SCREEN 5 — /fabrics/:id (Fabric Detail)
- Full swatch image (square, 1:1)
- Fabric name + code + collection name
- Metadata row: color family, quality, end-use
- Feature flag badges (pill chips): High Martindale, Fade Resistant, etc.
- Repeat dimensions + fabric width + price
- Large CTA button: "Visualize This Fabric" → /upload?fabricId=:id

SCREEN 6 — /upload (Room Selection + Upload)
- 3 tabs: Sample Room | Take Photo | Upload from Gallery
- Sample Room tab: grid of predefined rooms (filtered by fabric end-use)
  → Calls GET /api/rooms?endUse=sofa
  → Each room card: thumbnail, name, tap to select
- Take Photo: opens device camera via <input type="file" capture="environment">
- Upload Gallery: opens file picker, JPEG/PNG only, max 10MB
- Fabric summary card pinned at bottom: swatch thumbnail, name, code
- "Proceed to Render" button → triggers area selection if needed, else starts render

SCREEN 7 — /select-area (Zone Selector — shown only if room supports both)
- Split-screen illustration: left = sofa zone, right = curtain zone
- Tap to highlight selection
- "Apply Fabric Here" CTA → starts render

SCREEN 8 — /rendering (Progress Screen)
- Fabric swatch + room thumbnail shown as "before" preview
- Animated progress indicator (not a spinner — show a pulsing overlay on the room image)
- Elapsed timer: "Generating... 12s"
- Polls GET /api/renders/:jobId/status every 3 seconds
- On complete → auto-navigates to /result/:visualizationId
- On failure → shows error with Retry button

SCREEN 9 — /result/:id (Result Screen)
- Before/After toggle (swipe OR button tap)
- Full-screen result image
- Fabric info bar: swatch, name, code
- Disclaimer: "AI-generated visualization for reference only"
- Action bar (bottom sticky):
  → Download Image
  → Download PDF
  → Try Another Fabric
  → Request Sample (→ opens modal with name/phone form)
- Auto-saves to history (confirmed via API)

SCREEN 10 — /history (Render History)
- Grid of past renders: after-image thumbnail, fabric name, collection, date
- Tap → opens full result modal
- Delete icon per card → calls DELETE /api/visualizations/:id with confirm dialog
- Empty state: "No visualizations yet. Start by choosing a fabric."
- Max items shown: from app settings (30 or 50)

For all screens:
- Add skeleton loaders while data loads (shimmer effect, matching layout)
- Add empty states with warm message + primary action
- Add error states with retry button
- All images: loading="lazy", width, height set
- Touch targets minimum 44x44px
- No hover-only interactions
- Bottom navigation bar on mobile: Home | Collections | QR | History
```

---


