import type { Metadata } from "next";

import { BooksList } from "@/components/dashboard/books-list";

import { getDashboardAuthor } from "@/helpers/dashboard.helper";

export const metadata: Metadata = {
  title: "Books · Bookleaf",
};

export default async function BooksPage() {
  const author = await getDashboardAuthor();

  return (
    <>
      <h1 className="font-serif text-3xl font-medium tracking-tight">
        Your books
      </h1>
      <p className="mt-2 text-muted-foreground">
        Every title you&apos;ve published with Bookleaf.
      </p>

      <div className="mt-8">
        <BooksList authorId={author.id} />
      </div>
    </>
  );
}
