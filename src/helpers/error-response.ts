import "server-only";

import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";

import { getUserFacingErrorMessage } from "@/helpers/get-user-facing-error-message";
import { getHttpStatus } from "@/helpers/get-http-status";

import { BookleafError } from "@/errors/bookleaf.error";

export const errorResponse = (error: BookleafError) => {
  logger.error(error);

  return NextResponse.json(
    { message: getUserFacingErrorMessage(error) },
    { status: getHttpStatus(error) },
  );
};
