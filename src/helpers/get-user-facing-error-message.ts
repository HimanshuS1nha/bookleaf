import "server-only";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

export const getUserFacingErrorMessage = (error: BookleafError) => {
  switch (error.type) {
    case ErrorType.INVALID_INPUT:
      return "Invalid input. Please check your request.";
    case ErrorType.DATABASE_ERROR:
      return "Some error occurred. Please try again later!";
    case ErrorType.UNAUTHORIZED:
      return "Unauthorized";
    case ErrorType.GENERIC_ERROR:
      return "Some error occurred. Please try again later!";
    case ErrorType.NOT_FOUND:
      return error.entity ? `${error.entity} not found` : "Not found";
    case ErrorType.CONFLICT:
      return error.entity
        ? `${error.entity} already exists`
        : "Data already exists";
    case ErrorType.AI_UNAVAILABLE:
      return "The AI assistant is unavailable right now. Try again in a minute, or write the reply yourself.";
    default:
      return "Some error occurred. Please try again later!";
  }
};
