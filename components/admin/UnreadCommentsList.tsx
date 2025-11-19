"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Unread comment interface.
 */
interface UnreadComment {
  id: string;
  content: string;
  articleId: string;
  userId: string | null;
  authorName: string | null;
  createdAt: string;
  article: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

/**
 * Unread comments list component.
 * 
 * Displays a list of unread comments for admin users.
 * Clicking a comment marks it as read and navigates to the article page.
 * 
 * @component
 */
export default function UnreadCommentsList() {
  const router = useRouter();
  const [comments, setComments] = useState<UnreadComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches unread comments from API.
   */
  const fetchUnreadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/comments/unread?limit=20", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch unread comments");
      }

      const data = await response.json();
      if (data.success) {
        setComments(data.data.comments);
      } else {
        throw new Error(data.error?.message || "Failed to fetch unread comments");
      }
    } catch (err) {
      console.error("Error fetching unread comments:", err);
      setError(err instanceof Error ? err.message : "加载未读评论失败");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles clicking on an unread comment.
   * Marks the comment as read and navigates to the article page.
   */
  const handleCommentClick = async (comment: UnreadComment) => {
    // Optimistic update: remove from list immediately
    setComments((prev) => prev.filter((c) => c.id !== comment.id));

    try {
      // Mark comment as read
      const response = await fetch(`/api/admin/comments/${comment.id}/read`, {
        method: "PUT",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to mark comment as read");
      }

      // Navigate to article page with comment anchor
      router.push(`/articles/${comment.article.slug}#comment-${comment.id}`);
    } catch (err) {
      console.error("Error marking comment as read:", err);
      // Rollback: add comment back to list
      setComments((prev) => [...prev, comment].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      alert("标记评论为已读失败，请重试");
    }
  };

  /**
   * Formats relative time (e.g., "2 小时前").
   */
  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "刚刚";
      if (diffMins < 60) return `${diffMins} 分钟前`;
      if (diffHours < 24) return `${diffHours} 小时前`;
      if (diffDays < 7) return `${diffDays} 天前`;
      
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "未知时间";
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchUnreadComments();
  }, []);

  // Refresh when page becomes visible (user returns from article page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadComments();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          {error}
          <button
            onClick={fetchUnreadComments}
            className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="mb-2">暂无未读评论</p>
          <p className="text-sm">所有评论都已阅读</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          未读评论 ({comments.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {comments.map((comment) => {
          const authorName = comment.user?.name || comment.authorName || "匿名用户";
          const authorDisplay = comment.user 
            ? authorName 
            : `访客：${authorName}`;

          return (
            <div
              key={comment.id}
              onClick={() => handleCommentClick(comment)}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors min-h-[44px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {authorDisplay}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                    {comment.content}
                  </p>
                  <Link
                    href={`/articles/${comment.article.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    文章：{comment.article.title}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

