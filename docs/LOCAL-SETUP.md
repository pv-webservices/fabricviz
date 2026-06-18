# FabricViz AI Local Setup

This guide will walk you through setting up the FabricViz AI project on your local machine.

## Prerequisites

- **Node.js**: v20+
- **pnpm**: v9+ (`npm install -g pnpm`)
- **Docker Desktop**: Required for running PostgreSQL and Redis locally

## Environment Setup

1. Copy `.env.example` to `.env` in the root of the project:
   ```bash
   cp .env.example .env
   ```
   *Note: Default mock values are provided for `NANO_BANANA_API_KEY` and `STORAGE_MODE=local` should be used.*

2. Create `apps/web/.env.local`:
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > apps/web/.env.local
   ```

## Install Dependencies

Run the following command in the root directory to install all monorepo dependencies. If you encounter issues with native dependencies (e.g., esbuild), use `--ignore-scripts`.

```bash
pnpm install
# OR
pnpm install --ignore-scripts
```

## Database and Redis Setup

1. Start the Docker containers for Postgres and Redis:
   ```bash
   docker-compose up -d
   ```

2. The `docker-compose.yml` mounts `infra/postgres/init.sql` which automatically provisions the schema and seed data (including the default admin user) on the first start.

   **Admin Credentials:**
   - Email: `admin@fabricviz.com`
   - Password: `Admin@1234`

3. (Optional) If you have made schema changes or need to run migrations manually, you can run:
   ```bash
   pnpm run typecheck # ensure the API builds
   cd apps/api
   npx ts-node src/run-migrations.ts
   ```

4. You can also seed additional developer data by running the dev seed script:
   ```bash
   pnpm run seed
   ```

## Running the Application

To start the whole application (Web, API, and Worker) in development mode, run:

```bash
pnpm run dev
```

This uses Turborepo to start the following services concurrently:
- **API Server** (`apps/api`): http://localhost:4000
- **Web App** (`apps/web`): http://localhost:3000
- **Worker** (`apps/worker`): Runs in the background connecting to Redis

## Troubleshooting

- **Redis Connection Errors**: If the worker fails to connect, ensure your local Redis container is running on port `6379`.
- **Database Connection Errors**: Ensure Postgres is running on port `5432` with username `fabricviz` and password `password`.
- **Typecheck Errors**: Before committing, run `pnpm run typecheck` and `pnpm run lint` from the root to ensure all packages pass validation.
