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

      console.log("[ViewCounter] Views element found, making API call");

      // Increment view count when component mounts and element is ready
      const incrementViews = async () => {
        try {
          const url = `/api/articles/${encodeURIComponent(slug)}/views`;
          console.log("[ViewCounter] Calling API:", url);
          console.log("[ViewCounter] Fetch options:", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          
          const fetchStartTime = Date.now();
          console.log("[ViewCounter] Starting fetch request at", new Date().toISOString());
          
          let response: Response;
          try {
            const fetchPromise = fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include", // Ensure cookies are sent
            });
            
            const timeoutPromise = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error("Fetch timeout after 10 seconds")), 10000)
            );
            
            response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
            
            console.log("[ViewCounter] Fetch promise resolved");
          } catch (fetchError) {
            console.error("[ViewCounter] Fetch error (network/CORS/timeout):", {
              error: fetchError,
              message: fetchError instanceof Error ? fetchError.message : String(fetchError),
              name: fetchError instanceof Error ? fetchError.name : "Unknown",
              stack: fetchError instanceof Error ? fetchError.stack : undefined,
            });
            isProcessing.current = false;
            globalProcessing = false;
            return;
          }

          const fetchDuration = Date.now() - fetchStartTime;
          console.log("[ViewCounter] API response received after", fetchDuration, "ms");
          console.log("[ViewCounter] API response status:", response.status);
          console.log("[ViewCounter] API response ok:", response.ok);
          console.log("[ViewCounter] API response statusText:", response.statusText);
          
          try {
            const headersObj = Object.fromEntries(response.headers.entries());
            console.log("[ViewCounter] API response headers:", headersObj);
          } catch (headerError) {
            console.warn("[ViewCounter] Failed to log headers:", headerError);
          }

          if (!response.ok) {
            const errorText = await response.text().catch(() => "Failed to read error response");
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { raw: errorText };
            }
            console.error("[ViewCounter] API request failed:", {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              slug,
              url,
            });
            return;
          }

          const responseText = await response.text();
          console.log("[ViewCounter] API response text:", responseText);
          
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("[ViewCounter] Failed to parse JSON response:", {
              text: responseText,
              error: parseError,
            });
            return;
          }
          
          console.log("[ViewCounter] API response data (parsed):", data);
          
          if (data.success && data.data?.views !== undefined) {
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
                updatedElement.appendChild(document.createTextNode(` ${data.data.views.toLocaleString()} 次阅读`));
              } else {
                // Fallback: update entire content
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
          isProcessing.current = false;
          globalProcessing = false;
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

