import { NextRequest, NextResponse } from "next/server";
import { ResultAsync } from "neverthrow";

import { AuthorDal } from "@/dal/author.dal";

import { errorResponse } from "@/helpers/error-response";
import { HashingHelper } from "@/helpers/hashing.helper";

import { registerValidator } from "@/validators/register.validator";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";
import { Role } from "@/enums/role.enum";

export const POST = async (req: NextRequest) => {
  const bodyResult = await ResultAsync.fromPromise(
    req.json(),
    (error) =>
      new BookleafError(
        ErrorType.INVALID_INPUT,
        "Error occured in /api/auth/register: Invalid request body",
        { cause: error },
      ),
  );
  if (bodyResult.isErr()) {
    return errorResponse(bodyResult.error);
  }

  const body = bodyResult.value;

  const parsingResult = await registerValidator.safeParseAsync(body);
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
    AuthorDal.getByEmail({ email: parsedData.email }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/auth/register: DB error while getting existing author by email",
        { cause: error },
      ),
  );
  if (existingDataResult.isErr()) {
    return errorResponse(existingDataResult.error);
  }

  const existingData = existingDataResult.value;
  if (existingData) {
    const error = new BookleafError(
      ErrorType.CONFLICT,
      "Error occurred in /api/auth/register: Author already exists with the provided email",
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
        "Error occurred in /api/auth/register: error in hashing",
        { cause: error },
      ),
  );
  if (hashedPasswordResult.isErr()) {
    return errorResponse(hashedPasswordResult.error);
  }

  const hashedPassword = hashedPasswordResult.value;

  const newAuthorResult = await ResultAsync.fromPromise(
    AuthorDal.create({
      name: parsedData.name,
      email: parsedData.email,
      city: parsedData.city,
      phone: parsedData.phone,
      passwordHash: hashedPassword,
    }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        "Error occurred in /api/auth/register: DB error while creating new author",
        { cause: error },
      ),
  );
  if (newAuthorResult.isErr()) {
    return errorResponse(newAuthorResult.error);
  }

  const newAuthor = newAuthorResult.value;

  return NextResponse.json(
    { author: { ...newAuthor, role: Role.AUTHOR } },
    { status: 201 },
  );
};
