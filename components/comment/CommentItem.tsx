"use client";

import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { Comment } from "./CommentsSection";
import CommentForm from "./CommentForm";
import { MAX_COMMENT_DEPTH } from "@/lib/utils/comment-depth";

/**
 * Comment item component props.
 */
export interface CommentItemProps {
  comment: Comment;
  depth?: number; // Current nesting depth (0 for top-level)
  allComments?: Comment[]; // All comments for depth calculation
  articleId: string; // Article ID for API calls
  onCommentDeleted?: () => void; // Callback when comment is deleted
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
 * />
 * ```
 */
export default function CommentItem({ 
  comment, 
  depth = 0,
  allComments = [],
  articleId,
  onCommentDeleted,
}: CommentItemProps) {
  // Validate comment data at component entry to prevent React errors
  if (!comment || !comment.id) {
    console.warn("Invalid comment data:", comment);
    return null;
  }
  
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session } = useSession();
  
  // Check if current user is admin
  const isAdmin = session?.user?.role === "ADMIN";

  // Get author name: from user.name (logged-in) or authorName (anonymous)
  // For anonymous users, prefix with "访客："
  // Ensure all values are strings to prevent React error #418
  const isGuest = !comment.user && comment.authorName;
  const authorName: string = isGuest 
    ? `访客：${String(comment.authorName || "")}`
    : String(comment.user?.name || "匿名用户");
  
  // Final safety check - ensure authorName is never null/undefined
  const safeAuthorName = authorName && typeof authorName === "string" ? authorName : "匿名用户";
  
  // Get author avatar: from user.image (logged-in users only)
  const authorAvatar = comment.user?.image || null;
  
  // Format timestamp - handle ISO strings (from API)
  // createdAt is always a string from API response
  // Ensure valid date to prevent React error #418
  let formattedDate: string = "未知时间";
  try {
    const createdAtStr = String(comment.createdAt || "");
    if (createdAtStr && createdAtStr !== "undefined" && createdAtStr !== "null") {
      const createdAtDate = new Date(createdAtStr);
      if (!isNaN(createdAtDate.getTime())) {
        const formatted = format(createdAtDate, "yyyy年MM月dd日 HH:mm", { locale: zhCN });
        formattedDate = formatted && typeof formatted === "string" ? formatted : "未知时间";
      }
    }
  } catch (error) {
    console.error("Error formatting date:", error, "createdAt:", comment.createdAt);
    formattedDate = "未知时间";
  }
  
  // Final safety check
  const safeFormattedDate = formattedDate && typeof formattedDate === "string" ? formattedDate : "未知时间";

  // Check if this comment is a reply (has parentId)
  const isReply = !!comment.parentId;

  // Calculate current depth (if not provided)
  const currentDepth = depth;

  // Check if we can reply (not at max depth)
  const canReply = currentDepth < MAX_COMMENT_DEPTH - 1;

  // Get parent author name for reply indication
  // Ensure all values are strings to prevent React error #418
  const parentAuthorName: string | null = isReply && allComments.length > 0 && comment.parentId
    ? (() => {
        const parent = allComments.find(c => c && c.id === comment.parentId);
        if (!parent) return null;
        const isParentGuest = !parent.user && parent.authorName;
        const name = isParentGuest 
          ? `访客：${String(parent.authorName || "")}`
          : String(parent.user?.name || "匿名用户");
        // Ensure we return a valid string, not null or undefined
        return name && name.length > 0 ? name : null;
      })()
    : null;

  // Handle reply button click
  const handleReplyClick = () => {
    if (!canReply) {
      alert(`已达到最大回复深度（${MAX_COMMENT_DEPTH} 层）`);
      return;
    }
    setShowReplyForm(true);
  };

  // Handle scroll to parent comment
  const handleScrollToParent = () => {
    if (comment.parentId) {
      const parentElement = document.getElementById(`comment-${comment.parentId}`);
      if (parentElement) {
        parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight parent briefly
        parentElement.classList.add("ring-2", "ring-blue-500");
        setTimeout(() => {
          parentElement.classList.remove("ring-2", "ring-blue-500");
        }, 2000);
      }
    }
  };

  // Handle reply form success
  const handleReplySuccess = () => {
    setShowReplyForm(false);
    // Call parent callback to refresh comments
    if (onCommentDeleted) {
      onCommentDeleted();
    } else {
      // Fallback: reload page
      window.location.reload();
    }
  };

  // Handle delete button click
  const handleDeleteClick = async () => {
    // Count replies (including nested ones)
    const countReplies = (comment: Comment): number => {
      let count = comment.replies?.length || 0;
      if (comment.replies) {
        comment.replies.forEach(reply => {
          count += countReplies(reply);
        });
      }
      return count;
    };

    const replyCount = countReplies(comment);
    const confirmMessage = replyCount > 0
      ? `确定要删除这条留言吗？此留言有 ${replyCount} 条回复，删除后所有回复也将被删除。删除后无法恢复。`
      : "确定要删除这条留言吗？删除后无法恢复。";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        // Show success message
        alert("留言删除成功！");
        // Call parent callback to refresh comments
        if (onCommentDeleted) {
          onCommentDeleted();
        } else {
          // Fallback: reload page
          window.location.reload();
        }
      } else {
        // Show error message
        alert(data.error?.message || "删除留言失败，请重试。");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("删除留言失败，请重试。");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      id={`comment-${comment.id}`}
      className={`${isReply ? "ml-8 border-l-2 border-gray-200 pl-4" : ""} border-b border-gray-200 py-4`}
    >
      <div className="flex items-start gap-3">
        {/* Author avatar */}
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt={safeAuthorName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">
              {safeAuthorName && safeAuthorName.length > 0 ? safeAuthorName.charAt(0).toUpperCase() : "?"}
            </span>
          </div>
        )}

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
                  @{String(parentAuthorName || "")}
                </button>
              </span>
            )}
            <span className="font-medium text-gray-900">{safeAuthorName}</span>
            <span className="text-sm text-gray-500">{safeFormattedDate}</span>
          </div>

          {/* Comment content */}
          {/* Ensure content is always a string to prevent React error #418 */}
          <div className="text-gray-700 whitespace-pre-wrap break-words mb-2">
            {(() => {
              const content = String(comment.content || "");
              // Additional safety check
              return content !== "undefined" && content !== "null" ? content : "";
            })()}
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
          {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              {String(comment.replies.length)} 条回复
            </span>
          )}

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-4">
              <CommentForm
                articleId={articleId}
                parentId={comment.id}
                parentAuthorName={safeAuthorName}
                isReply={true}
                onSuccess={handleReplySuccess}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
            <div className="mt-4 space-y-0">
              {comment.replies.map((reply) => {
                // Ensure reply is valid before rendering
                if (!reply || !reply.id) {
                  console.warn("Invalid reply data:", reply);
                  return null;
                }
                return (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={currentDepth + 1}
                    allComments={allComments}
                    articleId={articleId}
                    onCommentDeleted={onCommentDeleted}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

