import "server-only";

import { err, ok, Result, ResultAsync } from "neverthrow";
import z from "zod";

import { AuthorDal } from "@/dal/author.dal";

import { AuthHelper } from "@/helpers/auth.helper";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";
import { Role } from "@/enums/role.enum";

import { AdminType, AuthorType } from "@/types";

// Authors can only access their own resources, admins can access any author's
// unless allowAdmin is false. `route` is only used in error messages.
export const checkAuthorAccess = async ({
  authorId,
  route,
  allowAdmin = true,
}: {
  authorId: string;
  route: string;
  allowAdmin?: boolean;
}): Promise<Result<AuthorType | AdminType, BookleafError>> => {
  // A malformed id would otherwise surface as a DB error
  if (!z.uuid().safeParse(authorId).success) {
    return err(
      new BookleafError(
        ErrorType.INVALID_INPUT,
        `Error occurred in ${route}: authorId is not a valid uuid`,
      ),
    );
  }

  const accountResult = await ResultAsync.fromPromise(
    AuthHelper.getAccountFromToken(),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        `Error occurred in ${route}: DB error while getting account from token`,
        { cause: error },
      ),
  );
  if (accountResult.isErr()) {
    return err(accountResult.error);
  }

  const account = accountResult.value;
  const isOwnResource =
    account?.role === Role.AUTHOR && account.id === authorId;
  const isAllowedAdmin = allowAdmin && account?.role === Role.ADMIN;
  if (!account || (!isOwnResource && !isAllowedAdmin)) {
    return err(
      new BookleafError(
        ErrorType.UNAUTHORIZED,
        `Error occurred in ${route}: Requester is not allowed to access this author's resources`,
      ),
    );
  }

  // The requesting author is known to exist, so this check is only needed for admins
  if (account.role === Role.ADMIN) {
    const authorResult = await ResultAsync.fromPromise(
      AuthorDal.getById({ id: authorId }),
      (error) =>
        new BookleafError(
          ErrorType.DATABASE_ERROR,
          `Error occurred in ${route}: DB error while getting author by id`,
          { cause: error },
        ),
    );
    if (authorResult.isErr()) {
      return err(authorResult.error);
    }

    if (!authorResult.value) {
      return err(
        new BookleafError(
          ErrorType.NOT_FOUND,
          `Error occurred in ${route}: Author does not exist`,
          undefined,
          "Author",
        ),
      );
    }
  }

  return ok(account);
};
