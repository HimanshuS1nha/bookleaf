import "server-only";

import { ResultAsync } from "neverthrow";

import { BookDal } from "@/dal/book.dal";
import { TicketDal } from "@/dal/ticket.dal";

import { logger } from "@/lib/logger";

import { TicketAiHelper } from "@/helpers/ticket-ai.helper";

import { TicketCategory } from "@/constants/ticket";

import { BookleafError } from "@/errors/bookleaf.error";

import { ErrorType } from "@/enums/error.enum";

type TriageTicket = {
  id: string;
  bookId: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
};

type AuthorBooks = Awaited<ReturnType<typeof BookDal.getAllByAuthorId>>;

const loadAuthorBooks = ({
  authorId,
  route,
}: {
  authorId: string;
  route: string;
}) =>
  ResultAsync.fromPromise(
    BookDal.getAllByAuthorId({ authorId }),
    (error) =>
      new BookleafError(
        ErrorType.DATABASE_ERROR,
        `Error occurred in ${route}: DB error while getting books for AI triage`,
        { cause: error },
      ),
  );

const writeDraft = ({
  ticket,
  authorName,
  authorBooks,
  route,
}: {
  ticket: TriageTicket;
  authorName: string;
  authorBooks: AuthorBooks;
  route: string;
}) => {
  const book = authorBooks.find((item) => item.id === ticket.bookId) ?? null;

  return ResultAsync.fromPromise(
    TicketAiHelper.draftResponse({
      authorName,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      book,
      // The linked book is enough context; only account-level tickets need the rest
      authorBooks: book ? [] : authorBooks,
    }),
    (error) =>
      new BookleafError(
        ErrorType.AI_UNAVAILABLE,
        `Error occurred in ${route}: AI draft failed`,
        { cause: error },
      ),
  ).andThen((aiResponse) =>
    ResultAsync.fromPromise(
      TicketDal.updateAiResponse({ id: ticket.id, aiResponse }),
      (error) =>
        new BookleafError(
          ErrorType.DATABASE_ERROR,
          `Error occurred in ${route}: DB error while saving AI draft`,
          { cause: error },
        ),
    ).map(() => aiResponse),
  );
};

export class TicketTriageHelper {
  // Classifies a new ticket, then drafts a reply using the category it settled
  // on. Each step fails on its own: a failed classification still gets a draft
  // written against the default category. Errors are logged, not thrown,
  // because this runs after the response has been sent.
  static async triage({
    ticket,
    authorId,
    authorName,
    route,
  }: {
    ticket: TriageTicket;
    authorId: string;
    authorName: string;
    route: string;
  }) {
    const booksResult = await loadAuthorBooks({ authorId, route });
    if (booksResult.isErr()) {
      logger.error(booksResult.error);
      return;
    }

    const authorBooks = booksResult.value;
    const book = authorBooks.find((item) => item.id === ticket.bookId) ?? null;

    const classifyResult = await ResultAsync.fromPromise(
      TicketAiHelper.classify({
        subject: ticket.subject,
        description: ticket.description,
        book,
      }),
      (error) =>
        new BookleafError(
          ErrorType.AI_UNAVAILABLE,
          `Error occurred in ${route}: AI classification failed`,
          { cause: error },
        ),
    ).andThen((classification) =>
      ResultAsync.fromPromise(
        TicketDal.updateAiClassification({
          id: ticket.id,
          category: classification.category,
          priority: classification.priority,
        }),
        (error) =>
          new BookleafError(
            ErrorType.DATABASE_ERROR,
            `Error occurred in ${route}: DB error while saving AI classification`,
            { cause: error },
          ),
      ).map(() => classification),
    );
    if (classifyResult.isErr()) {
      logger.error(classifyResult.error);
    }

    const draftResult = await writeDraft({
      ticket: {
        ...ticket,
        category: classifyResult.isOk()
          ? classifyResult.value.category
          : ticket.category,
      },
      authorName,
      authorBooks,
      route,
    });
    if (draftResult.isErr()) {
      logger.error(draftResult.error);
    }
  }

  // Writes a fresh draft for an existing ticket using its current category,
  // so an admin's category override is reflected in the new draft
  static redraft({
    ticket,
    authorId,
    authorName,
    route,
  }: {
    ticket: TriageTicket;
    authorId: string;
    authorName: string;
    route: string;
  }) {
    return loadAuthorBooks({ authorId, route }).andThen((authorBooks) =>
      writeDraft({ ticket, authorName, authorBooks, route }),
    );
  }
}
