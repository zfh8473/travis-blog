"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db/prisma";
import { createCommentSchema, getCommentsSchema } from "@/lib/validations/comment";
import { ActionResult } from "@/lib/types/action-result";
import DOMPurify from "isomorphic-dompurify";
import { MAX_COMMENT_DEPTH } from "@/lib/utils/comment-depth";

/**
 * Comment data type with user information.
 */
export interface Comment {
  id: string;
  content: string;
  articleId: string;
  userId: string | null;
  parentId: string | null;
  authorName: string | null; // Name for anonymous comments
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  replies?: Comment[];
}

/**
 * Input type for creating a comment.
 */
export interface CreateCommentInput {
  content: string;
  articleId: string;
  userId?: string | null;
  parentId?: string | null;
  authorName?: string;
}

/**
 * Server action to create a new comment or reply.
 * 
 * This action handles comment creation on the server side,
 * including validation, authorization checks, and database operations.
 * Supports both logged-in users and anonymous users.
 * 
 * When creating a reply (parentId is provided):
 * - Validates that parent comment exists
 * - Validates that parent comment belongs to the same article
 * - Validates that maximum nesting depth (3 levels) is not exceeded
 * 
 * @param data - Comment data including content, articleId, and optional userId/parentId/authorName
 * @returns Promise resolving to the created comment or an error
 * 
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundError} If article or parent comment doesn't exist
 * @throws {MaxDepthExceededError} If maximum nesting depth would be exceeded
 * 
 * @example
 * ```typescript
 * // Create a top-level comment
 * const result = await createCommentAction({
 *   content: "Great article!",
 *   articleId: "article-123",
 *   userId: "user-456"
 * });
 * 
 * // Create a reply
 * const replyResult = await createCommentAction({
 *   content: "I agree!",
 *   articleId: "article-123",
 *   parentId: "comment-789",
 *   userId: "user-456"
 * });
 * 
 * if (result.success) {
 *   console.log('Comment created:', result.data);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export async function createCommentAction(
  data: CreateCommentInput
): Promise<ActionResult<Comment>> {
  try {
    // Validate input
    const validationResult = createCommentSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          message: validationResult.error.issues[0]?.message || "Validation failed",
          code: "VALIDATION_ERROR",
        },
      };
    }

    const validatedData = validationResult.data;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: validatedData.articleId },
      select: { id: true },
    });

    if (!article) {
      return {
        success: false,
        error: {
          message: "Article not found",
          code: "ARTICLE_NOT_FOUND",
        },
      };
    }

    // If this is a reply (parentId is provided), validate parent comment
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
        select: {
          id: true,
          articleId: true,
          parentId: true,
        },
      });

      if (!parentComment) {
        return {
          success: false,
          error: {
            message: "Parent comment not found",
            code: "PARENT_COMMENT_NOT_FOUND",
          },
        };
      }

      // Verify parent comment belongs to the same article
      if (parentComment.articleId !== validatedData.articleId) {
        return {
          success: false,
          error: {
            message: "Parent comment does not belong to this article",
            code: "INVALID_PARENT_COMMENT",
          },
        };
      }

      // Calculate nesting depth by traversing up the parent chain
      let currentParentId: string | null = parentComment.parentId;
      let depth = 1; // Start at 1 (parent is depth 0, this reply would be depth 1)

      while (currentParentId && depth < MAX_COMMENT_DEPTH) {
        const currentParent = await prisma.comment.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

        if (!currentParent) {
          break; // Shouldn't happen, but handle gracefully
        }

        currentParentId = currentParent.parentId;
        depth++;
      }

      // Check if maximum depth would be exceeded
      if (depth >= MAX_COMMENT_DEPTH) {
        return {
          success: false,
          error: {
            message: `已达到最大回复深度（${MAX_COMMENT_DEPTH} 层）`,
            code: "MAX_DEPTH_EXCEEDED",
          },
        };
      }
    }

    // Get user session (if logged in)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || validatedData.userId || null;

    // Sanitize comment content to prevent XSS
    // Remove all HTML tags - comments are plain text only
    const sanitizedContent = DOMPurify.sanitize(validatedData.content, {
      ALLOWED_TAGS: [], // No HTML tags allowed in comments
      ALLOWED_ATTR: [],
    });

    // Create comment in database
    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        articleId: validatedData.articleId,
        userId: userId,
        parentId: validatedData.parentId || null,
        authorName: userId ? null : validatedData.authorName || null, // Store authorName only for anonymous comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Transform to Comment interface
    const commentData: Comment = {
      id: comment.id,
      content: comment.content,
      articleId: comment.articleId,
      userId: comment.userId,
      parentId: comment.parentId,
      authorName: comment.authorName,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user,
    };

    return {
      success: true,
      data: commentData,
    };
  } catch (error) {
    console.error("Error creating comment:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to create comment",
        code: "INTERNAL_ERROR",
      },
    };
  }
}

/**
 * Server action to get all comments for an article.
 * 
 * Returns comments with nested replies in a hierarchical structure.
 * Comments are sorted by creation time (newest first).
 * 
 * @param articleId - The ID of the article
 * @returns Promise resolving to array of top-level comments with nested replies
 * 
 * @example
 * ```typescript
 * const comments = await getCommentsAction("article-123");
 * ```
 */
export async function getCommentsAction(
  articleId: string
): Promise<Comment[]> {
  try {
    // Validate input
    const validationResult = getCommentsSchema.safeParse({ articleId });
    if (!validationResult.success) {
      console.error("Invalid articleId:", validationResult.error);
      return [];
    }

    // Query all comments for the article (including all nested replies)
    // First, get all comments for this article
    const allCommentsRaw = await prisma.comment.findMany({
      where: {
        articleId: articleId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Sort all comments by creation time
      },
    });

    // Build nested structure in memory
    // Create a map for quick lookup
    const commentMap = new Map<string, any>();
    const topLevelComments: any[] = [];

    // First pass: create comment objects with user info
    allCommentsRaw.forEach((comment) => {
      commentMap.set(comment.id, {
        id: comment.id,
        content: comment.content,
        articleId: comment.articleId,
        userId: comment.userId,
        parentId: comment.parentId,
        authorName: comment.authorName,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
        replies: [],
      });
    });

    // Second pass: build nested structure
    allCommentsRaw.forEach((comment) => {
      const commentData = commentMap.get(comment.id)!;
      if (comment.parentId) {
        // This is a reply, add it to parent's replies array
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentData);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentData);
      }
    });

    // Sort top-level comments by creation time (newest first)
    topLevelComments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Sort replies within each comment (oldest first)
    const sortReplies = (comment: any) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a: any, b: any) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        // Recursively sort nested replies
        comment.replies.forEach(sortReplies);
      }
    };
    topLevelComments.forEach(sortReplies);

    const comments = topLevelComments;

    // Transform to Comment interface (recursively transform replies)
    const transformComment = (comment: any): Comment => {
      return {
        id: comment.id,
        content: comment.content,
        articleId: comment.articleId,
        userId: comment.userId,
        parentId: comment.parentId,
        authorName: comment.authorName,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
        replies: comment.replies && comment.replies.length > 0
          ? comment.replies.map((reply: any) => transformComment(reply))
          : undefined,
      };
    };

    const commentsData: Comment[] = comments.map(transformComment);

    return commentsData;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

/**
 * Server action to delete a comment.
 * 
 * This action handles comment deletion on the server side,
 * including authentication, authorization checks, and database operations.
 * Only administrators can delete comments.
 * 
 * When deleting a parent comment, all replies are automatically deleted
 * due to cascade delete configuration in Prisma schema (onDelete: Cascade).
 * 
 * @param commentId - The ID of the comment to delete
 * @returns Promise resolving to success result or an error
 * 
 * @throws {UnauthorizedError} If user is not authenticated (401)
 * @throws {ForbiddenError} If user is not an admin (403)
 * @throws {NotFoundError} If comment doesn't exist (404)
 * 
 * @example
 * ```typescript
 * const result = await deleteCommentAction("comment-123");
 * 
 * if (result.success) {
 *   console.log('Comment deleted:', result.data);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export async function deleteCommentAction(
  commentId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    if (!commentId || typeof commentId !== "string" || commentId.trim().length === 0) {
      return {
        success: false,
        error: {
          message: "Comment ID is required",
          code: "INVALID_INPUT",
        },
      };
    }

    // Get user session
    const session = await getServerSession(authOptions);
    const user = session?.user;

    // Check authentication and admin role
    // Note: requireAdmin expects UserInfo type, but we have session.user
    // We need to check manually or convert session.user to UserInfo format
    if (!user) {
      return {
        success: false,
        error: {
          message: "请先登录",
          code: "UNAUTHORIZED",
        },
      };
    }

    // Check if user is admin
    // Note: session.user.role is a string, check against "ADMIN"
    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: {
          message: "您没有权限执行此操作",
          code: "FORBIDDEN",
        },
      };
    }

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!existingComment) {
      return {
        success: false,
        error: {
          message: "Comment not found",
          code: "COMMENT_NOT_FOUND",
        },
      };
    }

    // Delete comment (cascade delete handled automatically by Prisma schema)
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return {
      success: true,
      data: { id: commentId },
    };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to delete comment",
        code: "INTERNAL_ERROR",
      },
    };
  }
}

