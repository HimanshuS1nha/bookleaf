import z from "zod";

import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/constants/ticket";

// Output schema the model must follow when classifying a new ticket.
// The descriptions are sent to the model as part of the schema.
export const ticketTriageValidator = z.object({
  category: z
    .enum(TICKET_CATEGORIES)
    .describe(
      "royalty_and_payments: royalty amounts, payouts, bank details, sales figures. " +
        "isbn_and_metadata: wrong or duplicate ISBNs, book description, author bio, listing details. " +
        "printing_and_quality: misprints, binding defects, blurry images, author copies, print turnaround. " +
        "distribution_and_availability: book missing or unavailable on Amazon, Flipkart or the BookLeaf Store. " +
        "book_status_and_production_updates: where a book is in editing, cover design, typesetting, proofreading or printing. " +
        "general_inquiry: anything else, such as packages, policies or how BookLeaf works.",
    ),
  priority: z
    .enum(TICKET_PRIORITIES)
    .describe(
      "critical: the author is losing money or sales right now, e.g. royalties unpaid for several months, " +
        "the book unavailable everywhere, wrong ISBN on copies already in stores, or a legal/rights issue. " +
        "high: ISBN errors of any kind, the book unavailable on one platform, defective printed copies, " +
        "a payout that may be overdue, or production stalled well past normal timelines. " +
        "medium: needs action but nothing is broken or losing money, e.g. a production status check " +
        "or a royalty amount the author wants explained. " +
        "low: general questions and simple update requests, e.g. changing an author bio.",
    ),
});

export type TicketTriageValidatorType = z.infer<typeof ticketTriageValidator>;
