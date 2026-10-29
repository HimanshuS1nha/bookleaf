import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";
import z from "zod";

import { TicketActivityDal } from "@/dal/ticket-activity.dal";

import { checkAdminAccess } from "@/helpers/admin-access.helper";
import { errorResponse } from "@/helpers/error-response";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

const ROUTE = "/api/admin/tickets/[ticketId]/activity";

// History of field changes on a ticket; work notes come from the notes route
export const GET = async (
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/tickets/[ticketId]/activity">,
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

  const activityResult = await ResultAsync.fromPromise(
    TicketActivityDal.getAllByTicketId({ ticketId }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        `Error occurred in ${ROUTE}: DB error while getting activity`,
        { cause: error },
      ),
  );
  if (activityResult.isErr()) {
    return errorResponse(activityResult.error);
  }

  return NextResponse.json({ activity: activityResult.value }, { status: 200 });
};
