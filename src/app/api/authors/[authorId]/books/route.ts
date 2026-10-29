import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";

import { BookDal } from "@/dal/book.dal";

import { checkAuthorAccess } from "@/helpers/author-access.helper";
import { errorResponse } from "@/helpers/error-response";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

// Authors can only see their own books, admins can see any author's books
export const GET = async (
  _req: NextRequest,
  ctx: RouteContext<"/api/authors/[authorId]/books">,
) => {
  const { authorId } = await ctx.params;

  const accessResult = await checkAuthorAccess({
    authorId,
    route: "/api/authors/[authorId]/books",
  });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const booksResult = await ResultAsync.fromPromise(
    BookDal.getAllByAuthorId({ authorId }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/authors/[authorId]/books: DB error while getting books by author id",
        { cause: error },
      ),
  );
  if (booksResult.isErr()) {
    return errorResponse(booksResult.error);
  }

  return NextResponse.json({ books: booksResult.value }, { status: 200 });
};
