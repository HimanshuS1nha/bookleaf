import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";

import { TicketDal } from "@/dal/ticket.dal";

import { checkAdminAccess } from "@/helpers/admin-access.helper";
import { errorResponse } from "@/helpers/error-response";

import { listAdminTicketsValidator } from "@/validators/list-tickets.validator";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

// Supports ?search=&status=&priority=&category=&assignment=all|mine|unassigned&from=<iso>&to=<iso>&page=&pageSize=
// status, priority and category can be repeated
export const GET = async (req: NextRequest) => {
  const accessResult = await checkAdminAccess({
    route: "/api/admin/tickets",
  });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const admin = accessResult.value;

  const searchParams = req.nextUrl.searchParams;
  const parsingResult = await listAdminTicketsValidator.safeParseAsync({
    search: searchParams.get("search") || undefined,
    status: searchParams.getAll("status"),
    priority: searchParams.getAll("priority"),
    category: searchParams.getAll("category"),
    assignment: searchParams.get("assignment") || undefined,
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
    TicketDal.getAllForAdmin({
      adminId: admin.id,
      search: parsedData.search,
      statuses: parsedData.status,
      priorities: parsedData.priority,
      categories: parsedData.category,
      assignment: parsedData.assignment,
      from: parsedData.from ? new Date(parsedData.from) : undefined,
      to: parsedData.to ? new Date(parsedData.to) : undefined,
      page: parsedData.page,
      pageSize: parsedData.pageSize,
    }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/admin/tickets: DB error while getting tickets",
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
