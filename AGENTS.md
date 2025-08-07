# Slice Guard Project Guide

## Overview

Slice Guard is a monorepo for managing 3D‑print lab requests. The repository is divided into three workspaces under `slice-guard/`:

- **backend** – Bun‑based REST and WebSocket API server backed by PostgreSQL and S3‑compatible object storage.
- **frontend** – Vue 3 + Vite + Tailwind CSS client.
- **shared** – TypeScript types and payload definitions reused by the backend and frontend via the `@shared/*` path alias.

## Project Structure

```
slice-guard/
├── backend/   Bun server, SQL access layer and WebSocket handlers
├── frontend/  Vue application, Pinia stores and services
└── shared/    Common DB models and payload interfaces
```

### Backend Highlights

- `src/db` – database queries for labs, users, requests, etc.
- `src/http` – HTTP route handlers.
- `src/ws` – WebSocket entry points; events documented in `backend/WS_ROUTES.md`.
- `src/utils` – helpers such as JWT handling, hashing, permission checks, in‑memory `State` and lab state loaders.
- `src/three-parser` – utilities for unpacking and inspecting `.3mf` files (requires the `unzip` binary).
- `schema` – SQL schema and numbered migrations (`schema/migrations`). Combined schemas (`auth.sql`, `lab.sql`) reflect all migrations.
- `tests` – Bun tests covering DB access, HTTP routes and utilities.

### Frontend Highlights

- `src/components` – reusable Vue components.
- `src/views` – route views (login, registration, lab dashboard, print requests, etc.).
- `src/store` – Pinia stores (`auth.ts`, `labs.ts`).
- `src/services` – API wrapper, auth utilities and WebSocket client.
- `src/modals` – modal components for invites, settings and account management.
- `src/utils` – small utilities such as permission helpers.

### Shared Module

- `db` – shared TypeScript interfaces for database tables.
- `payloads` – HTTP and WebSocket payload definitions.
- `ws` – shared WebSocket error codes.

## Development Standards

- Code is written in **TypeScript** with ES modules. Avoid `any`; prefer explicit types.
- **Comment and document all changes**. Functions, classes and non‑trivial logic should have JSDoc/TSDoc style comments for clarity.
- Use Prettier for formatting (`bun run format` or `bun run format:check`).
- Use ESLint to enforce code style (`bun run lint`).
- Pre‑commit hooks run `lint-staged` to auto‑format staged files.
- Styling on the frontend uses Tailwind CSS; keep components modular and maintainable.

### Database Changes

When modifying the database:

1. Create a migration in `backend/schema/migrations` with the next sequential number.
2. Update the aggregated schema files (`backend/schema/*.sql`).
3. Adjust shared types in `shared/db` and any related payloads.
4. Provide comments in the migration explaining the intent.

### Shared/Frontend/Backend Interaction

- Shared code is imported using the `@shared/*` alias configured in `tsconfig` files.
- Backend and frontend should remain in sync with shared types and payloads; update both sides when shared interfaces change.
- WebSocket events follow the op‑code definitions in `shared/payloads/ws.ts` and `backend/WS_ROUTES.md`.

## Caching and State

- The backend maintains an in‑memory `State` (`backend/src/utils/state.ts`) that holds the database connection, logger and active WebSocket connections.
- `backend/src/utils/lab_state.ts` loads lab data (roles, members, tags, invites, requests) to broadcast over websockets.
- No external cache is currently implemented. The project plans to use Redis for caching/session management; if adding caching, document the approach and ensure proper invalidation when data changes.

## Running & Testing

- Install dependencies: `bun install` (root) or `bun install --cwd <workspace>`.
- Lint code: `bun run lint`.
- Format check: `bun run format:check`.
- Run tests:
    - Backend: `bun run --cwd slice-guard/backend test`.
    - Root: `bun run test` (runs backend tests and attempts frontend tests; frontend currently has no test script).
- Build both workspaces: `bun run build`.
- Local environment: copy `.env.example` to `.env` and run `docker compose up --build` to start PostgreSQL, MinIO and the backend service. The backend listens on port `3000` and the frontend on `5173`.

## Additional Notes

- Keep README or other documentation updated when adding significant features.
- For file uploads, `utils/storage.ts` gzips print request files before storing them in the database.
- Object storage endpoints are configured via environment variables (`S3_ENDPOINT`, `S3_BUCKET`, etc.).

By following this guide and keeping changes well commented and tested, contributors can extend Slice Guard while preserving consistency across the backend, frontend and shared modules.
