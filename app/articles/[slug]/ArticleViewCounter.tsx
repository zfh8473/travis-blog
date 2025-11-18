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
      console.log("[ViewCounter] Already incremented, skipping");
      return;
    }

    console.log("[ViewCounter] Component mounted, slug:", slug);

    // Wait for DOM to be ready and find the views element
    const waitForElementAndIncrement = () => {
      // Try to find the views element
      const viewsElement = document.querySelector('[data-article-views]');
      
      if (!viewsElement) {
        // Element not found yet, wait a bit and try again
        console.log("[ViewCounter] Views element not found, retrying in 100ms");
        setTimeout(waitForElementAndIncrement, 100);
        return;
      }

      console.log("[ViewCounter] Views element found, making API call");

      // Increment view count when component mounts and element is ready
      const incrementViews = async () => {
        try {
          const url = `/api/articles/${encodeURIComponent(slug)}/views`;
          console.log("[ViewCounter] Calling API:", url);
          
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("[ViewCounter] API response status:", response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[ViewCounter] Failed to increment article views:", {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              slug,
              url,
            });
            return;
          }

          const data = await response.json();
          console.log("[ViewCounter] API response data:", data);
          
          if (data.success && data.data?.views !== undefined) {
            hasIncremented.current = true;
            
            // Update the view count in the DOM
            const updatedElement = document.querySelector('[data-article-views]');
            if (updatedElement) {
              // Find the text node and update it
              const textNode = Array.from(updatedElement.childNodes).find(
                (node) => node.nodeType === Node.TEXT_NODE
              );
              
              if (textNode) {
                // Replace the text content
                updatedElement.textContent = `${data.data.views.toLocaleString()} 次阅读`;
              } else {
                // If no text node, update the entire content
                updatedElement.textContent = `${data.data.views.toLocaleString()} 次阅读`;
              }
              
              console.log("[ViewCounter] Updated DOM with views:", data.data.views);
            } else {
              console.warn("[ViewCounter] Views element not found after API call");
            }
            
            console.log("[ViewCounter] Article views incremented successfully:", {
              slug,
              newViews: data.data.views,
            });
          } else {
            console.error("[ViewCounter] API response missing success or views data:", data);
          }
        } catch (error) {
          // Log error for debugging
          console.error("[ViewCounter] Failed to increment article views:", {
            error,
            slug,
            url: `/api/articles/${encodeURIComponent(slug)}/views`,
          });
        }
      };

      incrementViews();
    };

    // Start waiting for element
    waitForElementAndIncrement();
  }, [slug]);

  // This component doesn't render anything
  return null;
}

