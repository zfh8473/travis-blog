"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Comment scroll handler component.
 * 
 * Handles scrolling to a specific comment when the page loads with a comment anchor.
 * For example: /articles/slug#comment-123
 * 
 * @component
 */
export default function CommentScrollHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get comment ID from URL hash
    const hash = window.location.hash;
    if (!hash || !hash.startsWith("#comment-")) {
      return;
    }

    const commentId = hash.replace("#comment-", "");
    if (!commentId) {
      return;
    }

    // Wait for page to fully load
    const scrollToComment = () => {
      const element = document.getElementById(`comment-${commentId}`);
      if (element) {
        // Scroll to comment with smooth behavior
        element.scrollIntoView({ 
          behavior: "smooth", 
          block: "center" 
        });

        // Highlight comment briefly
        element.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
        }, 2000);
      }
    };

    // Try immediately, then retry after a short delay (in case comments are still loading)
    scrollToComment();
    const timeoutId = setTimeout(scrollToComment, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // Only run once on mount

  return null; // This component doesn't render anything
}

