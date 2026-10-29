import { NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";

import { AuthHelper } from "@/helpers/auth.helper";
import { errorResponse } from "@/helpers/error-response";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

export const GET = async () => {
  const adminResult = await ResultAsync.fromPromise(
    AuthHelper.getAdminFromToken(),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/admin/auth/me: DB error while getting admin from token",
        { cause: error },
      ),
  );
  if (adminResult.isErr()) {
    return errorResponse(adminResult.error);
  }

  const admin = adminResult.value;
  if (!admin) {
    const error = new BookleafError(
      ErrorType.UNAUTHORIZED,
      "Error occurred in /api/admin/auth/me: Token is missing or invalid",
    );

    return errorResponse(error);
  }

  return NextResponse.json({ admin }, { status: 200 });
};
