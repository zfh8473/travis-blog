/**
 * Client-side media utility functions.
 * 
 * These functions are safe to use in Client Components as they don't
 * import any server-side dependencies like Prisma.
 */

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

