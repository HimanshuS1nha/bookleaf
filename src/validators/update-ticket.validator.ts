import z from "zod";

import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/constants/ticket";

// Every field is optional so admins can change one thing at a time
export const updateTicketValidator = z
  .object({
    status: z.enum(TICKET_STATUSES, "Status is invalid").optional(),
    priority: z.enum(TICKET_PRIORITIES, "Priority is invalid").optional(),
    category: z.enum(TICKET_CATEGORIES, "Category is invalid").optional(),
    // null unassigns the ticket
    assignedTo: z.uuid("Assignee is invalid").nullable().optional(),
    // An empty message clears it
    responseMessage: z
      .string("Fulfillment message must be text")
      .trim()
      .max(5000, "Fulfillment message can be a maximum of 5000 characters")
      .transform((value) => value || null)
      .nullable()
      .optional(),
  })
  .refine((values) => Object.values(values).some((v) => v !== undefined), {
    error: "Nothing to update",
  });

export type UpdateTicketValidatorType = z.infer<typeof updateTicketValidator>;
