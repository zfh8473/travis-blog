import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "留言内容不能为空")
    .max(5000, "留言内容不能超过 5000 字"),
  articleId: z.string().min(1, "Article ID is required"),
  userId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  authorName: z
    .string()
    .min(1, "姓名是必填项（匿名用户）")
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
