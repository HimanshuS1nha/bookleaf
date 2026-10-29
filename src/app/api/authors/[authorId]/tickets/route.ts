import { after, NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";

import { BookDal } from "@/dal/book.dal";
import { TicketDal } from "@/dal/ticket.dal";

import { checkAuthorAccess } from "@/helpers/author-access.helper";
import { errorResponse } from "@/helpers/error-response";
import { TicketTriageHelper } from "@/helpers/ticket-triage.helper";

import { createTicketValidator } from "@/validators/create-ticket.validator";
import { listTicketsValidator } from "@/validators/list-tickets.validator";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

// Supports ?search=&status=open&status=closed&from=<iso>&to=<iso>&page=&pageSize=
export const GET = async (
  req: NextRequest,
  ctx: RouteContext<"/api/authors/[authorId]/tickets">,
) => {
  const { authorId } = await ctx.params;

  const accessResult = await checkAuthorAccess({
    authorId,
    route: "/api/authors/[authorId]/tickets",
  });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const searchParams = req.nextUrl.searchParams;
  const parsingResult = await listTicketsValidator.safeParseAsync({
    search: searchParams.get("search") || undefined,
    status: searchParams.getAll("status"),
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    page: searchParams.get("page") || undefined,
    pageSize: searchParams.get("pageSize") || undefined,
  });
  if (!parsingResult.success) {
    return NextResponse.json(
      {
        message: parsingResult.error.issues
          .map((err) => err.message)
          .join("; "),
      },
      { status: 400 },
    );
  }

  const parsedData = parsingResult.data;

  const ticketsResult = await ResultAsync.fromPromise(
    TicketDal.getAllByAuthorId({
      authorId,
      search: parsedData.search,
      statuses: parsedData.status,
      from: parsedData.from ? new Date(parsedData.from) : undefined,
      to: parsedData.to ? new Date(parsedData.to) : undefined,
      page: parsedData.page,
      pageSize: parsedData.pageSize,
    }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/authors/[authorId]/tickets: DB error while getting tickets by author id",
        { cause: error },
      ),
  );
  if (ticketsResult.isErr()) {
    return errorResponse(ticketsResult.error);
  }

  return NextResponse.json(
    {
      tickets: ticketsResult.value.tickets,
      total: ticketsResult.value.total,
      page: parsedData.page,
      pageSize: parsedData.pageSize,
    },
    { status: 200 },
  );
};

// Only the author themselves can raise a ticket
export const POST = async (
  req: NextRequest,
  ctx: RouteContext<"/api/authors/[authorId]/tickets">,
) => {
  const { authorId } = await ctx.params;

  const accessResult = await checkAuthorAccess({
    authorId,
    route: "/api/authors/[authorId]/tickets",
    allowAdmin: false,
  });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const bodyResult = await ResultAsync.fromPromise(
    req.json(),
    (error) =>
      new BookleafError(
        ErrorType.INVALID_INPUT,
        "Error occured in /api/authors/[authorId]/tickets: Invalid request body",
        { cause: error },
      ),
  );
  if (bodyResult.isErr()) {
    return errorResponse(bodyResult.error);
  }

  const parsingResult = await createTicketValidator.safeParseAsync(
    bodyResult.value,
  );
  if (!parsingResult.success) {
    return NextResponse.json(
      {
        message: parsingResult.error.issues
          .map((err) => err.message)
          .join("; "),
      },
      { status: 400 },
    );
  }

  const parsedData = parsingResult.data;

  if (parsedData.bookId) {
    const bookResult = await ResultAsync.fromPromise(
      BookDal.getByIdForAuthor({ id: parsedData.bookId, authorId }),
      (error) =>
        new BookleafError(
          ErrorType.DATABASE_ERROR,
          "Error occurred in /api/authors/[authorId]/tickets: DB error while getting book by id",
          { cause: error },
        ),
    );
    if (bookResult.isErr()) {
      return errorResponse(bookResult.error);
    }

    // Also covers another author's book, without revealing that it exists
    if (!bookResult.value) {
      const error = new BookleafError(
        ErrorType.NOT_FOUND,
        "Error occurred in /api/authors/[authorId]/tickets: Book does not exist",
        undefined,
        "Book",
      );

      return errorResponse(error);
    }
  }

  const newTicketResult = await ResultAsync.fromPromise(
    TicketDal.create({
      authorId,
      bookId: parsedData.bookId,
      subject: parsedData.subject,
      description: parsedData.description,
    }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/authors/[authorId]/tickets: DB error while creating ticket",
        { cause: error },
      ),
  );
  if (newTicketResult.isErr()) {
    return errorResponse(newTicketResult.error);
  }

  const newTicket = newTicketResult.value;
  const author = accessResult.value;

  // Runs after the response is sent, so a slow or failing model never blocks
  // ticket creation. Until it finishes the ticket keeps the default category
  // and priority, and admins can always set them and reply by hand.
  after(() =>
    TicketTriageHelper.triage({
      ticket: newTicket,
      authorId,
      authorName: author.name,
      route: "/api/authors/[authorId]/tickets",
    }),
  );

  return NextResponse.json({ ticket: newTicket }, { status: 201 });
};
