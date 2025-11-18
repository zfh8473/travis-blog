"use client";

import { useState } from "react";
<<<<<<< HEAD
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Session } from "next-auth";
import { Comment, deleteCommentAction } from "@/lib/actions/comment";
=======
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Comment } from "./types";
>>>>>>> 50c99f08741872fadd03e98476cd6fbc9411e592
import CommentForm from "./CommentForm";
import { MAX_COMMENT_DEPTH } from "@/lib/utils/comment-depth";

interface CommentItemProps {
  comment: Comment;
<<<<<<< HEAD
  depth?: number; // Current nesting depth (0 for top-level)
  allComments?: Comment[]; // All comments for depth calculation
  session?: Session | null; // Session information from server (optional for backward compatibility)
}

/**
 * Single comment item component.
 * 
 * Displays a comment with author information (name, avatar), content,
 * timestamp, and a Reply button. Supports nested replies display and
 * reply form functionality.
 * 
 * @component
 * @param props - Component props
 * @param props.comment - The comment data to display (includes nested replies)
 * @param props.depth - Current nesting depth (0 for top-level, defaults to 0)
 * @param props.allComments - All comments for depth calculation (optional)
 * 
 * @example
 * ```tsx
 * <CommentItem 
 *   comment={{
 *     id: "comment-1",
 *     content: "Great article!",
 *     authorName: "Anonymous User",
 *     createdAt: new Date(),
 *     user: null,
 *     replies: []
 *   }}
 *   session={session}
 * />
 * ```
 */
export default function CommentItem({ 
  comment, 
  depth = 0,
  allComments = [],
  session: sessionProp,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  // Use session from props (from server) instead of useSession hook
  // This avoids client-side session queries and improves performance
  const session = sessionProp ?? null;
  
  // Check if current user is admin
=======
  slug: string;
  depth?: number;
  onRefresh: () => void;
}

export default function CommentItem({
  comment,
  slug,
  depth = 0,
  onRefresh,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

>>>>>>> 50c99f08741872fadd03e98476cd6fbc9411e592
  const isAdmin = session?.user?.role === "ADMIN";
  const isAuthor = session?.user?.id === comment.userId;
  const canDelete = isAdmin || isAuthor;

  const displayName = comment.user?.name || comment.authorName || "匿名用户";
  const avatarUrl = comment.user?.image;

  const handleReplySuccess = () => {
<<<<<<< HEAD
    setShowReplyForm(false);
    // Use router.refresh() to refresh server components
    // This is more efficient than window.location.reload()
    router.refresh();
=======
    setIsReplying(false);
    onRefresh();
>>>>>>> 50c99f08741872fadd03e98476cd6fbc9411e592
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这条评论吗？这将同时删除所有回复。")) return;

    try {
<<<<<<< HEAD
      const result = await deleteCommentAction(comment.id);
      
      if (result.success) {
        // Show success message
        alert("留言删除成功！");
        // Use router.refresh() to refresh server components
        // This is more efficient than window.location.reload()
        router.refresh();
      } else {
        // Show error message
        alert(result.error.message || "删除留言失败，请重试。");
=======
      setIsDeleting(true);
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "删除失败");
>>>>>>> 50c99f08741872fadd03e98476cd6fbc9411e592
      }

      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "删除失败";
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`flex gap-4 ${depth > 0 ? "mt-4" : "py-6 border-b border-gray-100"}`}>
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{displayName}</span>
            <span className="text-sm text-gray-500">
              {format(new Date(comment.createdAt), "yyyy年MM月dd日 HH:mm", {
                locale: zhCN,
              })}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-500 hover:text-red-700"
            >
              {isDeleting ? "删除中..." : "删除"}
            </button>
          )}
        </div>

        <div className="text-gray-700 whitespace-pre-wrap mb-2">
          {comment.content}
        </div>

        <div className="flex items-center gap-4">
            {depth < MAX_COMMENT_DEPTH && (
            <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
                回复
            </button>
            )}
        </div>

        {isReplying && (
          <div className="mt-4">
            <CommentForm
              articleId={comment.articleId}
              slug={slug}
              parentId={comment.id}
              onSuccess={handleReplySuccess}
              onCancel={() => setIsReplying(false)}
              placeholder={`回复 @${displayName}...`}
            />
          </div>
        )}

<<<<<<< HEAD
        {/* Comment content */}
        <div className="flex-1 min-w-0">
          {/* Author name and timestamp */}
          <div className="flex items-center gap-2 mb-2">
            {isReply && parentAuthorName && (
              <span className="text-sm text-gray-500">
                回复{" "}
                <button
                  type="button"
                  onClick={handleScrollToParent}
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  @{parentAuthorName}
                </button>
              </span>
            )}
            <span className="font-medium text-gray-900">{authorName}</span>
            <span className="text-sm text-gray-500">{formattedDate}</span>
          </div>

          {/* Comment content */}
          <div className="text-gray-700 whitespace-pre-wrap break-words mb-2">
            {comment.content}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* Reply button */}
            {canReply && (
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={handleReplyClick}
              >
                回复
              </button>
            )}
            {!canReply && (
              <span className="text-sm text-gray-400">
                已达到最大回复深度
              </span>
            )}

            {/* Delete button (admin only) */}
            {isAdmin && (
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                aria-label="删除留言"
              >
                {isDeleting ? "删除中..." : "删除"}
              </button>
            )}
          </div>

          {/* Reply count (if has replies) */}
          {comment.replies && comment.replies.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              {comment.replies.length} 条回复
            </span>
          )}

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-4">
              <CommentForm
                articleId={comment.articleId}
                parentId={comment.id}
                parentAuthorName={authorName}
                isReply={true}
                session={session}
                onSuccess={handleReplySuccess}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-0">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={currentDepth + 1}
                  allComments={allComments}
                  session={session}
                />
              ))}
            </div>
          )}
        </div>
=======
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-gray-100">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                slug={slug}
                depth={depth + 1}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
>>>>>>> 50c99f08741872fadd03e98476cd6fbc9411e592
      </div>
    </div>
  );
}
