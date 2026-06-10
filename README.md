# Civic Connect

Civic Connect is a web application for reporting and tracking civic complaints. It includes a public UI for creating/viewing complaints, an admin area for managing them, and backend integrations (Supabase) for persistence and authentication.

## Features

- Complaint submission and viewing
- Admin and dashboard routes
- Authentication (via Supabase)
- Map view components
- Automated tests (Vitest + Playwright)

## Tech Stack

- **React** (via Vite)
- **TypeScript**
- **TanStack Router / React** (route definitions)
- **Supabase** (auth + data)
- **Vitest** (unit/integration tests)
- **Playwright** (e2e tests)

## Prerequisites

- Node.js (LTS recommended)
- Package manager: **pnpm** (or bun if you prefer; this repo includes a bun lockfile)
- Supabase project configured (see `src/integrations/supabase/`)

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure environment variables:

   Create a `.env` file in the project root with the required Supabase settings (refer to your existing `.env` file or the code under `src/integrations/supabase/`).

3. Run the development server:

   ```bash
   pnpm dev
   ```

## Build & Preview

```bash
pnpm build
pnpm preview
```

## Tests

- Unit tests:

  ```bash
  pnpm test
  ```

- E2E tests:

  ```bash
  pnpm test:e2e
  ```

## Database / Supabase

SQL migrations are located in:

- `supabase/migrations/`

See `supabase/config.toml` for Supabase CLI configuration (if you use it).

## Notes

- `node_modules/` and build outputs are ignored via `.gitignore`.
- The project root now includes this README for GitHub visitors.

