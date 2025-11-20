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
export const registrationSchema = z
  .object({
    email: z
      .string()
      .min(1, "邮箱地址是必填项")
      .email("邮箱格式无效"),
    password: z
      .string()
      .min(8, "密码长度至少为 8 个字符")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)/,
        "密码必须包含至少一个字母和一个数字"
      ),
    confirmPassword: z
      .string()
      .min(1, "请确认您的密码"),
    name: z
      .string()
      .max(100, "姓名长度不能超过 100 个字符")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
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
    .min(1, "邮箱地址是必填项")
    .email("邮箱格式无效"),
  password: z
    .string()
    .min(1, "密码是必填项"),
});

/**
 * Type inference for registration input.
 */
export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * Type inference for login input.
 */
export type LoginInput = z.infer<typeof loginSchema>;

