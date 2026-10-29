# BookLeaf Author Support Portal

A support portal for BookLeaf Publishing with two sides. Authors log in to see their books and royalties, raise support tickets and follow replies. The BookLeaf team works those tickets from an admin queue. Gemini classifies each new ticket, sets its priority and drafts a reply from BookLeaf's knowledge base, and an admin reviews and sends it.

Live demo: https://bookleaf-wine.vercel.app/ 

## Tech stack

- Next.js 16 (App Router) for the UI and the REST API, in one TypeScript codebase
- PostgreSQL with Drizzle ORM
- Gemini through the Vercel AI SDK
- TanStack Query and TanStack Form on the client, Zod for validation on both sides
- Tailwind CSS with shadcn/ui components
- OpenAPI spec generated from the Zod validators, served with Scalar

## Prerequisites

- Node.js 20.9 or newer
- pnpm. The repo pins its version in `package.json`, so `corepack enable` is enough.
- PostgreSQL, running locally or hosted
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Running it locally

1. Install dependencies.

   ```bash
   pnpm install
   ```

   argon2, the password hashing library, compiles a native module on install. If pnpm reports ignored build scripts, run `pnpm approve-builds` and allow `argon2`.

2. Create a database.

   ```bash
   createdb bookleaf
   ```

3. Copy the example env file and fill in the values.

   ```bash
   cp .env.example .env
   ```

   | Variable                       | What it is                                                      |
   | ------------------------------ | --------------------------------------------------------------- |
   | `DATABASE_URL`                 | PostgreSQL connection string for the database you just created  |
   | `JWT_SECRET`                   | Signs login tokens. Generate one with `openssl rand -base64 32` |
   | `GOOGLE_GENERATIVE_AI_API_KEY` | Your Gemini API key                                             |
   | `LOG_LEVEL`                    | Optional. Defaults to `info`                                    |

   Without the Gemini key the app still runs. Tickets get the default category and priority, and admins write replies by hand.

4. Create the tables and load the sample data.

   ```bash
   pnpm db:push
   pnpm db:seed
   ```

   The seed loads the 10 authors and 18 books from `bookleaf_sample_data.json`, three admins and five example tickets. To wipe the database and seed again, run `pnpm db:seed --reset`.

5. Start the dev server.

   ```bash
   pnpm dev
   ```

   Open http://localhost:3000.

## Test logins

Every seeded account uses the password `12345678`.

Admins log in at `/admin/login`:

- `admin1@bookleaf.test`
- `admin2@bookleaf.test`
- `admin3@bookleaf.test`

Authors log in at `/login` with the emails from the sample data:

| Author          | Email                       | Worth trying because                    |
| --------------- | --------------------------- | --------------------------------------- |
| Priya Sharma    | `priya.sharma@email.com`    | Has a seeded royalty ticket in progress |
| Rohit Kapoor    | `rohit.kapoor@email.com`    | Critical "unavailable on Amazon" ticket |
| Ananya Reddy    | `ananya.reddy@email.com`    | One book, royalties never paid out      |
| Vikram Joshi    | `vikram.joshi@email.com`    |                                         |
| Meera Nair      | `meera.nair@email.com`      | All royalties paid on one book          |
| Arjun Malhotra  | `arjun.malhotra@email.com`  | No payouts yet                          |
| Sneha Kulkarni  | `sneha.kulkarni@email.com`  | Three books, one still in cover design  |
| Farhan Sheikh   | `farhan.sheikh@email.com`   |                                         |
| Kavita Deshmukh | `kavita.deshmukh@email.com` | One book still in typesetting           |
| Diya Chatterjee | `diya.chatterjee@email.com` | Critical ISBN ticket                    |

## Scripts

| Command                     | What it does                                       |
| --------------------------- | -------------------------------------------------- |
| `pnpm dev`                  | Dev server on port 3000                            |
| `pnpm build` / `pnpm start` | Production build and server                        |
| `pnpm lint`                 | ESLint                                             |
| `pnpm db:push`              | Applies the Drizzle schema to the database         |
| `pnpm db:seed`              | Seeds the sample data. Add `--reset` to wipe first |
| `pnpm db:studio`            | Opens Drizzle Studio to browse the data            |

## API docs

With the app running, interactive docs are at `/api/docs` and the raw OpenAPI spec is at `/api/openapi.json`. Log in through one of the login endpoints first, because every other endpoint reads the session cookie. [docs/api.md](docs/api.md) has an overview of every endpoint.

## Project structure

```
src/
  app/            Pages and API route handlers (src/app/api)
  components/     UI, split into admin, dashboard (author), tickets and ui
  dal/            Data access. Every database query lives here
  db/             Drizzle schema
  helpers/        Auth, access checks, error responses and the AI code
  validators/     Zod schemas shared by forms, API routes and the OpenAPI spec
  constants/      Ticket enums and labels, routes, the AI knowledge base
  queries/        TanStack Query definitions for the client
  lib/            Database client, logger, fetch wrapper, OpenAPI document
scripts/seed.ts   Seeds the sample data
docs/             Architecture, AI integration, API overview, write-up
```

## Documentation

- [Architecture](docs/architecture.md): how the app is put together and why
- [AI integration](docs/ai-integration.md): prompt design, error handling, cost control and model choice
- [API](docs/api.md): endpoints, auth and error format
- [Known limitations](docs/limitations.md): what's missing and what I'd improve next
- [Write-up](docs/write-up.md): one page on priorities, trade-offs and the path to production
