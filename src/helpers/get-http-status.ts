import "server-only";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

export const getHttpStatus = (error: BookleafError) => {
  switch (error.type) {
    case ErrorType.INVALID_INPUT:
      return 400;
    case ErrorType.DATABASE_ERROR:
      return 500;
    case ErrorType.UNAUTHORIZED:
      return 401;
    case ErrorType.GENERIC_ERROR:
      return 500;
    case ErrorType.NOT_FOUND:
      return 404;
    case ErrorType.CONFLICT:
      return 409;
    case ErrorType.AI_UNAVAILABLE:
      return 503;
    default:
      return 500;
  }
};
