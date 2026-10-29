import { NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";

import { AuthHelper } from "@/helpers/auth.helper";
import { errorResponse } from "@/helpers/error-response";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

export const GET = async () => {
  const authorResult = await ResultAsync.fromPromise(
    AuthHelper.getAuthorFromToken(),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/auth/me: DB error while getting author from token",
        { cause: error },
      ),
  );
  if (authorResult.isErr()) {
    return errorResponse(authorResult.error);
  }

  const author = authorResult.value;
  if (!author) {
    const error = new BookleafError(
      ErrorType.UNAUTHORIZED,
      "Error occurred in /api/auth/me: Token is missing or invalid",
    );

    return errorResponse(error);
  }

  return NextResponse.json({ author }, { status: 200 });
};
