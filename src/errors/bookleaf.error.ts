import { ErrorType } from "@/enums/error.enum";

export class BookleafError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    options?: ErrorOptions,
    public readonly entity?: string,
  ) {
    super(message, options);
  }
}
