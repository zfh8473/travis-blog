"use client";

import { useEffect } from "react";

/**
 * Client component to increment article view count.
 * 
 * This component runs on the client side and makes a POST request
 * to increment the view count when the article is viewed.
 * 
 * @component
 * @param props - Component props
 * @param props.slug - Article slug
 */
export default function ArticleViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    // Increment view count when component mounts
    const incrementViews = async () => {
      try {
        await fetch(`/api/articles/${encodeURIComponent(slug)}/views`, {
          method: "POST",
        });
      } catch (error) {
        // Silently fail - view count increment is not critical
        console.error("Failed to increment article views:", error);
      }
    };

    incrementViews();
  }, [slug]);

  // This component doesn't render anything
  return null;
}

