/**
 * Unified action result type for Server Actions.
 * 
 * Follows the architecture document's error handling pattern:
 * - Success: { success: true, data: T }
 * - Error: { success: false, error: { message: string, code: string } }
 * 
 * @template T - The type of data returned on success
 * 
 * @example
 * ```typescript
 * const result: ActionResult<Comment> = await createCommentAction(data);
 * if (result.success) {
 *   console.log('Comment created:', result.data);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

