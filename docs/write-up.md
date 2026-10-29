# Write-up

## What I prioritised

I started with the ticket flow from end to end: an author raises a ticket, an admin works it, the author sees the reply. I built the data model and the REST API around it first, with access control in every route, then the two portals, then the AI.

For the AI I cared most about two things. The drafts had to sound like BookLeaf, so the knowledge base and the tone rules go into the prompt, along with the author's real royalty figures and dates. And the AI could never be the reason a ticket fails. Triage runs after the ticket is saved, each step fails on its own, and admins can always write a reply by hand or ask for a new draft.

## Trade-offs

- **One Next.js app instead of a separate API service.** One deploy and one set of types, which mattered in five days. The API is still a clean REST layer the frontend only reaches over HTTP, so it can move out later.
- **Polling instead of WebSockets.** Every 30 seconds is responsive enough for support tickets and works on any host. Push would be better at scale.
- **Two AI calls instead of one.** Classifying first lets the drafting call carry only the knowledge base section for that category, about a third of the full knowledge base. It costs an extra round trip, but the author never waits for either call.
- **Draft on creation instead of when the admin opens the ticket.** The draft is ready when the admin arrives, opening a ticket is instant and free, and the model only runs again when someone clicks Regenerate.
- **Stored inputs, derived totals.** Royalty earned and pending are calculated from copies, rate and payouts, so they can't disagree with each other.
- **No automated tests.** With the time I had, I relied on strict TypeScript, shared Zod schemas and manual runs against the sample data. It's the first gap I'd close.

## Taking it to production

1. **Move AI triage onto a job queue** with retries, so a restart or a provider outage delays triage but never loses it.
2. **Add tests** for access control, the ticket lifecycle rules and the AI fallback paths, and run them in CI.
3. **Measure the AI.** Record whether admins send the draft as is, edit it or discard it, and how often they override the category. Build an evaluation set from real tickets so prompt changes can be checked before release.
4. **Rate limiting, revocable sessions and error tracking**, plus alerts when the AI failure rate rises.
5. **Close the loop with authors.** Email them when a reply arrives, store attachments, and show the per-platform royalty breakdown, which would answer many royalty questions before they become tickets.
6. **Grow the knowledge base into retrieval** once BookLeaf's policies outgrow a few sections. Embed policy documents and past resolved tickets, and retrieve the closest matches for each draft.
