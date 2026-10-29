import z from "zod";

export const loginValidator = z.object({
  email: z.email("Email must be valid"),
  password: z.string("Password is required").min(1, "Password is required"),
});

export type LoginValidatorType = z.infer<typeof loginValidator>;
