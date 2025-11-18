import { prisma } from "@/lib/db/prisma";

/**
 * ⚠️ WARNING: This file contains server-side functions that use Prisma.
 * 
 * Do NOT import this file in Client Components. Use `lib/utils/media-client.ts`
 * for client-safe utility functions like `formatFileSize` and `isImage`.
 */

/**
 * Check if a media file is used in any article.
 * 
 * Searches article content (HTML) for references to the file.
 * File URLs may be in different formats:
 * - /uploads/filename.jpg
 * - uploads/filename.jpg
 * - Full URL (if applicable)
 * 
 * Uses regex patterns to match complete file paths/URLs to avoid false positives.
 * 
 * @param filePath - The file path to check (e.g., "uploads/filename.jpg")
 * @returns Promise resolving to an array of article IDs that use the file, or empty array if not used
 * 
 * @example
 * ```typescript
 * const articlesUsingFile = await checkFileUsage("uploads/image.jpg");
 * if (articlesUsingFile.length > 0) {
 *   console.log("File is used in articles:", articlesUsingFile);
 * }
 * ```
 */
export async function checkFileUsage(filePath: string): Promise<string[]> {
  try {
    // Extract filename from path (handle different path formats)
    // Remove leading slash and "uploads/" prefix if present
    const normalizedPath = filePath.replace(/^\/?uploads\//, "");
    const filename = normalizedPath.split("/").pop() || normalizedPath;
    
    // Escape special regex characters in filename
    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Find all articles that might reference this file
    // We search for the filename in the article content
    const articles = await prisma.article.findMany({
      where: {
        content: {
          contains: filename,
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    // Create regex patterns to match complete file paths/URLs
    // This avoids false positives from partial matches
    const filePatterns = [
      // Match /uploads/filename or /uploads/filename?query
      new RegExp(`/uploads/${escapedFilename}(?:[?&#]|$)`, "i"),
      // Match uploads/filename or uploads/filename?query (without leading slash)
      new RegExp(`uploads/${escapedFilename}(?:[?&#]|$)`, "i"),
      // Match just filename in img src or href attributes
      new RegExp(`(?:src|href)=["'](?:[^"']*/)?${escapedFilename}(?:[?&#]|["'])`, "i"),
      // Match URL-encoded filename
      new RegExp(encodeURIComponent(filename).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    ];

    const articlesUsingFile = articles.filter((article) => {
      const content = article.content;
      // Use regex test for more precise matching
      return filePatterns.some((pattern) => pattern.test(content));
    });

    return articlesUsingFile.map((article) => article.id);
  } catch (error) {
    console.error("Error checking file usage:", error);
    // Return empty array on error to allow deletion (fail-safe)
    // In production, consider logging to monitoring service
    return [];
  }
}

/**
 * Format file size in bytes to human-readable format.
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB", "500 KB")
 * 
 * @example
 * ```typescript
 * formatFileSize(1024); // "1 KB"
 * formatFileSize(1048576); // "1 MB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if a file is an image based on MIME type.
 * 
 * @param mimeType - MIME type of the file
 * @returns true if the file is an image, false otherwise
 * 
 * @example
 * ```typescript
 * isImage("image/jpeg"); // true
 * isImage("application/pdf"); // false
 * ```
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

