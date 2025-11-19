"use client";

import { useState, useEffect, useCallback } from "react";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

/**
 * Comment data interface (matching API response).
 */
export interface Comment {
  id: string;
  content: string;
  articleId: string;
  userId: string | null;
  parentId: string | null;
  authorName: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  replies?: Comment[];
}

/**
 * Comments section component props.
 */
interface CommentsSectionProps {
  articleId: string;
}

/**
 * Comments section component.
 * 
 * Client Component that manages all comment-related functionality.
 * Fetches comments from API, manages state, and handles refresh.
 * 
 * @component
 * @param props - Component props
 * @param props.articleId - The ID of the article to display comments for
 * 
 * @example
 * ```tsx
 * <CommentsSection articleId="article-123" />
 * ```
 */
export default function CommentsSection({
  articleId,
}: CommentsSectionProps) {
  // Note: session is not currently used but may be needed for future features
  // const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches comments from API.
   */
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/comments?articleId=${articleId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to load comments");
      }

      const data = await res.json();

      if (data.success) {
        // Debug: Log raw data to help identify React error #418
        if (process.env.NODE_ENV === "development" || typeof window !== "undefined") {
          console.log("[CommentsSection] Raw API response:", JSON.stringify(data.data, null, 2));
        }
        
        // Recursively sanitize comment data to prevent React errors
        const sanitizeComment = (comment: any): Comment => {
          const sanitized: Comment = {
            id: String(comment.id || ""),
            content: String(comment.content || ""),
            articleId: String(comment.articleId || ""),
            userId: comment.userId ? String(comment.userId) : null,
            parentId: comment.parentId ? String(comment.parentId) : null,
            authorName: comment.authorName ? String(comment.authorName) : null,
            createdAt: String(comment.createdAt || ""),
            updatedAt: String(comment.updatedAt || ""),
            user: comment.user ? {
              id: String(comment.user.id || ""),
              name: comment.user.name ? String(comment.user.name) : null,
              image: comment.user.image ? String(comment.user.image) : null,
            } : null,
            replies: Array.isArray(comment.replies) && comment.replies.length > 0
              ? comment.replies.map(sanitizeComment)
              : [],
          };
          return sanitized;
        };
        
        const sanitizedComments = (data.data || []).map(sanitizeComment);
        
        // Debug: Log sanitized data
        if (process.env.NODE_ENV === "development" || typeof window !== "undefined") {
          console.log("[CommentsSection] Sanitized comments:", sanitizedComments);
          // Check for any non-string values in text fields
          sanitizedComments.forEach((comment: Comment, index: number) => {
            if (typeof comment.content !== "string") {
              console.error(`[CommentsSection] Comment ${index} content is not string:`, comment.content, typeof comment.content);
            }
            if (typeof comment.authorName !== "string" && comment.authorName !== null) {
              console.error(`[CommentsSection] Comment ${index} authorName is not string:`, comment.authorName, typeof comment.authorName);
            }
          });
        }
        
        setComments(sanitizedComments);
      } else {
        throw new Error(data.error?.message || "Failed to load comments");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载留言时发生错误";
      setError(message);
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  // Fetch comments on mount and when articleId changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /**
   * Handles comment creation success.
   * Refreshes the comment list.
   */
  const handleCommentCreated = () => {
    fetchComments();
  };

  /**
   * Handles comment deletion success.
   * Refreshes the comment list.
   */
  const handleCommentDeleted = () => {
    fetchComments();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl border-t border-gray-200 mt-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">留言</h2>

      {/* Comment form */}
      <div className="mb-8">
        <CommentForm articleId={articleId} onSuccess={handleCommentCreated} />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Comments list */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-900">所有留言</h3>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-200 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CommentList
            comments={comments}
            articleId={articleId}
            onCommentDeleted={handleCommentDeleted}
          />
        )}
      </div>
    </div>
  );
}

