import "server-only";

import {
  extendZodWithOpenApi,
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  ResponseConfig,
} from "@asteasolutions/zod-to-openapi";
import z from "zod";

import { createAdminValidator } from "@/validators/create-admin.validator";
import { createTicketNoteValidator } from "@/validators/create-ticket-note.validator";
import { createTicketValidator } from "@/validators/create-ticket.validator";
import {
  listAdminTicketsValidator,
  listTicketsValidator,
} from "@/validators/list-tickets.validator";
import { loginValidator } from "@/validators/login.validator";
import { registerValidator } from "@/validators/register.validator";
import { updateTicketValidator } from "@/validators/update-ticket.validator";

import {
  TICKET_ACTIVITY_ACTORS,
  TICKET_ACTIVITY_TYPES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/constants/ticket";

// Request schemas come straight from the validators the routes use, so the
// docs can't drift from what the API actually accepts. Response schemas
// mirror the shapes in src/types.ts.

// Adds .openapi() to zod schemas, which the registry uses to name components
extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const cookieAuth = registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "token",
  description:
    "JWT set as an httpOnly cookie by the author or admin login endpoint.",
});
const security = [{ [cookieAuth.name]: [] }];

// Components

const ErrorSchema = registry.register(
  "Error",
  z.object({
    message: z.string().meta({ example: "Ticket not found" }),
  }),
);

const AuthorSchema = registry.register(
  "Author",
  z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    city: z.string(),
    phone: z.string(),
    joinedDate: z.iso.date(),
    role: z.literal("AUTHOR"),
  }),
);

const AdminSchema = registry.register(
  "Admin",
  z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    role: z.literal("ADMIN"),
  }),
);

const AdminListItemSchema = registry.register(
  "AdminListItem",
  z.object({ id: z.uuid(), name: z.string(), email: z.email() }),
);

const BookSchema = registry.register(
  "Book",
  z.object({
    id: z.uuid(),
    title: z.string(),
    isbn: z.string(),
    genre: z.string(),
    publicationDate: z.iso.date().nullable(),
    status: z.string().meta({ example: "Published & Live" }),
    mrp: z.int().nullable().meta({ description: "In rupees" }),
    printPartner: z.string().nullable(),
    availableOn: z.array(z.string()),
    createdAt: z.iso.datetime(),
    authorRoyaltyPerCopy: z
      .int()
      .nullable()
      .meta({ description: "null while the book is in production" }),
    totalCopiesSold: z.int(),
    royaltyEarned: z.int(),
    royaltyPaid: z.int(),
    royaltyPending: z.int(),
    lastRoyaltyPayoutDate: z.iso.date().nullable(),
  }),
);

const TicketBookSchema = z
  .object({ id: z.uuid(), title: z.string() })
  .nullable()
  .meta({ description: "null for general / account level tickets" });

const ticketFields = {
  id: z.uuid(),
  subject: z.string(),
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES),
  category: z.enum(TICKET_CATEGORIES),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
};

const AuthorTicketSchema = registry.register(
  "AuthorTicket",
  z.object({
    ...ticketFields,
    bookId: z.uuid().nullable(),
    book: TicketBookSchema,
    description: z.string(),
    responseMessage: z
      .string()
      .nullable()
      .meta({ description: "The team's reply to the author" }),
  }),
);

const AdminTicketListItemSchema = registry.register(
  "AdminTicketListItem",
  z.object({
    ...ticketFields,
    book: TicketBookSchema,
    author: z.object({ id: z.uuid(), name: z.string(), email: z.email() }),
    assignee: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  }),
);

const AdminTicketSchema = registry.register(
  "AdminTicket",
  z.object({
    ...ticketFields,
    description: z.string(),
    book: z
      .object({
        id: z.uuid(),
        title: z.string(),
        isbn: z.string(),
        status: z.string(),
      })
      .nullable(),
    responseMessage: z.string().nullable(),
    aiResponse: z.string().nullable().meta({
      description:
        "AI-drafted reply for the admin to review. null while generating or if the AI call failed.",
    }),
    author: z.object({
      id: z.uuid(),
      name: z.string(),
      email: z.email(),
      phone: z.string(),
      city: z.string(),
      joinedDate: z.iso.date(),
    }),
    assignee: z
      .object({ id: z.uuid(), name: z.string(), email: z.email() })
      .nullable(),
  }),
);

const TicketNoteSchema = registry.register(
  "TicketNote",
  z.object({
    id: z.uuid(),
    note: z.string(),
    createdAt: z.iso.datetime(),
    createdBy: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  }),
);

const TicketActivitySchema = registry.register(
  "TicketActivity",
  z.object({
    id: z.uuid(),
    type: z.enum(TICKET_ACTIVITY_TYPES),
    actorType: z.enum(TICKET_ACTIVITY_ACTORS),
    fromValue: z.string().nullable().meta({
      description:
        "Previous value. Assignee changes are resolved to admin names.",
    }),
    toValue: z.string().nullable(),
    createdAt: z.iso.datetime(),
    actorAdmin: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  }),
);

const paginated = <T extends z.ZodType>(items: T) => ({
  tickets: z.array(items),
  total: z.int(),
  page: z.int(),
  pageSize: z.int(),
});

// Helpers for the repeated parts of each path

const json = (schema: z.ZodType, description: string): ResponseConfig => ({
  description,
  content: { "application/json": { schema } },
});

const errors = {
  400: json(ErrorSchema, "Invalid input"),
  401: json(ErrorSchema, "Not logged in, or not allowed to access this"),
  404: json(ErrorSchema, "Not found"),
  409: json(ErrorSchema, "Conflict"),
  503: json(
    ErrorSchema,
    "The AI provider is down or rate-limited. Write the reply manually or retry later.",
  ),
  500: json(ErrorSchema, "Unexpected server error"),
};
const pickErrors = (...codes: (keyof typeof errors)[]) =>
  Object.fromEntries(codes.map((code) => [code, errors[code]]));

const body = (schema: z.ZodType) => ({
  body: { content: { "application/json": { schema } } },
});

const authorIdParam = z.object({ authorId: z.uuid() });
const ticketIdParam = z.object({ ticketId: z.uuid() });

// Author auth

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Author auth"],
  summary: "Register an author account",
  request: body(registerValidator),
  responses: {
    201: json(
      z.object({
        author: AuthorSchema.extend({ createdAt: z.iso.datetime() }),
      }),
      "Author created",
    ),
    ...pickErrors(400, 409, 500),
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Author auth"],
  summary: "Log in as an author",
  description: "Sets the `token` cookie used by every authenticated endpoint.",
  request: body(loginValidator),
  responses: {
    200: json(
      z.object({
        author: AuthorSchema.extend({ createdAt: z.iso.datetime() }),
      }),
      "Logged in",
    ),
    ...pickErrors(400, 401, 500),
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Author auth"],
  summary: "Log out (author or admin)",
  description: "Clears the `token` cookie.",
  responses: { 204: { description: "Logged out" } },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Author auth"],
  summary: "Get the logged-in author",
  security,
  responses: {
    200: json(z.object({ author: AuthorSchema }), "The current author"),
    ...pickErrors(401, 500),
  },
});

// Authors

registry.registerPath({
  method: "get",
  path: "/authors/{authorId}/books",
  tags: ["Authors"],
  summary: "List an author's books with royalty figures",
  description: "Authors can only list their own books. Admins can list any.",
  security,
  request: { params: authorIdParam },
  responses: {
    200: json(z.object({ books: z.array(BookSchema) }), "The author's books"),
    ...pickErrors(400, 401, 500),
  },
});

registry.registerPath({
  method: "get",
  path: "/authors/{authorId}/tickets",
  tags: ["Authors"],
  summary: "List an author's tickets",
  description:
    "Newest first. Authors can only list their own tickets. Admins can list any. Repeat `status` to filter by several statuses.",
  security,
  request: { params: authorIdParam, query: listTicketsValidator },
  responses: {
    200: json(z.object(paginated(AuthorTicketSchema)), "A page of tickets"),
    ...pickErrors(400, 401, 500),
  },
});

registry.registerPath({
  method: "post",
  path: "/authors/{authorId}/tickets",
  tags: ["Authors"],
  summary: "Raise a ticket",
  description:
    "Only the author themselves can raise a ticket. Category and priority start as `general_inquiry` and `medium`; AI triage sets them and drafts a reply for admins shortly after the response is sent. If the AI service is unavailable the ticket is still created.",
  security,
  request: { params: authorIdParam, ...body(createTicketValidator) },
  responses: {
    201: json(
      z.object({
        ticket: AuthorTicketSchema.omit({ book: true }),
      }),
      "Ticket created",
    ),
    ...pickErrors(400, 401, 404, 500),
  },
});

registry.registerPath({
  method: "get",
  path: "/authors/{authorId}/tickets/{ticketId}",
  tags: ["Authors"],
  summary: "Get one of an author's tickets",
  security,
  request: { params: authorIdParam.extend(ticketIdParam.shape) },
  responses: {
    200: json(z.object({ ticket: AuthorTicketSchema }), "The ticket"),
    ...pickErrors(400, 401, 404, 500),
  },
});

// Admin auth

registry.registerPath({
  method: "post",
  path: "/admin/auth/login",
  tags: ["Admin auth"],
  summary: "Log in as an admin",
  description: "Sets the `token` cookie used by every authenticated endpoint.",
  request: body(loginValidator),
  responses: {
    200: json(
      z.object({
        admin: AdminSchema.extend({ createdAt: z.iso.datetime() }),
      }),
      "Logged in",
    ),
    ...pickErrors(400, 401, 500),
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/auth/me",
  tags: ["Admin auth"],
  summary: "Get the logged-in admin",
  security,
  responses: {
    200: json(z.object({ admin: AdminSchema }), "The current admin"),
    ...pickErrors(401, 500),
  },
});

// Admins

registry.registerPath({
  method: "get",
  path: "/admin/admins",
  tags: ["Admins"],
  summary: "List admins",
  description: "Used to pick a ticket assignee.",
  security,
  responses: {
    200: json(
      z.object({ admins: z.array(AdminListItemSchema) }),
      "All admins, by name",
    ),
    ...pickErrors(401, 500),
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/admins",
  tags: ["Admins"],
  summary: "Create an admin",
  description: "Only an existing admin can create another admin.",
  security,
  request: body(createAdminValidator),
  responses: {
    201: json(
      z.object({
        admin: AdminSchema.extend({ createdAt: z.iso.datetime() }),
      }),
      "Admin created",
    ),
    ...pickErrors(400, 401, 409, 500),
  },
});

// Admin tickets

registry.registerPath({
  method: "get",
  path: "/admin/tickets",
  tags: ["Admin tickets"],
  summary: "Ticket queue",
  description:
    "All tickets across authors. Unresolved first, then by priority (critical to low), then oldest first. Repeat `status`, `priority` and `category` to filter by several values.",
  security,
  request: { query: listAdminTicketsValidator },
  responses: {
    200: json(
      z.object(paginated(AdminTicketListItemSchema)),
      "A page of tickets",
    ),
    ...pickErrors(400, 401, 500),
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/tickets/{ticketId}",
  tags: ["Admin tickets"],
  summary: "Get a ticket with internal fields",
  security,
  request: { params: ticketIdParam },
  responses: {
    200: json(z.object({ ticket: AdminTicketSchema }), "The ticket"),
    ...pickErrors(400, 401, 404, 500),
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/tickets/{ticketId}",
  tags: ["Admin tickets"],
  summary: "Update a ticket",
  description:
    "Send only the fields to change. `assignedTo: null` unassigns. Setting status to `resolved` or `closed` requires a `responseMessage`, either in this request or already saved. Every change is recorded in the ticket's activity.",
  security,
  request: { params: ticketIdParam, ...body(updateTicketValidator) },
  responses: {
    200: json(z.object({ ticket: AdminTicketSchema }), "The updated ticket"),
    ...pickErrors(400, 401, 404, 500),
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/tickets/{ticketId}/notes",
  tags: ["Admin tickets"],
  summary: "List internal notes",
  description: "Notes are only visible to admins.",
  security,
  request: { params: ticketIdParam },
  responses: {
    200: json(
      z.object({ notes: z.array(TicketNoteSchema) }),
      "The ticket's notes",
    ),
    ...pickErrors(400, 401, 404, 500),
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/tickets/{ticketId}/notes",
  tags: ["Admin tickets"],
  summary: "Add an internal note",
  security,
  request: { params: ticketIdParam, ...body(createTicketNoteValidator) },
  responses: {
    201: json(z.object({ note: z.object({ id: z.uuid() }) }), "Note added"),
    ...pickErrors(400, 401, 404, 500),
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/tickets/{ticketId}/activity",
  tags: ["Admin tickets"],
  summary: "Get a ticket's change history",
  description: "Oldest first. `actorType: system` entries come from AI triage.",
  security,
  request: { params: ticketIdParam },
  responses: {
    200: json(
      z.object({ activity: z.array(TicketActivitySchema) }),
      "The ticket's history. Empty for an unknown ticket.",
    ),
    ...pickErrors(400, 401, 500),
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/tickets/{ticketId}/ai-draft",
  tags: ["Admin tickets"],
  summary: "Regenerate the AI draft reply",
  description:
    "Writes a new AI draft using the ticket's saved category and the author's book data, replacing `aiResponse`. Waits for the model, so it can take a few seconds.",
  security,
  request: { params: ticketIdParam },
  responses: {
    200: json(
      z.object({ ticket: AdminTicketSchema }),
      "The ticket with its new draft",
    ),
    ...pickErrors(400, 401, 404, 500, 503),
  },
});

export const openApiDocument = new OpenApiGeneratorV31(
  registry.definitions,
).generateDocument({
  openapi: "3.1.0",
  info: {
    title: "BookLeaf Author Support API",
    version: "1.0.0",
    description:
      "REST API behind the BookLeaf author and admin portals. Log in with one of the auth endpoints first; the session is carried in the `token` cookie.",
  },
  servers: [{ url: "/api" }],
});
