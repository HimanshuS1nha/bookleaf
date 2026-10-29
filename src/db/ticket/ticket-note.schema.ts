import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { adminTable } from "../auth/admin.schema";
import { ticketTable } from "./ticket.schema";

// Internal notes on a ticket, visible to admins only
export const ticketNoteTable = pgTable(
  "ticket_note",
  {
    id: uuid().primaryKey().$defaultFn(v7),
    ticketId: uuid()
      .notNull()
      .references(() => ticketTable.id, { onDelete: "cascade" }),
    // Nullable so notes survive the authoring admin being removed
    createdBy: uuid().references(() => adminTable.id, {
      onDelete: "set null",
    }),
    note: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index().on(table.ticketId)],
);
