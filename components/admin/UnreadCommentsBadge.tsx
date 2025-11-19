"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Unread comments badge component.
 * 
 * Displays the count of unread comments for admin users.
 * Automatically refreshes when navigating back to admin pages.
 * 
 * @component
 */
export default function UnreadCommentsBadge() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches unread comment count from API.
   */
  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/comments/unread-count", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }

      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setUnreadCount(0); // Fallback to 0 on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Refresh when route changes (user returns to admin pages)
  useEffect(() => {
    const handleRouteChange = () => {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        fetchUnreadCount();
      }, 500);
    };

    // Listen for route changes
    const handleFocus = () => {
      fetchUnreadCount();
    };

    // Refresh when window regains focus (user returns from another tab/window)
    window.addEventListener("focus", handleFocus);

    // Refresh on route change (Next.js App Router)
    // Note: router.events is not available in App Router, so we use visibility API
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    });

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Don't show badge if loading or count is 0
  if (loading || unreadCount === null || unreadCount === 0) {
    return (
      <Link
        href="/admin/comments"
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] flex items-center justify-center"
      >
        评论管理
      </Link>
    );
  }

  return (
    <Link
      href="/admin/comments"
      className="relative px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] flex items-center justify-center"
    >
      评论管理
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    </Link>
  );
}

