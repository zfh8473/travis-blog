"use client";

import { useState, FormEvent } from "react";
import { Session } from "next-auth";
import { createCommentAction } from "@/lib/actions/comment";
import { createCommentSchema } from "@/lib/validations/comment";

/**
 * Comment form component props.
 */
export interface CommentFormProps {
  articleId: string;
  parentId?: string;
  parentAuthorName?: string; // Author name of parent comment (for reply mode)
  onSuccess?: () => void;
  onCancel?: () => void; // Callback to close reply form
  isReply?: boolean; // Whether this form is for a reply
  session?: Session | null; // Session information from server (optional for backward compatibility)
}

/**
 * Comment form component.
 * 
 * Client Component for submitting comments and replies. Supports both logged-in
 * and anonymous users. For logged-in users, name is auto-filled from session.
 * For anonymous users, name input is shown.
 * 
 * When used in reply mode (isReply=true), displays visual indication and
 * supports cancel button to close the form.
 * 
 * @component
 * @param props - Component props
 * @param props.articleId - The ID of the article to comment on
 * @param props.parentId - Optional parent comment ID for replies
 * @param props.parentAuthorName - Optional parent comment author name (for reply mode)
 * @param props.onSuccess - Optional callback when comment is successfully created
 * @param props.onCancel - Optional callback to close reply form
 * @param props.isReply - Whether this form is for a reply (defaults to !!parentId)
 * 
 * @example
 * ```tsx
 * // Top-level comment form (with session from server)
 * <CommentForm 
 *   articleId="article-123"
 *   session={session}
 *   onSuccess={() => router.refresh()}
 * />
 * 
 * // Reply form
 * <CommentForm 
 *   articleId="article-123"
 *   parentId="comment-456"
 *   parentAuthorName="John Doe"
 *   isReply={true}
 *   session={session}
 *   onSuccess={() => setShowReplyForm(false)}
 *   onCancel={() => setShowReplyForm(false)}
 * />
 * ```
 */
export default function CommentForm({
  articleId,
  parentId,
  parentAuthorName,
  onSuccess,
  onCancel,
  isReply,
  session: sessionProp,
}: CommentFormProps) {
  const isReplyMode = isReply ?? !!parentId;
  // Use session from props (from server) instead of useSession hook
  // This avoids client-side session queries and improves performance
  const session = sessionProp ?? null;
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isLoggedIn = !!session?.user;
  const displayName = session?.user?.name || authorName;

  /**
   * Handles form submission.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    // Basic HTML5 validation check
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Client-side validation
      const validationResult = createCommentSchema.safeParse({
        content,
        articleId,
        userId: session?.user?.id || null,
        parentId: parentId || null,
        authorName: isLoggedIn ? undefined : (authorName || undefined),
      });

      if (!validationResult.success) {
        setError(validationResult.error.issues[0]?.message || "验证失败");
        setIsSubmitting(false);
        return;
      }

      // Call Server Action
      const result = await createCommentAction(validationResult.data);

      if (result.success) {
        setSuccess(true);
        // Reset form
        setContent("");
        if (!isLoggedIn) {
          setAuthorName("");
        }
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Fallback: reload page if no callback provided
          // This should not happen in normal usage with CommentFormWrapper
          window.location.reload();
        }
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("提交留言时发生错误，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${isReplyMode ? "ml-8 mt-2 border-l-2 border-gray-200 pl-4" : ""}`}>
      {/* Reply mode indication */}
      {isReplyMode && parentAuthorName && (
        <div className="text-sm text-gray-600 mb-2">
          回复 <span className="font-medium text-blue-600">@{parentAuthorName}</span>
        </div>
      )}

      {/* Name input for anonymous users */}
      {!isLoggedIn && (
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
            姓名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="authorName"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入您的姓名"
            required
            maxLength={100}
          />
        </div>
      )}

      {/* Comment content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          留言内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="请输入您的留言..."
          required
          maxLength={5000}
        />
        <div className="mt-1 text-sm text-gray-500 text-right">
          {content.length} / 5000
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          留言提交成功！
        </div>
      )}

      {/* Submit and Cancel buttons */}
      <div className="flex justify-end gap-2">
        {isReplyMode && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "提交中..." : isReplyMode ? "提交回复" : "提交留言"}
        </button>
      </div>
    </form>
  );
}

