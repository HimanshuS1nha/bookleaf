# API

The full reference, with request and response schemas and a "try it" console, is at `/api/docs` on a running instance. The raw OpenAPI 3.1 spec is at `/api/openapi.json`. This page is the short version.

All endpoints are under `/api`, take and return JSON, and use plural resource names with ids in the path.

## Authentication

Log in with `POST /api/auth/login` (authors) or `POST /api/admin/auth/login` (admins). Both set an `httpOnly` cookie called `token`, and every other endpoint reads it. In the docs page, call a login endpoint first and the browser sends the cookie on later requests.

Access rules:

- Authors can only reach their own resources under `/api/authors/{authorId}`. Using another author's id returns 401.
- Admins can read any author's books and tickets, and everything under `/api/admin`.
- Only the author can raise a ticket on their own account.

## Errors

Every error has the same shape:

```json
{ "message": "Ticket not found" }
```

| Status | When                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------- |
| 400    | Validation failed. The message lists each problem, for example `Subject is required; Choose a book` |
| 401    | Not logged in, or not allowed to access this resource                                               |
| 404    | The ticket, book or assignee doesn't exist, or isn't visible to you                                 |
| 409    | An account with that email already exists                                                           |
| 500    | Unexpected error. The message is generic and the details go to the server log                       |
| 503    | The AI provider is unavailable. Only the regenerate-draft endpoint returns this                     |

## Endpoints

### Author auth

| Method | Path                 | Description                                        |
| ------ | -------------------- | -------------------------------------------------- |
| POST   | `/api/auth/register` | Create an author account                           |
| POST   | `/api/auth/login`    | Log in as an author                                |
| POST   | `/api/auth/logout`   | Log out (clears the cookie for authors and admins) |
| GET    | `/api/auth/me`       | The logged-in author                               |

### Authors

| Method | Path                                         | Description                                                                      |
| ------ | -------------------------------------------- | -------------------------------------------------------------------------------- |
| GET    | `/api/authors/{authorId}/books`              | The author's books with copies sold and royalty earned, paid and pending         |
| GET    | `/api/authors/{authorId}/tickets`            | The author's tickets, newest first, paginated                                    |
| POST   | `/api/authors/{authorId}/tickets`            | Raise a ticket. Body: `bookId` (or `null` for general), `subject`, `description` |
| GET    | `/api/authors/{authorId}/tickets/{ticketId}` | One ticket, including the team's reply                                           |

### Admin auth and admins

| Method | Path                    | Description                         |
| ------ | ----------------------- | ----------------------------------- |
| POST   | `/api/admin/auth/login` | Log in as an admin                  |
| GET    | `/api/admin/auth/me`    | The logged-in admin                 |
| GET    | `/api/admin/admins`     | All admins, for the assignee picker |
| POST   | `/api/admin/admins`     | Create an admin (admins only)       |

### Admin tickets

| Method | Path                                     | Description                                                                              |
| ------ | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/api/admin/tickets`                     | The queue across all authors. Unresolved first, then by priority, then oldest first      |
| GET    | `/api/admin/tickets/{ticketId}`          | A ticket with internal fields: AI draft, assignee, author contact details                |
| PATCH  | `/api/admin/tickets/{ticketId}`          | Change status, priority, category, assignee or the reply. Send only the fields to change |
| POST   | `/api/admin/tickets/{ticketId}/ai-draft` | Write a new AI draft from the ticket's saved category                                    |
| GET    | `/api/admin/tickets/{ticketId}/notes`    | Internal notes                                                                           |
| POST   | `/api/admin/tickets/{ticketId}/notes`    | Add an internal note                                                                     |
| GET    | `/api/admin/tickets/{ticketId}/activity` | Change history, including what the AI set                                                |

Rules worth knowing:

- `PATCH` with `status` set to `resolved` or `closed` returns 400 unless the ticket has a reply, either in the same request or saved earlier. Authors shouldn't see a ticket closed with no answer.
- `assignedTo: null` unassigns a ticket.
- Each field change in a `PATCH` adds a row to the activity history.

## List filters

Both ticket lists take these query parameters:

| Parameter          | Example                          | Notes                                                                                  |
| ------------------ | -------------------------------- | -------------------------------------------------------------------------------------- |
| `search`           | `royalty`                        | Matches subject and description. Admin search also matches the author's name and email |
| `status`           | `status=open&status=in_progress` | Repeat to match several                                                                |
| `from`, `to`       | `2026-10-01T00:00:00+05:30`      | ISO timestamps with an offset, so the client decides where its day starts              |
| `page`, `pageSize` | `page=2&pageSize=20`             | `pageSize` is 1 to 100, default 20                                                     |

The admin queue also takes `priority` and `category` (both repeatable) and `assignment` (`all`, `mine` or `unassigned`).

## Keeping the docs in sync

The spec is built in `src/lib/openapi.ts`. Request bodies and query parameters come from the same Zod validators the routes use, so a validation change shows up in the docs without extra work. The list of paths and the response shapes are written by hand, so a new endpoint has to be added there as well.
