import { z } from "zod";

/**
 * Create comment input validation schema.
 * 
 * Validates comment creation data including content, articleId,
 * and optional fields for logged-in vs anonymous users.
 * 
 * @example
 * ```typescript
 * const result = createCommentSchema.safeParse({
 *   content: "Great article!",
 *   articleId: "clx123...",
 *   userId: "clx456...", // Optional for logged-in users
 *   authorName: "Anonymous User" // Optional for anonymous users
 * });
 * 
 * if (result.success) {
 *   // Use validated data
 * } else {
 *   // Handle validation errors
 * }
 * ```
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(5000, "Comment content must be less than 5000 characters"),
  articleId: z
    .string()
    .min(1, "Article ID is required"),
  userId: z
    .string()
    .optional()
    .nullable(),
  parentId: z
    .string()
    .optional()
    .nullable(),
  authorName: z
    .string()
    .min(1, "Name is required for anonymous comments")
    .max(100, "Name must be less than 100 characters")
    .optional(),
}).refine(
  (data) => {
    // If userId is null/undefined, authorName must be provided (anonymous comment)
    // If userId is provided, authorName is optional (logged-in user)
    if (!data.userId && !data.authorName) {
      return false;
    }
    return true;
  },
  {
    message: "姓名是必填项（匿名用户）",
    path: ["authorName"],
  }
);

/**
 * Get comments input validation schema.
 * 
 * Validates articleId for fetching comments.
 * 
 * @example
 * ```typescript
 * const result = getCommentsSchema.safeParse({
 *   articleId: "clx123..."
 * });
 * ```
 */
export const getCommentsSchema = z.object({
  articleId: z
    .string()
    .min(1, "Article ID is required"),
});

/**
 * Type inference for create comment input.
 */
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * Type inference for get comments input.
 */
export type GetCommentsInput = z.infer<typeof getCommentsSchema>;

