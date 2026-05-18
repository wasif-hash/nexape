# Nexape — Mini CRM Lead Manager

A take-home submission for the Naxape MERN Stack Developer Intern position. A small-but-complete Lead Management CRM with authentication, search/filter, optimistic updates, and basic analytics.

## Live deployment

| Layer | Provider | URL / Endpoint |
|---|---|---|
| **Frontend** | Vercel | https://nexape-y1hu.vercel.app |
| **Backend API** | Vercel (serverless function) | https://nexape.vercel.app |
| **Health probe** | Vercel | https://nexape.vercel.app/health |
| **Database** | Neon (Postgres) | `ep-restless-truth-aomcggb4-pooler.c-2.ap-southeast-1.aws.neon.tech` (private — pooled endpoint, accessed via Neon's serverless driver) |

Both apps deployed on **Vercel**. The database is **Neon serverless Postgres** in `ap-southeast-1`, connected via `@prisma/adapter-neon` over HTTP/WebSocket — no engine binary, no TCP pool, fast cold starts.

> **Try it:** open the frontend, register a new account, add a few leads, change their status from the inline dropdown, and watch the dashboard donut + counters update **instantly** (optimistic mutations with server reconciliation).

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Language | **TypeScript** (frontend + backend) | End-to-end type safety; Zod schemas inferred into TS types |
| Backend | **Express 4** | Pure Express as required by the brief; layered into routes → controllers → services |
| Database | **PostgreSQL** on **Neon** | Managed, serverless-friendly; replaced MongoDB per requirements |
| ORM | **Prisma 7** + `@prisma/adapter-neon` | Typed queries, migrations, native serverless driver (no engine binary, fast cold starts) |
| Auth | **JWT** (HS256, 15-min access tokens) | Bearer token in `Authorization` header; password hashed with bcrypt (cost 12) |
| Validation | **Zod** | Single source of truth for request bodies, query params, and frontend forms |
| Frontend | **React 18** + **Vite** | Modern SPA, fast dev server, type-checked build |
| Routing | **react-router-dom v6** | Client-side routes + protected routes via auth store |
| Styling | **Tailwind CSS** | Hand-rolled UI primitives (Button, Input, Card, Dialog, Badge, Select) in a shadcn-style layout |
| Server state | **TanStack Query v5** | Optimistic mutations for instant UI; automatic cache invalidation |
| Forms | **react-hook-form** + `@hookform/resolvers/zod` | Zod schema → resolver → inline field-level errors |
| Client store | **Zustand** | Lightweight persisted auth store (token + user) |
| Charts | **Recharts** | One donut showing lead status breakdown |
| Security | **helmet**, **CORS** (single-origin), JSON body limit, `trust proxy` | OWASP baseline |

## Repository layout

```
nexape/
├── server/                 # Express API (deployed as Vercel serverless function)
│   ├── api/index.ts        # Vercel function entrypoint — exports the Express app
│   ├── src/
│   │   ├── index.ts        # local-dev entrypoint (tsx watch)
│   │   ├── app.ts          # Express app factory + middleware
│   │   ├── env.ts          # Zod-validated process.env
│   │   ├── db.ts           # Prisma client w/ Neon driver adapter
│   │   ├── shared/         # Zod schemas (mirrored in web/)
│   │   ├── middleware/     # auth, validate, error
│   │   └── modules/        # auth/, leads/, analytics/ — each: routes → controller → service
│   ├── prisma/             # schema + migrations
│   ├── prisma.config.ts    # Prisma 7 config (DATABASE_URL via env)
│   └── vercel.json         # Routes / → /api
│
└── web/                    # React SPA (Vite, deployed on Vercel)
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── shared/         # mirrored Zod schemas
    │   ├── lib/            # api fetch wrapper, auth-store (Zustand)
    │   ├── hooks/          # useLeads, useLeadMutations (optimistic), useAnalytics
    │   ├── components/
    │   │   ├── ui/         # Button, Input, Dialog, Card, Badge, Select, Label
    │   │   └── leads/      # LeadsTable, LeadsFilters, AddLeadDialog, LeadStatusSelect
    │   └── pages/          # LoginPage, RegisterPage, DashboardPage
    └── vercel.json         # SPA fallback to index.html
```

The two folders are fully independent — no monorepo tooling, no workspaces, no shared `node_modules`. Each can be cloned, installed, and deployed on its own.

## API

All endpoints return JSON. Protected routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET`    | `/health` | – | Liveness probe |
| `POST`   | `/api/auth/register` | – | Create user → `{ user, accessToken }` |
| `POST`   | `/api/auth/login` | – | Login → `{ user, accessToken }` |
| `GET`    | `/api/auth/me` | ✓ | Current user |
| `GET`    | `/api/leads?page&pageSize&search&status` | ✓ | Paginated, searchable, status-filtered list |
| `POST`   | `/api/leads` | ✓ | Create lead |
| `PATCH`  | `/api/leads/:id` | ✓ | Update any subset of fields (used for status change) |
| `DELETE` | `/api/leads/:id` | ✓ | Delete lead |
| `GET`    | `/api/analytics/summary` | ✓ | `{ total, byStatus, last7Days }` |

**Error shape** is uniform: `{ message, fieldErrors? }`. Zod failures → `400` with field-level errors keyed by path. Unique-constraint conflicts → `409` with the same shape. Auth failures → `401`.

## Data model

```prisma
enum LeadStatus { NEW CONTACTED CONVERTED }

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // bcrypt(12)
  createdAt DateTime @default(now())
  leads     Lead[]   @relation("AssignedLeads")
}

model Lead {
  id           String     @id @default(cuid())
  name         String
  email        String
  phone        String
  status       LeadStatus @default(NEW)
  assignedToId String?
  assignedTo   User?      @relation("AssignedLeads", fields: [assignedToId], references: [id], onDelete: SetNull)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  @@index([status])
  @@index([createdAt])
}
```

`assignedTo` was specified as `String` in the brief — modeled here as a relation to `User` for referential integrity. The API still returns assignee name/email inline.

## Local setup

Requires Node 20+. Frontend and backend run independently — two terminals.

### Backend

```bash
cd server
cp .env.example .env
# edit .env — set DATABASE_URL (Postgres), JWT_SECRET, WEB_ORIGIN

npm install                      # also runs `prisma generate` via postinstall
npm run prisma:migrate            # applies migrations to the DB
npm run dev                       # API on http://localhost:4000
```

### Frontend

```bash
cd web
cp .env.example .env              # set VITE_API_URL=http://localhost:4000
npm install
npm run dev                       # web on http://localhost:5173
```

Open http://localhost:5173 and register.

## Deployment

Both apps are deployed as **two separate Vercel projects** pointing at the same GitHub repo, with different **Root Directory** values.

### `nexape-web` (frontend)

| Setting | Value |
|---|---|
| Root Directory | `web` |
| Framework Preset | Vite (auto-detected) |
| Build / Install / Output | Default |
| Env var | `VITE_API_URL` = `https://nexape.vercel.app` |

[web/vercel.json](web/vercel.json) handles SPA fallback so all client routes resolve to `index.html`.

### `nexape-server` (backend)

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Framework Preset | Other |
| Build / Install / Output | Default |

Env vars (all Production, marked Sensitive):

| Key | Value |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection URL |
| `JWT_SECRET` | 32-byte random hex |
| `WEB_ORIGIN` | `https://nexape-y1hu.vercel.app` |
| `NODE_ENV` | `production` |

The Express app is wrapped as a Vercel serverless function via [server/api/index.ts](server/api/index.ts) and routed by [server/vercel.json](server/vercel.json). Cold starts stay fast because the Neon serverless driver opens connections over HTTP/WebSocket — no engine binary, no TCP pool.

### Database migrations

Migrations are applied from a local machine against the Neon instance:

```bash
cd server
npm run prisma:deploy
```

Vercel doesn't run migrations on deploy — this keeps schema changes intentional and decoupled from app deploys.

## Approach

A few high-level decisions that shaped the project, ordered by impact:

### 1. End-to-end TypeScript with Zod as the single source of truth
The same Zod schema is used to validate an incoming HTTP request on the server *and* to parse a `react-hook-form` form on the client. TypeScript types are inferred from the schemas (`z.infer<…>`), so renaming a field, tightening a constraint, or adding a new status surfaces as a compile error in every file that touches it. This is the closest you can get to "change one thing, fix the rest" in a JS stack.

### 2. Layered backend, not a flat handler file
Each domain module is structured `routes → controller → service`:
- **Routes** wire URLs to validation middleware and a controller method.
- **Controllers** are intentionally thin — read inputs, call a service, send a response.
- **Services** own business logic and Prisma calls — pure async functions, easy to unit-test without booting Express.

A single central error-handling middleware ([server/src/middleware/error.ts](server/src/middleware/error.ts)) maps `ZodError`, `HttpError`, and Prisma error codes (`P2002`, `P2025`) to consistent JSON responses with field-level errors. Individual handlers never format their own errors.

### 3. Optimistic mutations for the "instant UI" requirement
The brief asked for instant updates. The naive way is to refetch after every mutation; that's slow and feels server-bound. Instead, TanStack Query's `onMutate` hook writes the change into both the `['leads']` and `['analytics']` caches synchronously, so the UI updates before the server replies. `onError` rolls back via the snapshot; `onSettled` invalidates the queries to reconcile with server state. The badge color flips and the donut chart re-segments **before** the network round-trip completes. See [web/src/hooks/useLeadMutations.ts](web/src/hooks/useLeadMutations.ts).

### 4. Postgres on Neon, with Prisma's serverless driver
The brief originally said MongoDB, but Postgres was specified. Neon is the right managed Postgres for this stack because it offers a **serverless driver** (`@neondatabase/serverless` + `@prisma/adapter-neon`) that talks to the database over HTTP/WebSocket, not raw TCP. This matters on Vercel: serverless functions can't maintain a long-lived connection pool, so a traditional driver would burn ~300 ms per request opening a fresh TCP connection. The Neon adapter sidesteps that, and Prisma 7's adapter API means we don't need to ship the Prisma query engine binary in the function bundle — smaller bundle, faster cold start.

### 5. Validated environment at boot
[server/src/env.ts](server/src/env.ts) runs `process.env` through a Zod schema before anything else loads. A misconfigured deploy crashes immediately with a readable list of missing/invalid keys, instead of failing mysteriously on the first request that needs `JWT_SECRET`. This is a small thing but it saves real debugging time in production.

### 6. Security baseline, not security theatre
- `helmet` for sensible default headers
- `cors` locked to a single `WEB_ORIGIN`, configured via env so dev and prod differ
- `express.json({ limit: '100kb' })` to cap payload size
- `bcrypt` cost 12 for passwords (never returned in any response)
- JWT signed with HS256, 15-minute expiry, no refresh tokens (documented trade-off below)
- `app.set('trust proxy', 1)` for the Vercel edge

### 7. No tests in this commit — deliberate
Services are pure async functions over Prisma, so the architecture is testable (Vitest + Supertest would cover the API in an afternoon, RTL the dashboard). For a take-home I'd rather submit a polished, working surface than a 40%-covered suite. The harness is ready when scope allows.

### 8. Front-end state model
Three layers, each used for what it's best at:
- **TanStack Query** for server state (leads list, analytics, current user)
- **Zustand** for client state (access token + user; persisted to localStorage so a refresh keeps you signed in)
- **react-hook-form** for form state, with Zod resolver mapping schema → field errors

No Redux, no Context-as-state, no monolithic store. Each tool fits its scope.

## Design notes worth flagging

- **Shared Zod schemas** are mirrored in `server/src/shared` and `web/src/shared`. Same schemas validate requests on the server and parse forms on the client; TS types are inferred from them, so renaming a field surfaces as a compile error everywhere it matters.
- **Optimistic updates** ([web/src/hooks/useLeadMutations.ts](web/src/hooks/useLeadMutations.ts)) — create/update/delete write to the `['leads']` cache and the `['analytics']` cache synchronously, then reconcile or roll back. The "instant UI" requirement is satisfied: badge colors flip and the donut re-segments before the server replies.
- **Layered backend** — each module is `routes → controller → service`. Controllers stay thin; Prisma calls and business logic live in services. The single error-handling middleware in [server/src/middleware/error.ts](server/src/middleware/error.ts) maps `ZodError`, `HttpError`, and Prisma errors to JSON responses, so individual handlers never format errors themselves.
- **Env validation** ([server/src/env.ts](server/src/env.ts)) parses `process.env` through a Zod schema at boot. A misconfigured deploy crashes immediately with a readable message instead of failing on the first request.
- **Security baseline** — `helmet`, `cors` locked to a single origin, JSON body limit 100 KB, bcrypt cost 12, JWT 15-min expiry, `trust proxy 1` for Vercel's edge, passwords never returned.
- **No refresh tokens** — intentional. A properly rotated, revocable refresh flow is the right answer in production, but a half-built one (e.g. long-lived tokens in localStorage) is *worse* than expiring after 15 min. The brief asks for JWT; this stays in scope and documents the trade-off rather than hiding it.
- **No tests in this commit** — services are pure functions over Prisma, so the architecture is testable. For a take-home I'd rather ship a tight, polished surface than a half-covered suite. Easy follow-up: Vitest + Supertest for the API, React Testing Library for the dashboard.

## Manual verification

1. Register → auto-logged in → empty dashboard with a friendly empty state.
2. Add a lead → row appears **instantly** in the table; analytics cards and donut update **instantly** (optimistic).
3. Change status via the inline dropdown → badge re-colors and donut re-segments before the server replies.
4. Search by name/email/phone → results update after a 300 ms debounce; pagination resets to page 1.
5. Filter by status → same behavior.
6. Delete a lead → row disappears immediately; total decrements.
7. Try registering the same email twice → 409 with a field-level error rendered next to the email input.
8. `curl https://nexape.vercel.app/api/leads` (no token) → 401.

## Submission

Candidate: Wasif
Position: MERN Stack Developer – Intern, Naxape
Submitted: 18 May 2026 (deadline 20 May 2026)
