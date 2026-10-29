import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { authorTable } from "../auth/author.schema";

export const bookTable = pgTable(
  "book",
  {
    id: uuid().primaryKey().$defaultFn(v7),
    authorId: uuid()
      .notNull()
      .references(() => authorTable.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }).notNull(),
    isbn: varchar({ length: 20 }).unique().notNull(),
    genre: varchar({ length: 100 }).notNull(),
    publicationDate: date({ mode: "string" }),
    status: varchar({ length: 50 }).notNull(),
    mrp: integer(),
    printPartner: varchar({ length: 255 }),
    availableOn: text().array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index().on(table.authorId)],
);
