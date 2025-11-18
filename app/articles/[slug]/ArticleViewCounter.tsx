"use client";

import { useEffect, useRef } from "react";

/**
 * Client component to increment article view count.
 * 
 * This component runs on the client side and makes a POST request
 * to increment the view count when the article is viewed.
 * Uses a ref to ensure it only increments once per page load.
 * 
 * @component
 * @param props - Component props
 * @param props.slug - Article slug
 */
export default function ArticleViewCounter({ slug }: { slug: string }) {
  const hasIncremented = useRef(false);

  useEffect(() => {
    // Only increment once per page load
    if (hasIncremented.current) {
      return;
    }

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
            slug,
            url: `/api/articles/${encodeURIComponent(slug)}/views`,
          });
          return;
        }

        const data = await response.json();
        if (data.success && data.data?.views !== undefined) {
          hasIncremented.current = true;
          
          // Update the view count in the DOM
          const viewsElement = document.querySelector('[data-article-views]');
          if (viewsElement) {
            viewsElement.textContent = `${data.data.views.toLocaleString()} 次阅读`;
          }
          
          console.log("Article views incremented:", {
            slug,
            newViews: data.data.views,
          });
        }
      } catch (error) {
        // Log error for debugging
        console.error("Failed to increment article views:", {
          error,
          slug,
          url: `/api/articles/${encodeURIComponent(slug)}/views`,
        });
      }
    };

    incrementViews();
  }, [slug]);

  // This component doesn't render anything
  return null;
}

