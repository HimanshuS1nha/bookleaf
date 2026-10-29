import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";
import z from "zod";

import { TicketDal } from "@/dal/ticket.dal";

import { checkAuthorAccess } from "@/helpers/author-access.helper";
import { errorResponse } from "@/helpers/error-response";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

export const GET = async (
  _req: NextRequest,
  ctx: RouteContext<"/api/authors/[authorId]/tickets/[ticketId]">,
) => {
  const { authorId, ticketId } = await ctx.params;

  const accessResult = await checkAuthorAccess({
    authorId,
    route: "/api/authors/[authorId]/tickets/[ticketId]",
  });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  // A malformed id would otherwise surface as a DB error
  if (!z.uuid().safeParse(ticketId).success) {
    const error = new BookleafError(
      ErrorType.INVALID_INPUT,
      "Error occurred in /api/authors/[authorId]/tickets/[ticketId]: ticketId is not a valid uuid",
    );

    return errorResponse(error);
  }

  // Scoped to the author so one author can't read another's ticket by id
  const ticketResult = await ResultAsync.fromPromise(
    TicketDal.getByIdForAuthor({ id: ticketId, authorId }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/authors/[authorId]/tickets/[ticketId]: DB error while getting ticket by id",
        { cause: error },
      ),
  );
  if (ticketResult.isErr()) {
    return errorResponse(ticketResult.error);
  }

  if (!ticketResult.value) {
    const error = new BookleafError(
      ErrorType.NOT_FOUND,
      "Error occurred in /api/authors/[authorId]/tickets/[ticketId]: Ticket does not exist",
      undefined,
      "Ticket",
    );

    return errorResponse(error);
  }

  return NextResponse.json({ ticket: ticketResult.value }, { status: 200 });
};
