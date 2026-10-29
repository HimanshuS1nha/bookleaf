# Architecture

## One Next.js app for UI and API

The author portal, the admin portal and the REST API all live in one Next.js 16 app. Pages are in `src/app`, and API route handlers are in `src/app/api`. The client only talks to the backend through those JSON endpoints, so the API is the same one a mobile app or another service would use.

I picked one app over a separate frontend and backend because the brief was five days. It means one deploy, one set of types and one place to validate input. The cost is that the API can't scale on its own. At BookLeaf's ticket volume that doesn't matter yet, and route handlers port to a standalone Node service without much rework if it ever does.

## Layers

A request to an API route passes through these layers, each in its own folder:

1. **Route handler** (`src/app/api/**/route.ts`). Parses params and the body, runs the access check, calls the validator and turns results into HTTP responses. It holds no SQL.
2. **Access helpers** (`src/helpers/author-access.helper.ts`, `admin-access.helper.ts`). Read the session and decide whether the caller can touch this resource.
3. **Validators** (`src/validators`). Zod schemas. The same schema validates the form in the browser, the request on the server and generates the OpenAPI spec.
4. **DAL** (`src/dal`). Every database query lives here, one class per table group. Routes never import Drizzle directly.
5. **Schema** (`src/db`). Drizzle table definitions, which are also the source of the TypeScript row types.

Errors travel as values, not exceptions. Each step returns a `neverthrow` `Result`, and failures become a `BookleafError` with a type such as `NOT_FOUND`, `INVALID_INPUT` or `AI_UNAVAILABLE`. One function, `errorResponse`, maps that type to a status code and a safe message for the client, and logs the full error with its cause. So a database failure returns a generic 500 message while the log keeps the real error.

## Authentication and access control

Authors and admins live in separate tables and log in at separate endpoints. Passwords are hashed with argon2. A successful login signs a JWT (HS256, 15 days) holding the user's id and role, and stores it in an `httpOnly`, `SameSite=Lax` cookie, so browser scripts can't read it.

Access is checked in two places:

- `src/proxy.ts` runs before every request and redirects to the login page when a dashboard page is opened without a cookie. It's a fast first check, not the security boundary.
- Every API route checks the session itself, and so do the page layouts. An author can only reach `/api/authors/{their own id}/...`. Asking for another author's id returns 401. Admins can read any author's data but can't raise tickets as an author.

Ticket lookups for authors filter by both ticket id and author id in the same query, so a guessed ticket id from another author returns 404, not someone else's data.

## Data model

- `author`, `admin`: accounts.
- `book`: one row per book, linked to its author. `status` is free text, because the sample data uses production stage names such as "In Production - Cover Design".
- `book_royalty`: per-copy rate, copies sold, amount paid and last payout date. Earned and pending royalties are calculated on read (`rate × copies`, then `earned − paid`) instead of stored, so they can't fall out of step with the inputs.
- `ticket`: subject, description, status, priority, category, assignee, the reply sent to the author and the AI draft. `bookId` is nullable, and null means a general or account-level ticket. Status, priority and category are Postgres enums.
- `ticket_note`: internal notes. Only admin endpoints return them.
- `ticket_activity`: an append-only history of every change, recording who made it (author, admin or the AI "system"), the old value and the new value. The admin activity feed reads from it, and it shows which fields the AI set and which an admin overrode.

Ids are UUIDv7, so they sort by creation time and don't reveal how many rows exist.

## Ticket lifecycle

1. The author picks a book (or "General / account level"), writes a subject and description, and submits.
2. The API checks that the book belongs to the author, saves the ticket with category `general_inquiry` and priority `medium`, records a `created` activity and returns 201.
3. After the response is sent, Next.js `after()` runs AI triage: classify, then draft a reply. See [ai-integration.md](ai-integration.md).
4. The ticket lands in the admin queue. The queue sorts unresolved tickets first, then by priority, then oldest first, so urgent tickets and the ones that have waited longest are at the top.
5. An admin opens the ticket, can override category and priority, assigns it, adds internal notes, edits the AI draft and saves. A ticket can't move to resolved or closed without a reply to the author.
6. The author's ticket page shows the reply.

## Near real-time updates

The author's ticket list and ticket page refetch every 30 seconds with TanStack Query, and so do the admin queue and the admin ticket page. Authors see admin replies without reloading, and admins see AI results arrive.

I chose polling over WebSockets or Server-Sent Events because it works on any host, including serverless platforms that don't keep connections open, and a 30-second delay is fine for support tickets. The admin ticket form keeps unsaved edits through a refetch and only follows server changes while untouched.

## Frontend

Pages are server components that check the session and render client components for anything interactive. Client data goes through TanStack Query definitions in `src/queries`, which hold the cache keys and fetch functions in one place. Forms use TanStack Form with the same Zod schemas as the API. Filters on the ticket lists live in the URL, so a filtered view can be bookmarked or shared.
