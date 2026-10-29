import z from "zod";

export const createTicketNoteValidator = z.object({
  note: z
    .string("Note is required")
    .trim()
    .min(1, "Note is required")
    .max(5000, "Note can be a maximum of 5000 characters"),
});

export type CreateTicketNoteValidatorType = z.infer<
  typeof createTicketNoteValidator
>;
