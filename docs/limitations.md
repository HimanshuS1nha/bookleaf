# Known limitations and next steps

## Not built

- **Attachments are UI only.** The ticket form has a file picker, but files aren't uploaded or stored. The brief lists upload as a bonus. Next step: upload to object storage (S3 or R2) through a signed URL and keep the file keys on the ticket.
- **No re-classify button.** If classification fails, the ticket keeps `general_inquiry` and `medium` until an admin changes them. Drafts can be regenerated, but classification can't be re-run from the UI.
- **No author registration page.** `POST /api/auth/register` exists, but there's no sign-up page. The brief only asks for login, and the test authors come from the seed data.
- **No email notifications.** Authors only see replies when they open the portal.
- **No admin tools for books or royalties.** Book and royalty data comes from the seed. There's no screen to edit it, and no per-platform royalty breakdown, which the knowledge base says authors can see.

## Trade-offs I'd revisit

- **Polling every 30 seconds instead of push.** It's simple and works on any host, but a reply can take up to 30 seconds to appear, and idle tabs keep making requests. Server-Sent Events, or a hosted pub/sub such as Pusher or Supabase Realtime, would push changes instantly.
- **AI triage runs inside the web process.** `after()` runs triage once the response is sent. If the process restarts mid-call, that ticket's triage is lost, and nothing retries it later. In production I'd put triage on a job queue (for example pg-boss on the same Postgres) with retries and a dead-letter list.
- **Hand-listed OpenAPI paths.** Request schemas come from the validators, but each endpoint is registered by hand in `src/lib/openapi.ts`. A new route that isn't added there won't appear in the docs.
- **Book status is free text.** The sample data uses stage names such as "In Production - Cover Design", so I stored them as strings. An enum of production stages would allow filtering and progress bars.
- **Search uses `ILIKE`.** Fine for thousands of tickets. At BookLeaf's volume over a few years it needs Postgres full-text search or trigram indexes.

## Production gaps

- **No automated tests.** I relied on TypeScript, Zod and manual testing against the seeded data. The first tests I'd add are access control (an author can't read another author's ticket), the resolve-without-reply rule, the AI fallback paths with a mocked model, and the classification schema against the brief's sample queries.
- **No rate limiting.** Login and the regenerate-draft endpoint have no limits. Login needs them against password guessing, and regenerate needs them to cap AI spend.
- **Sessions can't be revoked.** A login is a 15-day JWT in a cookie. Logging out deletes the cookie, but a copied token stays valid until it expires. A session table, or short-lived tokens with refresh, would fix that.
- **No AI quality tracking.** Nothing records how often admins accept the draft unchanged, edit it or discard it, or how often they override the category. That data would show whether prompt changes help, and could drive an evaluation set.
- **Logs only.** Errors go to pino logs. Production would need error tracking (such as Sentry) and alerts when the AI failure rate goes up.
