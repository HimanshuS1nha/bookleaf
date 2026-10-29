import {
  date,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { v7 } from "uuid";

import { authorTable } from "../auth/author.schema";
import { bookTable } from "./book.schema";

export const bookRoyaltyTable = pgTable(
  "book_royalty",
  {
    id: uuid().primaryKey().$defaultFn(v7),
    bookId: uuid()
      .notNull()
      .references(() => bookTable.id, { onDelete: "cascade" }),
    authorId: uuid()
      .notNull()
      .references(() => authorTable.id, { onDelete: "cascade" }),
    authorRoyaltyPerCopy: integer(),
    totalCopiesSold: integer().notNull().default(0),
    royaltyPaid: integer().notNull().default(0),
    lastRoyaltyPayoutDate: date({ mode: "string" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  // One royalty record per author per book
  (table) => [unique().on(table.bookId, table.authorId)],
);
