import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";
import z from "zod";

import { AdminDal } from "@/dal/admin.dal";
import { TicketDal } from "@/dal/ticket.dal";

import { checkAdminAccess } from "@/helpers/admin-access.helper";
import { errorResponse } from "@/helpers/error-response";

import { updateTicketValidator } from "@/validators/update-ticket.validator";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

const ROUTE = "/api/admin/tickets/[ticketId]";

// Statuses the author sees as final, so they must come with a reply
const STATUSES_REQUIRING_RESPONSE = new Set(["resolved", "closed"]);

const getTicket = async (ticketId: string) => {
  // A malformed id would otherwise surface as a DB error
  if (!z.uuid().safeParse(ticketId).success) {
    return {
      error: new BookleafError(
        ErrorType.INVALID_INPUT,
        `Error occurred in ${ROUTE}: ticketId is not a valid uuid`,
      ),
    };
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
    return { error: ticketResult.error };
  }

  if (!ticketResult.value) {
    return {
      error: new BookleafError(
        ErrorType.NOT_FOUND,
        `Error occurred in ${ROUTE}: Ticket does not exist`,
        undefined,
        "Ticket",
      ),
    };
  }

  return { ticket: ticketResult.value };
};

export const GET = async (
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/tickets/[ticketId]">,
) => {
  const accessResult = await checkAdminAccess({ route: ROUTE });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const { ticketId } = await ctx.params;

  const { ticket, error } = await getTicket(ticketId);
  if (error) {
    return errorResponse(error);
  }

  return NextResponse.json({ ticket }, { status: 200 });
};

// Admins can change status, priority, category, assignee and the fulfillment message.
// Everything the author wrote stays read-only.
export const PATCH = async (
  req: NextRequest,
  ctx: RouteContext<"/api/admin/tickets/[ticketId]">,
) => {
  const accessResult = await checkAdminAccess({ route: ROUTE });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const { ticketId } = await ctx.params;

  const existing = await getTicket(ticketId);
  if (existing.error) {
    return errorResponse(existing.error);
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

  const parsingResult = await updateTicketValidator.safeParseAsync(
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

  const nextStatus = parsedData.status ?? existing.ticket.status;
  const nextResponseMessage =
    parsedData.responseMessage !== undefined
      ? parsedData.responseMessage
      : existing.ticket.responseMessage;
  if (STATUSES_REQUIRING_RESPONSE.has(nextStatus) && !nextResponseMessage) {
    return NextResponse.json(
      {
        message:
          "Add a fulfillment message before resolving or closing the ticket",
      },
      { status: 400 },
    );
  }

  if (parsedData.assignedTo) {
    const assigneeResult = await ResultAsync.fromPromise(
      AdminDal.getById({ id: parsedData.assignedTo }),
      (error) =>
        new BookleafError(
          ErrorType.DATABASE_ERROR,
          `Error occurred in ${ROUTE}: DB error while getting assignee by id`,
          { cause: error },
        ),
    );
    if (assigneeResult.isErr()) {
      return errorResponse(assigneeResult.error);
    }

    if (!assigneeResult.value) {
      const error = new BookleafError(
        ErrorType.NOT_FOUND,
        `Error occurred in ${ROUTE}: Assignee does not exist`,
        undefined,
        "Assignee",
      );

      return errorResponse(error);
    }
  }

  const updateResult = await ResultAsync.fromPromise(
    TicketDal.updateByAdmin({
      id: ticketId,
      adminId: accessResult.value.id,
      status: parsedData.status,
      priority: parsedData.priority,
      category: parsedData.category,
      assignedTo: parsedData.assignedTo,
      responseMessage: parsedData.responseMessage,
    }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        `Error occurred in ${ROUTE}: DB error while updating ticket`,
        { cause: error },
      ),
  );
  if (updateResult.isErr()) {
    return errorResponse(updateResult.error);
  }

  // Re-read so the response carries the joined assignee details
  const updated = await getTicket(ticketId);
  if (updated.error) {
    return errorResponse(updated.error);
  }

  return NextResponse.json({ ticket: updated.ticket }, { status: 200 });
};
