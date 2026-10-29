import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";

import { bookRoyaltyTable, bookTable } from "@/db/schema";

const bookWithRoyaltyColumns = {
  id: bookTable.id,
  title: bookTable.title,
  isbn: bookTable.isbn,
  genre: bookTable.genre,
  publicationDate: bookTable.publicationDate,
  status: bookTable.status,
  mrp: bookTable.mrp,
  printPartner: bookTable.printPartner,
  availableOn: bookTable.availableOn,
  createdAt: bookTable.createdAt,
  authorRoyaltyPerCopy: bookRoyaltyTable.authorRoyaltyPerCopy,
  totalCopiesSold: bookRoyaltyTable.totalCopiesSold,
  royaltyPaid: bookRoyaltyTable.royaltyPaid,
  lastRoyaltyPayoutDate: bookRoyaltyTable.lastRoyaltyPayoutDate,
};

type BookWithRoyaltyRow = {
  authorRoyaltyPerCopy: number | null;
  totalCopiesSold: number | null;
  royaltyPaid: number | null;
};

// Earned and pending are derived rather than stored so they can't drift from
// the sales and payout figures. Books without a royalty row count as zero.
const withRoyaltyTotals = <T extends BookWithRoyaltyRow>(book: T) => {
  const totalCopiesSold = book.totalCopiesSold ?? 0;
  const royaltyPaid = book.royaltyPaid ?? 0;
  const royaltyEarned = (book.authorRoyaltyPerCopy ?? 0) * totalCopiesSold;

  return {
    ...book,
    totalCopiesSold,
    royaltyPaid,
    royaltyEarned,
    royaltyPending: royaltyEarned - royaltyPaid,
  };
};

export class BookDal {
  static async getAllByAuthorId({ authorId }: { authorId: string }) {
    const books = await db
      .select(bookWithRoyaltyColumns)
      .from(bookTable)
      .leftJoin(
        bookRoyaltyTable,
        and(
          eq(bookRoyaltyTable.bookId, bookTable.id),
          eq(bookRoyaltyTable.authorId, bookTable.authorId),
        ),
      )
      .where(eq(bookTable.authorId, authorId))
      .orderBy(desc(bookTable.publicationDate), desc(bookTable.createdAt));

    return books.map(withRoyaltyTotals);
  }

  // Scoped to the author so a ticket can't reference someone else's book
  static async getByIdForAuthor({
    id,
    authorId,
  }: {
    id: string;
    authorId: string;
  }) {
    const data = await db
      .select(bookWithRoyaltyColumns)
      .from(bookTable)
      .leftJoin(
        bookRoyaltyTable,
        and(
          eq(bookRoyaltyTable.bookId, bookTable.id),
          eq(bookRoyaltyTable.authorId, bookTable.authorId),
        ),
      )
      .where(and(eq(bookTable.id, id), eq(bookTable.authorId, authorId)))
      .limit(1);

    return data[0] ? withRoyaltyTotals(data[0]) : undefined;
  }
}
