import "server-only";

import { err, ok, Result, ResultAsync } from "neverthrow";

import { AuthHelper } from "@/helpers/auth.helper";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

import { AdminType } from "@/types";

// `route` is only used in error messages
export const checkAdminAccess = async ({
  route,
}: {
  route: string;
}): Promise<Result<AdminType, BookleafError>> => {
  const adminResult = await ResultAsync.fromPromise(
    AuthHelper.getAdminFromToken(),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        `Error occurred in ${route}: DB error while getting admin from token`,
        { cause: error },
      ),
  );
  if (adminResult.isErr()) {
    return err(adminResult.error);
  }

  if (!adminResult.value) {
    return err(
      new BookleafError(
        ErrorType.UNAUTHORIZED,
        `Error occurred in ${route}: Requester is not an admin`,
      ),
    );
  }

  return ok(adminResult.value);
};
