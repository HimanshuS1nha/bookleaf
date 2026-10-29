import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";
import z from "zod";

import { TicketDal } from "@/dal/ticket.dal";

import { checkAdminAccess } from "@/helpers/admin-access.helper";
import { errorResponse } from "@/helpers/error-response";
import { TicketTriageHelper } from "@/helpers/ticket-triage.helper";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

const ROUTE = "/api/admin/tickets/[ticketId]/ai-draft";

const getTicket = (ticketId: string) =>
  ResultAsync.fromPromise(
    TicketDal.getByIdForAdmin({ id: ticketId }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        `Error occurred in ${ROUTE}: DB error while getting ticket by id`,
        { cause: error },
      ),
  );

// Writes a new AI draft for a ticket, replacing the old one. Used when the
// draft failed at creation time or the admin changed the category. Waits for
// the model so the admin sees the result, and returns 503 if it's unavailable.
export const POST = async (
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/tickets/[ticketId]/ai-draft">,
) => {
  const accessResult = await checkAdminAccess({ route: ROUTE });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const { ticketId } = await ctx.params;

  // A malformed id would otherwise surface as a DB error
  if (!z.uuid().safeParse(ticketId).success) {
    const error = new BookleafError(
      ErrorType.INVALID_INPUT,
      `Error occurred in ${ROUTE}: ticketId is not a valid uuid`,
    );

    return errorResponse(error);
  }

  const ticketResult = await getTicket(ticketId);
  if (ticketResult.isErr()) {
    return errorResponse(ticketResult.error);
  }

  const ticket = ticketResult.value;
  if (!ticket) {
    const error = new BookleafError(
      ErrorType.NOT_FOUND,
      `Error occurred in ${ROUTE}: Ticket does not exist`,
      undefined,
      "Ticket",
    );

    return errorResponse(error);
  }

  const draftResult = await TicketTriageHelper.redraft({
    ticket: {
      id: ticket.id,
      bookId: ticket.book?.id ?? null,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
    },
    authorId: ticket.author.id,
    authorName: ticket.author.name,
    route: ROUTE,
  });
  if (draftResult.isErr()) {
    return errorResponse(draftResult.error);
  }

  // Re-read so the client gets the full ticket in the same shape as GET
  const updatedResult = await getTicket(ticketId);
  if (updatedResult.isErr()) {
    return errorResponse(updatedResult.error);
  }

  return NextResponse.json({ ticket: updatedResult.value }, { status: 200 });
};
