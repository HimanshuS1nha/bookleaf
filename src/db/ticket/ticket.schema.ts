import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { adminTable } from "../auth/admin.schema";
import { authorTable } from "../auth/author.schema";
import { bookTable } from "../book/book.schema";

import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../../constants/ticket";

export const ticketStatusEnum = pgEnum("ticket_status", TICKET_STATUSES);

export const ticketPriorityEnum = pgEnum("ticket_priority", TICKET_PRIORITIES);

export const ticketCategoryEnum = pgEnum("ticket_category", TICKET_CATEGORIES);

export const ticketTable = pgTable(
  "ticket",
  {
    id: uuid().primaryKey().$defaultFn(v7),
    authorId: uuid()
      .notNull()
      .references(() => authorTable.id, { onDelete: "cascade" }),
    // Unassigned tickets have no admin; keep the ticket if the admin is removed
    assignedTo: uuid().references(() => adminTable.id, {
      onDelete: "set null",
    }),
    // null means the ticket is about the author's account, not one book
    bookId: uuid().references(() => bookTable.id, { onDelete: "set null" }),
    subject: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    status: ticketStatusEnum().notNull().default("open"),
    // Priority and category start at defaults and are set by AI triage
    // shortly after creation. Admins can override both.
    priority: ticketPriorityEnum().notNull().default("medium"),
    category: ticketCategoryEnum().notNull().default("general_inquiry"),
    responseMessage: text(),
    aiResponse: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index().on(table.authorId),
    index().on(table.assignedTo),
    index().on(table.status),
  ],
);
