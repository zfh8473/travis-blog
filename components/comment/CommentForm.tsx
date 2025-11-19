"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
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
 * // Top-level comment form
 * <CommentForm 
 *   articleId="article-123"
 *   onSuccess={() => window.location.reload()}
 * />
 * 
 * // Reply form
 * <CommentForm 
 *   articleId="article-123"
 *   parentId="comment-456"
 *   parentAuthorName="John Doe"
 *   isReply={true}
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
}: CommentFormProps) {
  const isReplyMode = isReply ?? !!parentId;
  const { data: session } = useSession();
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

      // Call API Route with timeout
      // Increase timeout to 15 seconds for Vercel environment
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let res: Response;
      try {
        res = await fetch("/api/comments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({
            articleId: validationResult.data.articleId,
            content: validationResult.data.content,
            parentId: validationResult.data.parentId || null,
            userId: validationResult.data.userId || null,
            authorName: validationResult.data.authorName || undefined,
          }),
        });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          setError("请求超时，请检查网络连接后重试");
          setIsSubmitting(false);
          return;
        }
        throw err;
      }

      const data = await res.json();

      if (data.success) {
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
          // Reload page to show new comment
          window.location.reload();
        }
      } else {
        setError(data.error?.message || "提交留言时发生错误");
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("提交留言时发生错误，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`space-y-4 ${isReplyMode ? "sm:ml-8 ml-0 sm:border-l-2 sm:pl-4 bg-gray-50 dark:bg-gray-800/50 sm:bg-transparent dark:sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border-l-4 border-blue-200 dark:border-blue-700 sm:border-l-2 sm:border-gray-200 dark:sm:border-gray-700" : ""}`}
      aria-label={isReplyMode ? "回复留言表单" : "留言表单"}
    >
      {/* Reply mode indication */}
      {isReplyMode && parentAuthorName && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          回复 <span className="font-medium text-blue-600 dark:text-blue-400">@{String(parentAuthorName || "")}</span>
        </div>
      )}

      {/* Name input for anonymous users */}
      {!isLoggedIn && (
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            姓名 <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            id="authorName"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-base"
            placeholder="请输入您的姓名"
            required
            maxLength={100}
            aria-label="姓名"
            aria-required="true"
          />
        </div>
      )}

      {/* Comment content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          留言内容 <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-base resize-y"
          placeholder="请输入您的留言..."
          required
          maxLength={5000}
          aria-label="留言内容"
          aria-describedby="content-help"
          aria-required="true"
        />
        <div id="content-help" className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-right">
          {content.length} / 5000
        </div>
      </div>

      {/* Error message - 优化样式和位置 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-r" role="alert">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm flex-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success message - 优化样式 */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300 px-4 py-3 rounded-r" role="status">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">留言提交成功！</p>
          </div>
        </div>
      )}

      {/* Submit and Cancel buttons - 优化触摸目标和加载状态 */}
      <div className="flex justify-end gap-2 sm:gap-3">
        {isReplyMode && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 sm:px-5 py-2.5 min-h-[44px] min-w-[80px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 text-sm sm:text-base"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 sm:px-6 py-2.5 min-h-[44px] min-w-[100px] bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>提交中...</span>
            </>
          ) : (
            isReplyMode ? "提交回复" : "提交留言"
          )}
        </button>
      </div>
    </form>
  );
}

