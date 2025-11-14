import { z } from "zod";

/**
 * Article status enumeration values.
 * Matches Prisma ArticleStatus enum: DRAFT, PUBLISHED
 */
export const ArticleStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
} as const;

export type ArticleStatusType = typeof ArticleStatus[keyof typeof ArticleStatus];

/**
 * Create article input validation schema.
 * 
 * Validates article creation data including title, content, excerpt,
 * categoryId, tagIds, and status.
 * 
 * @example
 * ```typescript
 * const result = createArticleSchema.safeParse({
 *   title: "My Article",
 *   content: "<p>Article content</p>",
 *   excerpt: "Article excerpt",
 *   categoryId: "clx123...",
 *   tagIds: ["clx456...", "clx789..."],
 *   status: "PUBLISHED"
 * });
 * 
 * if (result.success) {
 *   // Use validated data
 * } else {
 *   // Handle validation errors
 * }
 * ```
 */
export const createArticleSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  content: z
    .string()
    .min(1, "Content is required"),
  excerpt: z
    .string()
    .max(500, "Excerpt must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  categoryId: z
    .string()
    .uuid("Category ID must be a valid UUID")
    .optional()
    .or(z.literal("")),
  tagIds: z
    .array(z.string().uuid("Tag ID must be a valid UUID"))
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED"], {
    required_error: "Status is required",
    invalid_type_error: "Status must be either DRAFT or PUBLISHED",
  }),
});

/**
 * Update article input validation schema.
 * 
 * Validates article update data. All fields are optional to allow partial updates.
 * 
 * @example
 * ```typescript
 * const result = updateArticleSchema.safeParse({
 *   title: "Updated Title",
 *   status: "PUBLISHED"
 * });
 * 
 * if (result.success) {
 *   // Use validated data
 * } else {
 *   // Handle validation errors
 * }
 * ```
 */
export const updateArticleSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .optional(),
  excerpt: z
    .string()
    .max(500, "Excerpt must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  categoryId: z
    .string()
    .uuid("Category ID must be a valid UUID")
    .optional()
    .or(z.literal("")),
  tagIds: z
    .array(z.string().uuid("Tag ID must be a valid UUID"))
    .optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED"], {
      invalid_type_error: "Status must be either DRAFT or PUBLISHED",
    })
    .optional(),
});

/**
 * Type inference for create article input.
 */
export type CreateArticleInput = z.infer<typeof createArticleSchema>;

/**
 * Type inference for update article input.
 */
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

