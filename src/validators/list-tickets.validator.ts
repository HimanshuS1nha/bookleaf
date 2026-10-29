import z from "zod";

import {
  TICKET_ASSIGNMENTS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKETS_PAGE_SIZE,
} from "@/constants/ticket";

// Query params arrive as strings, so numbers are coerced
const baseListTicketsObject = z.object({
  search: z
    .string()
    .trim()
    .max(255, "Search can be a maximum of 255 characters")
    .optional(),
  status: z.array(z.enum(TICKET_STATUSES, "Status is invalid")).default([]),
  // Full timestamps so the client decides where its local day starts and ends
  from: z.iso
    .datetime({ offset: true, error: "From must be a valid date" })
    .optional(),
  to: z.iso
    .datetime({ offset: true, error: "To must be a valid date" })
    .optional(),
  page: z.coerce.number("Page must be a number").int().min(1).default(1),
  pageSize: z.coerce
    .number("Page size must be a number")
    .int()
    .min(1)
    .max(100, "Page size can be a maximum of 100")
    .default(TICKETS_PAGE_SIZE),
});

const isDateRangeValid = (values: { from?: string; to?: string }) =>
  !values.from || !values.to || values.from <= values.to;

const dateRangeError = { error: "From must be before To", path: ["to"] };

export const listTicketsValidator = baseListTicketsObject.refine(
  isDateRangeValid,
  dateRangeError,
);

export const listAdminTicketsValidator = baseListTicketsObject
  .extend({
    priority: z
      .array(z.enum(TICKET_PRIORITIES, "Priority is invalid"))
      .default([]),
    category: z
      .array(z.enum(TICKET_CATEGORIES, "Category is invalid"))
      .default([]),
    assignment: z
      .enum(TICKET_ASSIGNMENTS, "Assignment is invalid")
      .default("all"),
  })
  .refine(isDateRangeValid, dateRangeError);

export type ListTicketsValidatorType = z.infer<typeof listTicketsValidator>;
export type ListAdminTicketsValidatorType = z.infer<
  typeof listAdminTicketsValidator
>;
