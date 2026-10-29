import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";

import { AdminDal } from "@/dal/admin.dal";

import { checkAdminAccess } from "@/helpers/admin-access.helper";
import { AuthHelper } from "@/helpers/auth.helper";
import { errorResponse } from "@/helpers/error-response";
import { HashingHelper } from "@/helpers/hashing.helper";

import { createAdminValidator } from "@/validators/create-admin.validator";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";
import { Role } from "@/enums/role.enum";

// Used to pick an assignee for a ticket
export const GET = async () => {
  const accessResult = await checkAdminAccess({ route: "/api/admin/admins" });
  if (accessResult.isErr()) {
    return errorResponse(accessResult.error);
  }

  const adminsResult = await ResultAsync.fromPromise(
    AdminDal.getAll(),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/admin/admins: DB error while getting admins",
        { cause: error },
      ),
  );
  if (adminsResult.isErr()) {
    return errorResponse(adminsResult.error);
  }

  return NextResponse.json({ admins: adminsResult.value }, { status: 200 });
};

export const POST = async (req: NextRequest) => {
  const currentAdminResult = await ResultAsync.fromPromise(
    AuthHelper.getAdminFromToken(),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/admin/admins: DB error while getting admin from token",
        { cause: error },
      ),
  );
  if (currentAdminResult.isErr()) {
    return errorResponse(currentAdminResult.error);
  }

  if (!currentAdminResult.value) {
    const error = new BookleafError(
      ErrorType.UNAUTHORIZED,
      "Error occurred in /api/admin/admins: Requester is not an admin",
    );

    return errorResponse(error);
  }

  const bodyResult = await ResultAsync.fromPromise(
    req.json(),
    (error) =>
      new BookleafError(
        ErrorType.INVALID_INPUT,
        "Error occured in /api/admin/admins: Invalid request body",
        { cause: error },
      ),
  );
  if (bodyResult.isErr()) {
    return errorResponse(bodyResult.error);
  }

  const body = bodyResult.value;

  const parsingResult = await createAdminValidator.safeParseAsync(body);
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

  const existingDataResult = await ResultAsync.fromPromise(
    AdminDal.getByEmail({ email: parsedData.email }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/admin/admins: DB error while getting existing admin by email",
        { cause: error },
      ),
  );
  if (existingDataResult.isErr()) {
    return errorResponse(existingDataResult.error);
  }

  if (existingDataResult.value) {
    const error = new BookleafError(
      ErrorType.CONFLICT,
      "Error occurred in /api/admin/admins: Admin already exists with the provided email",
      undefined,
      "Email",
    );

    return errorResponse(error);
  }

  const hashedPasswordResult = await ResultAsync.fromPromise(
    HashingHelper.hash({ value: parsedData.password }),
    (error) =>
      new BookleafError(
        ErrorType.GENERIC_ERROR,
        "Error occurred in /api/admin/admins: error in hashing",
        { cause: error },
      ),
  );
  if (hashedPasswordResult.isErr()) {
    return errorResponse(hashedPasswordResult.error);
  }

  const newAdminResult = await ResultAsync.fromPromise(
    AdminDal.create({
      name: parsedData.name,
      email: parsedData.email,
      passwordHash: hashedPasswordResult.value,
    }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/admin/admins: DB error while creating new admin",
        { cause: error },
      ),
  );
  if (newAdminResult.isErr()) {
    return errorResponse(newAdminResult.error);
  }

  const newAdmin = newAdminResult.value;

  return NextResponse.json(
    { admin: { ...newAdmin, role: Role.ADMIN } },
    { status: 201 },
  );
};
