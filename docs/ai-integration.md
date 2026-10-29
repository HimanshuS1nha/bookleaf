# AI integration

The AI does three jobs on every new ticket: pick a category, set a priority and draft a reply for an admin to review. All the code is in three files:

- `src/helpers/ticket-ai.helper.ts` builds the prompts and calls the model.
- `src/helpers/ticket-triage.helper.ts` runs the steps in order, saves the results and handles failures.
- `src/constants/knowledge-base.ts` holds BookLeaf's policies, split by ticket category.

## Flow

```
author submits ticket
  -> ticket saved with category general_inquiry, priority medium
  -> 201 returned to the author
  -> after the response (Next.js after()):
       1. classify: category + priority      (small prompt, no knowledge base)
       2. save them, logging a "system" activity entry for each change
       3. draft: reply to the author         (knowledge base section for that category + the author's book data)
       4. save the draft on the ticket
admin opens ticket -> sees the draft -> "Use this draft" -> edits -> saves
```

The author never waits on the model. Triage takes a few seconds, and the admin page refreshes every 30 seconds, so by the time an admin opens the ticket the draft is usually there.

## Prompt design

### Classification

The classifier gets the subject, the description and, if the ticket is about a book, that book's title and production status. The status matters because "when will it be done?" about a book in typesetting is a production question, not a general one.

It returns structured output that a Zod schema enforces (`src/validators/ticket-triage.validator.ts`), so a response that isn't one of the six categories and four priorities fails validation instead of reaching the database. The schema's field descriptions are the classification rules, and the AI SDK sends them to the model with the schema. The priority rules come from the knowledge base. ISBN errors are always at least high. Money the author is owed and hasn't received, or a book that can't be bought, ranks above questions about a bio or a description. The system prompt also tells the model to rate how much the issue costs the author, not how upset they sound.

### Drafting

The drafting prompt has two parts.

The system prompt holds:

- the role. The model is drafting for a BookLeaf support agent who will edit the draft before sending.
- the tone guidelines from the brief, word for word. Acknowledge first, be specific, own BookLeaf's mistakes, give timelines, end with a next step.
- rules. Use only facts from the account data or the policies, and if something isn't there, say the team will check and give a timeline instead of guessing. Plain text, under 200 words, sign off as "BookLeaf Support".
- the company overview, plus the knowledge base section for this ticket's category. That section includes the brief's example responses, such as "explain the quarterly cycle and give the next payout date", so the model sees the expected handling and not only the policy.

The user prompt holds the ticket and the facts the reply needs:

- the author's name and today's date
- the next royalty payout date. The code works this out from the quarterly cycle and the 45-day window rather than asking the model to do date maths.
- for a ticket about a book, that book's status, MRP, per-copy royalty, copies sold, royalty earned, paid and pending, last payout date, platforms and print partner
- for a general ticket, one line per book: status, copies sold, pending royalty and last payout

With those numbers the draft can say "₹3,570 is pending on Whispers of the Ganges and will be paid by 14 November" instead of "we'll look into your royalties".

### Prompt injection

The ticket subject and description are wrapped in `<subject>` and `<description>` tags. Both prompts say this text is written by the author and is the content of the request, not instructions. The draft is never sent automatically, so a manipulated draft would still pass through an admin.

## Error handling

The rule is that the AI can make the app better but can never make it stop working.

- **Ticket creation never depends on the model.** The ticket is saved and the author gets a 201 before any AI call starts. If Gemini is down, rate-limited or the key is wrong, the author doesn't notice.
- **Each step fails on its own.** If classification fails, the ticket keeps `general_inquiry` and `medium`, and the draft is still written against that category. If drafting fails, the classification is still saved.
- **Retries.** The AI SDK retries rate-limit and server errors twice with backoff before giving up.
- **Failures are logged** with the ticket route and the provider's error as the cause.
- **Admins are never blocked.** With no draft, the admin page says so and offers a Generate draft button, and the reply box works as normal. The button calls `POST /api/admin/tickets/{id}/ai-draft`, which returns 503 with a readable message if the model is still unavailable.
- **AI results don't overwrite people.** If an admin changes the category or priority before triage finishes, the late AI result skips that field. The check reads the ticket's activity history inside a row-locked transaction.

## Cost control

Every ticket costs two short calls, and each one carries only what it needs.

- **Classification sends no knowledge base.** It's the call that runs on every ticket, and picking a category doesn't need the royalty policy. It sends the ticket text, the book title and status, and the rules in the schema.
- **Drafting sends one knowledge base section, not all six.** The full knowledge base is about 5,350 characters, roughly 1,300 tokens. A drafting call sends the overview, the tone guidelines and one category section, about 1,800 characters or 450 tokens on average. Splitting the knowledge base by category is the reason classification runs first.
- **Only the author's own data, and only what's relevant.** A ticket about one book sends that book alone. A general ticket sends a one-line summary per book, capped at 10 books, so an author with a large catalogue can't blow up the prompt.
- **No ticket history.** Neither call sends earlier tickets, notes or replies. Each ticket is drafted on its own.
- **Low thinking level.** Both calls set Gemini's thinking level to low. Classification and a 200-word draft don't need long reasoning, and thinking tokens are billed.
- **Draft once, read many times.** The draft is saved on the ticket. Opening the ticket again, or another admin opening it, costs nothing. The model runs again only when an admin clicks Regenerate.
- **Static text first.** The system prompt puts the parts shared by every call (role, tone, rules) before the category section, so providers that cache prompt prefixes can reuse them.

## Model choice

The app uses Gemini Flash (`gemini-3.8-flash`) through the Vercel AI SDK.

- **Price and speed.** Both jobs are short, well-defined tasks, so a flash-tier model is enough. It's a cheap, fast model, the same kind of option as the GPT-4o mini and Claude Haiku models the brief suggests.
- **Structured output.** Classification depends on the model returning valid JSON for a schema, and Gemini supports schema-constrained output.
- **Easy to swap.** The model is one constant in `ticket-ai.helper.ts`, and the AI SDK hides provider differences. Moving to Claude or GPT means changing the import and that constant, plus the provider-specific thinking setting.

## Where to look

| What                                         | File                                                          |
| -------------------------------------------- | ------------------------------------------------------------- |
| Prompts and model calls                      | `src/helpers/ticket-ai.helper.ts`                             |
| Order of steps, saving, failure handling     | `src/helpers/ticket-triage.helper.ts`                         |
| Knowledge base                               | `src/constants/knowledge-base.ts`                             |
| Classification schema and rules              | `src/validators/ticket-triage.validator.ts`                   |
| Saving AI results without overwriting admins | `TicketDal.updateAiClassification` in `src/dal/ticket.dal.ts` |
| Regenerate endpoint                          | `src/app/api/admin/tickets/[ticketId]/ai-draft/route.ts`      |
