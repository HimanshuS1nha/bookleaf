import z from "zod";

export const registerValidator = z
  .object({
    name: z
      .string("Name is required")
      .trim()
      .min(1, "Name is required")
      .max(255, "Name can be a maximum of 255 characters"),
    email: z
      .email("Email must be valid")
      .max(255, "Email can be a maximum of 255 characters"),
    city: z
      .string("City is required")
      .trim()
      .min(1, "City is required")
      .max(255, "City can be a maximum of 255 characters"),
    phone: z
      .string("Phone is required")
      .trim()
      .regex(/^\+?[0-9]{7,15}$/, "Phone must be a valid phone number"),
    password: z
      .string("Password is required")
      .trim()
      .min(8, "Password must be atleast 8 characters long")
      .max(100, "Password can be a maximum of 100 characters long"),
    confirmPassword: z
      .string("Password is required")
      .trim()
      .min(8, "Password must be atleast 8 characters long")
      .max(100, "Password can be a maximum of 100 characters long"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterValidatorType = z.infer<typeof registerValidator>;
