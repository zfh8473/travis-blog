/**
 * Extract the first image URL from HTML content.
 * 
 * @param htmlContent - HTML content string
 * @returns First image URL or null if no image found
 */
export function extractFirstImage(htmlContent: string): string | null {
  if (!htmlContent) return null;

  // Match <img> tags with src attribute
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  // Match background-image in style attribute
  const bgMatch = htmlContent.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
  if (bgMatch && bgMatch[1]) {
    return bgMatch[1];
  }

  return null;
}

/**
 * Generate a placeholder thumbnail based on article title.
 * 
 * Uses blue color scheme to match the page design style.
 * Gradient from top to bottom with smooth color transitions.
 * 
 * @param title - Article title
 * @param index - Optional index in a list (for creating gradient effect across multiple thumbnails)
 * @param total - Optional total count (for creating gradient effect across multiple thumbnails)
 * @param uniqueId - Optional unique identifier (e.g., article ID) to ensure uniqueness when titles have same first letter
 * @returns Placeholder image URL or data URI
 */
export function generatePlaceholderThumbnail(
  title: string,
  index?: number,
  total?: number,
  uniqueId?: string
): string {
  const firstLetter = title.charAt(0).toUpperCase();
  
  // If index and total are provided, create a gradient effect across the list
  // First item is darkest, last item is lightest
  let colorPair;
  
  if (index !== undefined && total !== undefined && total > 0) {
    // Calculate position in gradient (0.0 to 1.0)
    // First item (index 0, newest article) is darkest, last item is lightest
    const position = total > 1 ? index / (total - 1) : 0;
    
    // Define gradient range: from darkest (index 0, newest) to lightest (last index)
    // Use solid colors (no internal gradient) for individual thumbnails
    const lightest = "#60a5fa"; // blue-400
    const darkest = "#1e40af"; // blue-700
    
    // Interpolate from darkest (position 0) to lightest (position 1)
    const solidColor = interpolateColor(darkest, lightest, position);
    
    // Use the same color for top and bottom (solid color, no gradient)
    colorPair = {
      top: solidColor,
      bottom: solidColor,
      text: "#ffffff", // White text for better contrast
    };
  } else {
    // Fallback: use first letter to determine color (original behavior)
    const colorPairs = [
      { top: "#e0f2fe", bottom: "#3b82f6", text: "#1e40af" }, // Blue: sky-100 to blue-500
      { top: "#dbeafe", bottom: "#2563eb", text: "#1e3a8a" }, // Blue: blue-100 to blue-600
      { top: "#eef2ff", bottom: "#6366f1", text: "#312e81" }, // Indigo: indigo-100 to indigo-500
      { top: "#e0e7ff", bottom: "#4f46e5", text: "#1e1b4b" }, // Indigo: indigo-100 to indigo-600
      { top: "#dbeafe", bottom: "#60a5fa", text: "#1e40af" }, // Blue: blue-100 to blue-400
      { top: "#eef2ff", bottom: "#818cf8", text: "#312e81" }, // Indigo: indigo-100 to indigo-400
      { top: "#bfdbfe", bottom: "#1e40af", text: "#1e3a8a" }, // Blue: blue-200 to blue-700
      { top: "#c7d2fe", bottom: "#4338ca", text: "#1e1b4b" }, // Indigo: indigo-200 to indigo-700
    ];
    
    const colorIndex = firstLetter.charCodeAt(0) % colorPairs.length;
    colorPair = colorPairs[colorIndex];
  }
  
  // Generate a unique ID for SVG gradient/defs to avoid conflicts
  // Use provided uniqueId (e.g., article ID), or fallback to index or first letter
  const svgUniqueId = uniqueId 
    ? `grad-${uniqueId.replace(/[^a-zA-Z0-9]/g, "-")}` 
    : index !== undefined 
    ? `grad-${index}` 
    : `grad-${firstLetter.charCodeAt(0)}-${Date.now()}`;
  
  const useGradient = colorPair.top !== colorPair.bottom;
  
  if (useGradient) {
    // Use gradient for fallback case (when index/total not provided)
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${svgUniqueId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${colorPair.top};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorPair.bottom};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="120" fill="url(#${svgUniqueId})"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${colorPair.text}" text-anchor="middle" dominant-baseline="middle" opacity="0.9">${firstLetter}</text>
      </svg>`
    )}`;
  } else {
    // Use solid color (for list gradient effect)
    // Add a unique identifier comment to ensure each data URL is unique
    // This prevents browser caching conflicts when multiple articles have same first letter and color
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">
        <!-- Unique ID: ${svgUniqueId} -->
        <rect width="200" height="120" fill="${colorPair.top}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${colorPair.text}" text-anchor="middle" dominant-baseline="middle" opacity="0.9">${firstLetter}</text>
      </svg>`
    )}`;
  }
}

/**
 * Interpolate between two hex colors.
 * 
 * @param color1 - First hex color (e.g., "#e0f2fe")
 * @param color2 - Second hex color (e.g., "#bfdbfe")
 * @param factor - Interpolation factor (0.0 to 1.0)
 * @returns Interpolated hex color
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  // Convert hex to RGB
  const hex1 = color1.replace("#", "");
  const hex2 = color2.replace("#", "");
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  // Convert back to hex
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")}`;
}

