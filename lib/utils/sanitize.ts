/**
 * Sanitizes text content to prevent XSS attacks.
 * Removes HTML tags and control characters.
 */
export function sanitizeText(content: string): string {
  if (typeof content !== "string") {
    return "";
  }
  
  // Remove control characters
  let sanitized = content.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  
  return sanitized.trim();
}

