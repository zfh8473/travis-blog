import { z } from "zod";

/**
 * Profile update input validation schema.
 * 
 * Validates user profile update data including name, bio, and image path.
 * All fields are optional to allow partial updates.
 * 
 * @example
 * ```typescript
 * const result = profileUpdateSchema.safeParse({
 *   name: "John Doe",
 *   bio: "Software developer",
 *   image: "uploads/avatar.jpg"
 * });
 * 
 * if (result.success) {
 *   // Use validated data
 * } else {
 *   // Handle validation errors
 * }
 * ```
 */
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .max(100, "Name must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  image: z
    .string()
    .optional()
    .or(z.literal("")),
});

/**
 * Avatar upload validation schema.
 * 
 * Validates avatar file upload including file type and size.
 * Only image files are allowed (jpg, jpeg, png, gif, webp).
 * Maximum file size is 5MB.
 * 
 * Note: This schema is used for client-side validation.
 * Server-side validation should also check the actual file object.
 * 
 * @example
 * ```typescript
 * const result = avatarUploadSchema.safeParse({
 *   file: fileObject
 * });
 * ```
 */
export const avatarUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        return allowedTypes.includes(file.type);
      },
      {
        message: "File must be an image (jpg, jpeg, png, gif, or webp)",
      }
    )
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB
      {
        message: "File size must be less than 5MB",
      }
    ),
});

/**
 * Type inference for profile update input.
 */
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Type inference for avatar upload input.
 */
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;

