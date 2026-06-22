# FabricViz Development Guide

This monorepo uses Turborepo and pnpm to manage multiple applications.

## Apps
- `apps/website`: The marketing website (`@fabricviz/website`) running on port **5173**.
- `apps/web`: The main visualizer application running on port **3000**.
- `apps/api`: The backend API.
- `apps/worker`: Background worker processes.

## Running Locally

To start all applications simultaneously, run the following command from the root directory:

```bash
pnpm dev
```

This will automatically spin up the website, visualizer app, and the API. 
The marketing website will be accessible at `http://localhost:5173` and will have its primary call-to-action buttons wired to the visualizer app at `http://localhost:3000`.

## Production Deployment

When deploying to production, deploy each app to its respective domain:
- `apps/website` -> `fabricviz.com` or `www.fabricviz.com` (Main Marketing Site)
- `apps/web` -> `app.fabricviz.com` (Visualizer Application)

Make sure to set the `VITE_APP_URL` environment variable for `apps/website` in production to point to the actual visualizer app domain (e.g., `https://app.fabricviz.com`).
