# FabricViz AI — Project Folder Structure Guide

This shows the EXACT folder structure to create manually in your local project before running the Claude Code setup prompt.

## What to Create Manually RIGHT NOW

Open your project folder in Antigravity IDE and create this structure:

```
fabricviz/                        ← your root folder (already created)
└── docs/                         ← CREATE THIS FOLDER
    ├── CLAUDE.md                 ← PASTE content from CLAUDE.md
    ├── PRD-BRD.md                ← PASTE content from PRD-BRD.md
    └── SETUP-PROMPT.md           ← PASTE content from SETUP-PROMPT.md
```

That's it. Everything else (apps/, packages/, infra/, etc.) is created by Claude Code when you run the Sprint 0 setup prompt.

---

## After Claude Code Runs Sprint 0

Your folder will look like this:

```
fabricviz/
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config.ts
│   │   │   ├── index.ts
│   │   │   ├── plugins/
│   │   │   │   ├── cors.ts
│   │   │   │   ├── database.ts
│   │   │   │   ├── jwt.ts
│   │   │   │   └── redis.ts
│   │   │   └── routes/
│   │   │       └── health.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/
│   │   ├── public/
│   │   │   ├── manifest.json
│   │   │   └── sw.js
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── (admin)/admin/page.tsx
│   │   │       ├── (customer)/login/page.tsx
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── worker/
│       ├── src/
│       │   ├── index.ts
│       │   ├── queues/render-queue.ts
│       │   ├── recipes/
│       │   │   ├── curtain-recipe.ts
│       │   │   └── sofa-recipe.ts
│       │   ├── services/nano-banana.ts
│       │   └── workers/render-worker.ts
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
├── docs/
│   ├── BLUEPRINT.md              ← (from attachment)
│   ├── CLAUDE.md                 ← system context
│   ├── PRD-BRD.md                ← product requirements
│   └── SETUP-PROMPT.md           ← build prompts
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   │   └── nginx.conf
│   └── postgres/
│       └── init.sql
├── packages/
│   ├── config/
│   │   ├── eslint.config.js
│   │   ├── tailwind.config.base.js
│   │   └── tsconfig.json
│   └── domain/
│       ├── src/
│       │   └── types/
│       │       └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── .env.example
├── .gitignore
├── package.json
└── turbo.json
```

---

## Step-by-Step: How to Start Right Now

### Step 1 — Create docs folder manually
In Antigravity IDE file tree, right-click → New Folder → `docs`

### Step 2 — Add the 3 documents
Create `CLAUDE.md`, `PRD-BRD.md`, `SETUP-PROMPT.md` in the docs folder and paste the content from the shared files.

### Step 3 — Open Claude Code in your terminal
```bash
cd /path/to/fabricviz
claude
```

### Step 4 — Paste the Sprint 0 Setup Prompt
Open SETUP-PROMPT.md, copy the block under "CLAUDE CODE SETUP PROMPT (Sprint 0)", and paste it into Claude Code.

### Step 5 — Wait for scaffold to complete
Claude Code will create all files, install dependencies, and set up Docker services.

### Step 6 — Copy .env.example to .env and fill in values
```bash
cp .env.example .env
# Edit .env with your actual secrets
```

### Step 7 — Start all services
```bash
docker compose up --build
```

### Step 8 — Verify everything is running
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Step 9 — Initialize GitHub repo
```bash
git init
git add .
git commit -m "chore: Sprint 0 — project scaffold and monorepo setup"
git remote add origin https://github.com/YOUR_USERNAME/fabricviz.git
git push -u origin main
```

---

## Tools Setup Checklist

Before running anything, make sure you have these installed:

- [ ] **Node.js** v20+ (`node --version`)
- [ ] **pnpm** v9+ (`pnpm --version` or `npm install -g pnpm`)
- [ ] **Docker Desktop** or Docker Engine + Compose v2
- [ ] **Claude Code** CLI (`claude --version`)
- [ ] **Git** (`git --version`)
- [ ] **Antigravity IDE** (already open)

