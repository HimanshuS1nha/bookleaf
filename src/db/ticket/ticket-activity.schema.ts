import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { adminTable } from "../auth/admin.schema";
import { ticketTable } from "./ticket.schema";

import {
  TICKET_ACTIVITY_ACTORS,
  TICKET_ACTIVITY_TYPES,
} from "../../constants/ticket";

export const ticketActivityTypeEnum = pgEnum(
  "ticket_activity_type",
  TICKET_ACTIVITY_TYPES,
);

export const ticketActivityActorEnum = pgEnum(
  "ticket_activity_actor",
  TICKET_ACTIVITY_ACTORS,
);

// Append-only history of changes to a ticket. Rows are never edited,
// so there is no updatedAt.
export const ticketActivityTable = pgTable(
  "ticket_activity",
  {
    id: uuid().primaryKey().$defaultFn(v7),
    ticketId: uuid()
      .notNull()
      .references(() => ticketTable.id, { onDelete: "cascade" }),
    type: ticketActivityTypeEnum().notNull(),
    actorType: ticketActivityActorEnum().notNull(),
    // Set when an admin made the change; kept as history if the admin is removed
    actorAdminId: uuid().references(() => adminTable.id, {
      onDelete: "set null",
    }),
    // Status/priority values, or admin ids for assignee changes; null means none
    fromValue: text(),
    toValue: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index().on(table.ticketId)],
);
