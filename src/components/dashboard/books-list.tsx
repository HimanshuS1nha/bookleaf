"use client";

import { useQuery } from "@tanstack/react-query";

import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { bookQueries } from "@/queries/book.queries";

import { BookType } from "@/types";

const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export function BooksList({ authorId }: { authorId: string }) {
  const { data, error, isPending } = useQuery(bookQueries.all(authorId));

  if (error) {
    return (
      <p role="alert" className="rounded-lg border bg-card p-6 text-sm">
        {error.message}
      </p>
    );
  }

  if (isPending) {
    return (
      <div
        aria-busy
        aria-label="Loading books"
        className="divide-y overflow-hidden rounded-lg border bg-card shadow-xs"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-2 px-5 py-5">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (data.books.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-14 text-center">
        <p className="font-serif text-xl">No books yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Books you publish with Bookleaf will show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-xs">
      {data.books.map((book) => (
        <li key={book.id} className="px-5 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-serif text-xl leading-snug">{book.title}</h2>
            <span className="font-mono text-xs text-muted-foreground">
              ISBN {book.isbn}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <BookDetail label="Status" value={book.status} />
            <BookDetail label="Genre" value={book.genre} />
            <BookDetail
              label="Published"
              value={
                book.publicationDate ? formatDate(book.publicationDate) : null
              }
            />
            <BookDetail
              label="MRP"
              value={
                book.mrp !== null
                  ? `₹${book.mrp.toLocaleString("en-IN")}`
                  : null
              }
            />
            <BookDetail label="Print partner" value={book.printPartner} />
          </dl>

          <RoyaltySummary book={book} />

          {book.availableOn.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Available on
              </span>
              {book.availableOn.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
                >
                  {platform}
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function RoyaltySummary({ book }: { book: BookType }) {
  // Books in production have no royalty rate yet
  if (book.authorRoyaltyPerCopy === null) {
    return (
      <p className="mt-4 rounded-md bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
        Sales and royalties will show here once the book is published.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-md bg-muted/60 px-4 py-3">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <BookDetail
          label="Copies sold"
          value={book.totalCopiesSold.toLocaleString("en-IN")}
        />
        <BookDetail
          label="Royalty earned"
          value={formatRupees(book.royaltyEarned)}
        />
        <BookDetail
          label="Royalty paid"
          value={formatRupees(book.royaltyPaid)}
        />
        <BookDetail
          label="Royalty pending"
          value={formatRupees(book.royaltyPending)}
          highlight={book.royaltyPending > 0}
        />
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        {formatRupees(book.authorRoyaltyPerCopy)} per copy ·{" "}
        {book.lastRoyaltyPayoutDate
          ? `Last payout ${formatDate(book.lastRoyaltyPayoutDate)}`
          : "No payouts yet"}
      </p>
    </div>
  );
}

function BookDetail({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 truncate",
          highlight && "font-medium text-primary",
        )}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
