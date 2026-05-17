# Nexape — Mini CRM Lead Manager

A take-home implementation of a Lead Manager CRM. Two independently-deployable apps plus a shared schemas package, all wired up as an npm workspace for one-command install.

## Stack

| Layer | Tech |
|---|---|
| Language | TypeScript (FE + BE + shared) |
| Backend | Express 4 (pure Express, no framework on top) |
| Database | PostgreSQL via Prisma |
| Auth | JWT (Authorization Bearer, 15-min access tokens) |
| Validation | Zod — same schemas on both server and client |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS (shadcn-style component primitives) |
| Server state | TanStack Query v5 with optimistic mutations |
| Forms | react-hook-form + `@hookform/resolvers/zod` |
| Charts | Recharts |

## Repository layout

```
nexape/
├── apps/
│   ├── server/    # Express + Prisma API
│   └── web/       # React + Vite SPA
└── packages/
    └── shared/    # Zod schemas + inferred TS types (imported by both)
```

## Setup

Requirements: Node 20+, a running PostgreSQL instance.

```bash
# 1. Create the database
createdb nexape_dev

# 2. Configure env files
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example   apps/web/.env
#    Edit apps/server/.env — set DATABASE_URL and JWT_SECRET

# 3. Install everything from the repo root
npm install

# 4. Apply Prisma migrations + generate client
npm run -w apps/server prisma:generate
npm run -w apps/server prisma:migrate

# 5. Start both apps in parallel
npm run dev
#    API:  http://localhost:4000
#    Web:  http://localhost:5173
```

## API

All endpoints are JSON. Protected routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Description |
|---|---|---|
| `GET`    | `/health` | Liveness probe |
| `POST`   | `/api/auth/register` | Create user + return `{ user, accessToken }` |
| `POST`   | `/api/auth/login` | Same shape |
| `GET`    | `/api/auth/me` | Current user (auth required) |
| `GET`    | `/api/leads?page&pageSize&search&status` | Paginated, searchable, filterable list |
| `POST`   | `/api/leads` | Create lead |
| `PATCH`  | `/api/leads/:id` | Update any subset of fields |
| `DELETE` | `/api/leads/:id` | Delete lead |
| `GET`    | `/api/analytics/summary` | `{ total, byStatus, last7Days }` |

Error responses are uniform: `{ message, fieldErrors? }`. Validation failures return 400 with field-level errors keyed by Zod path; unique-constraint conflicts return 409 with the same shape.

## Design notes

A few things worth flagging for the reviewer:

- **Shared Zod schemas** live in `packages/shared`. The same schema validates a request on the server and parses a form on the client, and TS types are inferred from them — so renaming a field is a single edit and a compile error everywhere it matters.
- **Optimistic updates** are wired in `apps/web/src/hooks/useLeadMutations.ts`. Status changes, creates, and deletes all update both the `['leads', …]` and `['analytics']` caches synchronously and roll back atomically on server error. That's where the "instant UI" requirement is satisfied — the badge color flips and the donut chart updates before the server replies.
- **Layered backend**: each module is `routes → controller → service`. Controllers stay thin; business logic and Prisma calls live in services. The single error-handling middleware in `apps/server/src/middleware/error.ts` maps `ZodError`, `HttpError`, and Prisma errors to JSON responses, so individual handlers never have to format errors themselves.
- **Env validation** (`apps/server/src/env.ts`) parses `process.env` through a Zod schema at boot. A misconfigured server crashes immediately with a readable message instead of failing on first request.
- **Security baseline**: `helmet`, `cors` locked to `WEB_ORIGIN`, JSON body limit 100 KB, bcrypt cost 12 for passwords, JWT 15-min expiry, passwords never returned from any endpoint.
- **No refresh tokens.** Intentional. A properly-rotated, revocable refresh-token flow is the right answer in production, but a half-built one (e.g. long-lived tokens in `localStorage`) is *worse* than just expiring after 15 minutes. The brief asks for JWT auth; this stays in that scope and documents the tradeoff rather than hiding it.
- **`assignedTo` modeled as a relation** to `User` (`assignedToId` FK) rather than a free-text string. Still satisfies the brief and lets the API return the assignee's name/email without a second round-trip.
- **No tests in this commit.** The architecture is testable — services are pure functions over Prisma — but for a take-home I'd rather ship a tight, polished surface than a half-covered suite. Easy follow-up: Vitest + Supertest for the API, React Testing Library for the dashboard.

## Manual verification

1. Register → auto-logged in → empty dashboard.
2. Add a lead → row appears **instantly** in the table; analytics cards and donut update **instantly**.
3. Change status via the inline dropdown → badge re-colors immediately; donut re-segments immediately.
4. Search by name/email/phone → results update after a 300 ms debounce; pagination resets to page 1.
5. Filter by status → same.
6. Delete a lead → row disappears immediately, total decrements.
7. Try registering the same email twice → 409, error rendered next to the email input.
8. `curl http://localhost:4000/api/leads` (no token) → 401.
