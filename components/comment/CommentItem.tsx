"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
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
    console.warn("[CommentItem] Invalid comment data:", comment);
    return null;
  }
  
  // Debug: Log comment data to help identify React error #418
  if (typeof window !== "undefined" && (process.env.NODE_ENV === "development" || window.location.hostname.includes("vercel"))) {
    console.log("[CommentItem] Rendering comment:", {
      id: comment.id,
      contentType: typeof comment.content,
      contentValue: comment.content,
      authorNameType: typeof comment.authorName,
      authorNameValue: comment.authorName,
      createdAtType: typeof comment.createdAt,
      createdAtValue: comment.createdAt,
      userType: typeof comment.user,
      userValue: comment.user,
    });
  }
  
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
  let relativeTime: string = "未知时间";
  let createdAtDate: Date | null = null;
  
  try {
    const createdAtStr = String(comment.createdAt || "");
    if (createdAtStr && createdAtStr !== "undefined" && createdAtStr !== "null") {
      createdAtDate = new Date(createdAtStr);
      if (!isNaN(createdAtDate.getTime())) {
        // Absolute time for tooltip
        const formatted = format(createdAtDate, "yyyy年MM月dd日 HH:mm", { locale: zhCN });
        formattedDate = formatted && typeof formatted === "string" ? formatted : "未知时间";
        
        // Relative time for display
        const relative = formatDistanceToNow(createdAtDate, {
          addSuffix: true,
          locale: zhCN,
        });
        relativeTime = relative && typeof relative === "string" ? relative : "未知时间";
      }
    }
  } catch (error) {
    console.error("Error formatting date:", error, "createdAt:", comment.createdAt);
    formattedDate = "未知时间";
    relativeTime = "未知时间";
  }
  
  // Final safety check
  const safeFormattedDate = formattedDate && typeof formattedDate === "string" ? formattedDate : "未知时间";
  const safeRelativeTime = relativeTime && typeof relativeTime === "string" ? relativeTime : "未知时间";

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

  // Handle delete button click - show confirmation dialog
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  // Handle confirmed delete
  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
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

  return (
    <div 
      id={`comment-${comment.id}`}
      className={`${
        isReply 
          ? "sm:ml-8 ml-0 sm:pl-4 bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border-l-4 border-blue-200 sm:border-l-2 sm:border-gray-200" 
          : ""
      } border-b border-gray-200 py-3 sm:py-4`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Author avatar - 移动端稍小 */}
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt={safeAuthorName}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
            <span className="text-gray-600 text-xs sm:text-sm font-medium">
              {safeAuthorName && safeAuthorName.length > 0 ? safeAuthorName.charAt(0).toUpperCase() : "?"}
            </span>
          </div>
        )}

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          {/* Author name and timestamp - 移动端优化布局 */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            {isReply && parentAuthorName && (
              <span className="text-xs sm:text-sm text-gray-500">
                回复{" "}
                <button
                  type="button"
                  onClick={handleScrollToParent}
                  className="text-blue-600 hover:text-blue-800 font-medium underline min-h-[44px] min-w-[44px] px-1"
                  aria-label={`跳转到 @${parentAuthorName} 的留言`}
                >
                  @{String(parentAuthorName || "")}
                </button>
              </span>
            )}
            <span className="font-medium text-gray-900 text-sm sm:text-base">{safeAuthorName}</span>
            <span 
              className="text-xs sm:text-sm text-gray-500 cursor-help"
              title={safeFormattedDate}
            >
              {safeRelativeTime}
            </span>
          </div>

          {/* Comment content with expand/collapse */}
          {/* Ensure content is always a string to prevent React error #418 */}
          {(() => {
            const content = String(comment.content || "");
            const safeContent = content !== "undefined" && content !== "null" ? content : "";
            const shouldTruncate = safeContent.length > 200;
            const displayContent = shouldTruncate && !isExpanded 
              ? safeContent.substring(0, 200) + "..."
              : safeContent;
            
            return (
              <div className="text-gray-700 whitespace-pre-wrap mb-2 text-sm sm:text-base leading-relaxed">
                {displayContent}
                {shouldTruncate && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-blue-600 hover:text-blue-800 text-sm ml-2 font-medium min-h-[44px] min-w-[60px] px-2 active:scale-95 transition-transform"
                    aria-label={isExpanded ? "收起内容" : "展开内容"}
                  >
                    {isExpanded ? "收起" : "展开"}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Action buttons - 优化触摸目标 */}
          <div className="flex items-center gap-3 sm:gap-4 mt-2">
            {/* Reply button */}
            {canReply && (
              <button
                type="button"
                className="text-sm sm:text-base text-blue-600 hover:text-blue-800 font-medium min-h-[44px] min-w-[60px] px-2 active:scale-95 transition-transform"
                onClick={handleReplyClick}
                aria-label="回复留言"
              >
                回复
              </button>
            )}
            {!canReply && (
              <span className="text-xs sm:text-sm text-gray-400">
                已达到最大回复深度
              </span>
            )}

            {/* Delete button (admin only) */}
            {isAdmin && (
              <button
                type="button"
                className="text-sm sm:text-base text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[60px] px-2 active:scale-95 transition-transform"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                aria-label="删除留言"
              >
                {isDeleting ? "删除中..." : "删除"}
              </button>
            )}
          </div>

          {/* Delete confirmation modal */}
          {showDeleteConfirm && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
            >
              <div 
                className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 id="delete-confirm-title" className="text-lg font-semibold mb-2 text-gray-900">
                  确认删除
                </h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  {replyCount > 0 
                    ? `确定要删除这条留言吗？此留言有 ${replyCount} 条回复，删除后所有回复也将被删除。删除后无法恢复。`
                    : "确定要删除这条留言吗？删除后无法恢复。"}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2.5 min-h-[44px] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 active:scale-95 transition-all duration-200 text-sm sm:text-base"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2.5 min-h-[44px] bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95 transition-all duration-200 text-sm sm:text-base font-medium"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reply count (if has replies) */}
          {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              {String(comment.replies.length)} 条回复
            </span>
          )}

          {/* Reply form with smooth animation */}
          <div className={`mt-4 transition-all duration-300 ease-in-out ${
            showReplyForm 
              ? "opacity-100 max-h-[2000px] overflow-visible" 
              : "opacity-0 max-h-0 overflow-hidden"
          }`}>
            {showReplyForm && (
              <CommentForm
                articleId={articleId}
                parentId={comment.id}
                parentAuthorName={safeAuthorName}
                isReply={true}
                onSuccess={handleReplySuccess}
                onCancel={() => setShowReplyForm(false)}
              />
            )}
          </div>

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

