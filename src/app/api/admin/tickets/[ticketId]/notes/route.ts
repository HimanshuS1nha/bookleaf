import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";
import z from "zod";

import { TicketDal } from "@/dal/ticket.dal";
import { TicketNoteDal } from "@/dal/ticket-note.dal";

import { checkAdminAccess } from "@/helpers/admin-access.helper";
import { errorResponse } from "@/helpers/error-response";

import { createTicketNoteValidator } from "@/validators/create-ticket-note.validator";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

const ROUTE = "/api/admin/tickets/[ticketId]/notes";

const checkTicketExists = async (ticketId: string) => {
  // A malformed id would otherwise surface as a DB error
  if (!z.uuid().safeParse(ticketId).success) {
    return new BookleafError(
      ErrorType.INVALID_INPUT,
      `Error occurred in ${ROUTE}: ticketId is not a valid uuid`,
    );
  }

  const ticketResult = await ResultAsync.fromPromise(
    TicketDal.getByIdForAdmin({ id: ticketId }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        `Error occurred in ${ROUTE}: DB error while getting ticket by id`,
        { cause: error },
      ),
  );
  if (ticketResult.isErr()) {
    return ticketResult.error;
  }

  if (!ticketResult.value) {
    return new BookleafError(
      ErrorType.NOT_FOUND,
      `Error occurred in ${ROUTE}: Ticket does not exist`,
      undefined,
      "Ticket",
    );
  }

  return null;
};

// Work notes are internal and never shown to the author
export const GET = async (
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/tickets/[ticketId]/notes">,
) => {
  const accessResult = await checkAdminAccess({ route: ROUTE });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const { ticketId } = await ctx.params;

  const ticketError = await checkTicketExists(ticketId);
  if (ticketError) {
    return errorResponse(ticketError);
  }

  const notesResult = await ResultAsync.fromPromise(
    TicketNoteDal.getAllByTicketId({ ticketId }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        `Error occurred in ${ROUTE}: DB error while getting notes`,
        { cause: error },
      ),
  );
  if (notesResult.isErr()) {
    return errorResponse(notesResult.error);
  }

  return NextResponse.json({ notes: notesResult.value }, { status: 200 });
};

export const POST = async (
  req: NextRequest,
  ctx: RouteContext<"/api/admin/tickets/[ticketId]/notes">,
) => {
  const accessResult = await checkAdminAccess({ route: ROUTE });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const { ticketId } = await ctx.params;

  const ticketError = await checkTicketExists(ticketId);
  if (ticketError) {
    return errorResponse(ticketError);
  }

  const bodyResult = await ResultAsync.fromPromise(
    req.json(),
    (error) =>
      new BookleafError(
        ErrorType.INVALID_INPUT,
        `Error occured in ${ROUTE}: Invalid request body`,
        { cause: error },
      ),
  );
  if (bodyResult.isErr()) {
    return errorResponse(bodyResult.error);
  }

  const parsingResult = await createTicketNoteValidator.safeParseAsync(
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

  const noteResult = await ResultAsync.fromPromise(
    TicketNoteDal.create({
      ticketId,
      createdBy: accessResult.value.id,
      note: parsingResult.data.note,
    }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        `Error occurred in ${ROUTE}: DB error while creating note`,
        { cause: error },
      ),
  );
  if (noteResult.isErr()) {
    return errorResponse(noteResult.error);
  }

  return NextResponse.json({ note: noteResult.value }, { status: 201 });
};
