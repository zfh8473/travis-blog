import { z } from "zod";

/**
 * Registration input validation schema.
 * 
 * Validates user registration data including email format and password requirements.
 * Email must be a valid RFC 5322 compliant email address.
 * Password must be at least 8 characters long and contain both letters and numbers.
 * 
 * @example
 * ```typescript
 * const result = registrationSchema.safeParse({
 *   email: "user@example.com",
 *   password: "password123",
 *   name: "John Doe"
 * });
 * 
 * if (result.success) {
 *   // Use validated data
 * } else {
 *   // Handle validation errors
 * }
 * ```
 */
export const registrationSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    ),
  name: z
    .string()
    .max(100, "Name must be less than 100 characters")
    .optional()
    .or(z.literal("")),
});

/**
 * Login input validation schema.
 * 
 * Validates user login credentials (email and password).
 * 
 * @example
 * ```typescript
 * const result = loginSchema.safeParse({
 *   email: "user@example.com",
 *   password: "password123"
 * });
 * ```
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required"),
});

/**
 * Type inference for registration input.
 */
export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * Type inference for login input.
 */
export type LoginInput = z.infer<typeof loginSchema>;

