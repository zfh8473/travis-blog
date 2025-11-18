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
        const response = await fetch(`/api/articles/${encodeURIComponent(slug)}/views`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to increment article views:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          return;
        }

        const data = await response.json();
        console.log("Article views incremented:", data);
      } catch (error) {
        // Log error for debugging
        console.error("Failed to increment article views:", error);
      }
    };

    incrementViews();
  }, [slug]);

  // This component doesn't render anything
  return null;
}

