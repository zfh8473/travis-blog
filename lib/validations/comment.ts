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
    .max(50, "昵称不能超过 50 个字符")
    .nullable()
    .optional()
    .transform((val) => val || null), // Convert empty string to null
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
