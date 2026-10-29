import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";

import { AdminDal } from "@/dal/admin.dal";

import { AuthHelper } from "@/helpers/auth.helper";
import { errorResponse } from "@/helpers/error-response";
import { HashingHelper } from "@/helpers/hashing.helper";

import { loginValidator } from "@/validators/login.validator";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";
import { Role } from "@/enums/role.enum";

export const POST = async (req: NextRequest) => {
  const bodyResult = await ResultAsync.fromPromise(
    req.json(),
    (error) =>
      new BookleafError(
        ErrorType.INVALID_INPUT,
        "Error occured in /api/admin/auth/login: Invalid request body",
        { cause: error },
      ),
  );
  if (bodyResult.isErr()) {
    return errorResponse(bodyResult.error);
  }

  const body = bodyResult.value;

  const parsingResult = await loginValidator.safeParseAsync(body);
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

  const existingAdminResult = await ResultAsync.fromPromise(
    AdminDal.INTERNAL_getByEmail({ email: parsedData.email }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/admin/auth/login: DB error while getting admin by email",
        { cause: error },
      ),
  );
  if (existingAdminResult.isErr()) {
    return errorResponse(existingAdminResult.error);
  }

  const existingAdmin = existingAdminResult.value;
  if (!existingAdmin) {
    // Same error as a wrong password so the response doesn't reveal which emails are registered
    const error = new BookleafError(
      ErrorType.UNAUTHORIZED,
      "Error occurred in /api/admin/auth/login: No admin exists with the provided email",
    );

    return errorResponse(error);
  }

  const isPasswordValidResult = await ResultAsync.fromPromise(
    HashingHelper.verify({
      hashedValue: existingAdmin.passwordHash,
      originalValue: parsedData.password,
    }),
    (error) =>
      new BookleafError(
        ErrorType.GENERIC_ERROR,
        "Error occurred in /api/admin/auth/login: error in verifying password hash",
        { cause: error },
      ),
  );
  if (isPasswordValidResult.isErr()) {
    return errorResponse(isPasswordValidResult.error);
  }

  if (!isPasswordValidResult.value) {
    const error = new BookleafError(
      ErrorType.UNAUTHORIZED,
      "Error occurred in /api/admin/auth/login: Invalid password",
    );

    return errorResponse(error);
  }

  const tokenResult = await ResultAsync.fromPromise(
    AuthHelper.signToken({ id: existingAdmin.id, role: Role.ADMIN }),
    (error) =>
      new BookleafError(
        ErrorType.GENERIC_ERROR,
        "Error occurred in /api/admin/auth/login: error in signing token",
        { cause: error },
      ),
  );
  if (tokenResult.isErr()) {
    return errorResponse(tokenResult.error);
  }

  await AuthHelper.setTokenCookie({ token: tokenResult.value });

  return NextResponse.json(
    {
      admin: {
        id: existingAdmin.id,
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: Role.ADMIN,
        createdAt: existingAdmin.createdAt,
      },
    },
    { status: 200 },
  );
};
