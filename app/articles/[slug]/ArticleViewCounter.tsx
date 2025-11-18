"use client";

import { useEffect, useRef } from "react";
import { incrementArticleViewsAction } from "@/lib/actions/article";

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
// Global lock to prevent concurrent execution across all instances
let globalProcessing = false;

export default function ArticleViewCounter({ slug }: { slug: string }) {
  const hasIncremented = useRef(false);
  const isProcessing = useRef(false);

  useEffect(() => {
    // Only increment once per page load
    if (hasIncremented.current) {
      console.log("[ViewCounter] Already incremented, skipping");
      return;
    }

    // Prevent concurrent execution (React Strict Mode double mount)
    // Use both local and global locks for maximum safety
    if (isProcessing.current || globalProcessing) {
      console.log("[ViewCounter] Already processing (local:", isProcessing.current, ", global:", globalProcessing, "), skipping");
      return;
    }

    isProcessing.current = true;
    globalProcessing = true;
    console.log("[ViewCounter] Component mounted, slug:", slug);

    // Wait for DOM to be ready and find the views element
    let retryCount = 0;
    const maxRetries = 50; // Maximum 5 seconds (50 * 100ms)
    
    const waitForElementAndIncrement = () => {
      // Try to find the views element
      const viewsElement = document.querySelector('[data-article-views]');
      
      if (!viewsElement) {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error("[ViewCounter] Views element not found after", maxRetries, "retries, giving up");
          return;
        }
        // Element not found yet, wait a bit and try again
        console.log("[ViewCounter] Views element not found, retrying in 100ms (attempt", retryCount, "/", maxRetries, ")");
        setTimeout(waitForElementAndIncrement, 100);
        return;
      }

      console.log("[ViewCounter] Views element found, calling Server Action");

      // Increment view count when component mounts and element is ready
      const incrementViews = async () => {
        try {
          console.log("[ViewCounter] Calling Server Action for slug:", slug);
          const startTime = Date.now();
          
          // Use Server Action instead of API route to avoid connection issues
          const result = await incrementArticleViewsAction(slug);
          
          const duration = Date.now() - startTime;
          console.log("[ViewCounter] Server Action completed after", duration, "ms");
          console.log("[ViewCounter] Server Action result:", result);
          
          if (result.success && result.data?.views !== undefined) {
            hasIncremented.current = true;
            isProcessing.current = false;
            globalProcessing = false;
            
            // Update the view count in the DOM
            const updatedElement = document.querySelector('[data-article-views]') as HTMLElement;
            if (updatedElement) {
              // The structure is: <span><svg>...</svg> {views} 次阅读</span>
              // We need to preserve the SVG and only update the text
              const svgElement = updatedElement.querySelector('svg');
              
              if (svgElement) {
                // Preserve SVG, update text after it
                updatedElement.innerHTML = '';
                updatedElement.appendChild(svgElement);
                updatedElement.appendChild(document.createTextNode(` ${result.data.views.toLocaleString()} 次阅读`));
              } else {
                // Fallback: update entire content
                updatedElement.textContent = `${result.data.views.toLocaleString()} 次阅读`;
              }
              
              console.log("[ViewCounter] Updated DOM with views:", result.data.views);
            } else {
              console.warn("[ViewCounter] Views element not found after Server Action");
            }
            
            console.log("[ViewCounter] Article views incremented successfully:", {
              slug,
              newViews: result.data.views,
            });
          } else {
            console.error("[ViewCounter] Server Action failed:", result.error);
            isProcessing.current = false;
            globalProcessing = false;
          }
        } catch (error) {
          // Log error for debugging
          isProcessing.current = false;
          globalProcessing = false;
          console.error("[ViewCounter] Failed to increment article views:", {
            error,
            slug,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
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

