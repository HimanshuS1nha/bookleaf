import z from "zod";

// Category and priority aren't chosen by the author, AI triage sets them
export const createTicketValidator = z.object({
  // null raises a general / account level ticket
  bookId: z.uuid("Choose a book").nullable(),
  subject: z
    .string("Subject is required")
    .trim()
    .min(1, "Subject is required")
    .max(255, "Subject can be a maximum of 255 characters"),
  description: z
    .string("Description is required")
    .trim()
    .min(1, "Description is required")
    .max(5000, "Description can be a maximum of 5000 characters"),
});

export type CreateTicketValidatorType = z.infer<typeof createTicketValidator>;
