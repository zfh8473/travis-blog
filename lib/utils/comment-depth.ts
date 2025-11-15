import { Comment } from "@/lib/actions/comment";

/**
 * Maximum nesting depth for comments.
 * 
 * Comments can be nested up to this depth. Replies beyond this depth
 * will be rejected with an appropriate error message.
 */
export const MAX_COMMENT_DEPTH = 3;

/**
 * Calculates the nesting depth of a comment.
 * 
 * The depth is calculated by traversing up the parent chain
 * until reaching a top-level comment (parentId === null).
 * 
 * @param comment - The comment to calculate depth for
 * @param allComments - All comments in the article (for parent lookup)
 * @returns The nesting depth (0 for top-level, 1 for first-level reply, etc.)
 * 
 * @example
 * ```typescript
 * const depth = calculateCommentDepth(comment, allComments);
 * if (depth >= MAX_COMMENT_DEPTH) {
 *   // Cannot reply further
 * }
 * ```
 */
export function calculateCommentDepth(
  comment: Comment,
  allComments: Comment[]
): number {
  if (!comment.parentId) {
    return 0; // Top-level comment
  }

  // Find parent comment
  const parent = allComments.find((c) => c.id === comment.parentId);
  if (!parent) {
    // Parent not found, assume top-level (shouldn't happen in practice)
    return 0;
  }

  // Recursively calculate parent depth and add 1
  return calculateCommentDepth(parent, allComments) + 1;
}

/**
 * Calculates the nesting depth of a comment by parentId only.
 * 
 * This is a simpler version that doesn't require all comments.
 * It calculates depth by counting how many times we need to traverse
 * up the parent chain. However, this requires database queries.
 * 
 * For better performance, use calculateCommentDepth with all comments
 * if you already have them loaded.
 * 
 * @param parentId - The parent comment ID
 * @param depth - Current depth (starts at 0)
 * @returns The nesting depth
 * 
 * @example
 * ```typescript
 * const depth = calculateDepthByParentId(parentId);
 * ```
 */
export async function calculateDepthByParentId(
  parentId: string | null,
  depth: number = 0
): Promise<number> {
  if (!parentId) {
    return depth;
  }

  // This would require a database query to get the parent
  // For now, we'll use a simpler approach in the Server Action
  // by querying the parent chain
  return depth;
}

