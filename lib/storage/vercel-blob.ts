import { put, head, del, list } from "@vercel/blob";
import { StorageInterface, FileMetadata } from "./interface";

/**
 * Vercel Blob Storage implementation.
 * 
 * This implementation stores files in Vercel Blob Storage, a cloud storage
 * service provided by Vercel. Files are accessible via public URLs.
 * 
 * @implements {StorageInterface}
 * 
 * @example
 * ```typescript
 * const storage = new VercelBlobStorage();
 * const filePath = await storage.upload(file);
 * const url = await storage.getUrl(filePath);
 * ```
 */
export class VercelBlobStorage implements StorageInterface {
  private readonly token: string;
  private readonly storeName: string;

  /**
   * Creates a new VercelBlobStorage instance.
   * 
   * @param token - Vercel Blob read/write token (from BLOB_READ_WRITE_TOKEN env var)
   * @param storeName - Blob store name (default: 'travis-blog')
   */
  constructor(token?: string, storeName?: string) {
    this.token = token || process.env.BLOB_READ_WRITE_TOKEN || "";
    this.storeName = storeName || process.env.BLOB_STORE_NAME || "travis-blog";

    if (!this.token) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN environment variable is required for Vercel Blob Storage"
      );
    }
  }

  /**
   * Generates a unique filename.
   * 
   * Creates a unique filename by combining a timestamp, random string,
   * and the original filename to prevent collisions.
   * 
   * @private
   * @param originalName - Original filename
   * @returns Unique filename
   */
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = originalName.substring(originalName.lastIndexOf("."));
    const name = originalName.substring(0, originalName.lastIndexOf("."));
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, "_");
    return `${timestamp}-${random}-${sanitizedName}${ext}`;
  }

  /**
   * Uploads a file to Vercel Blob Storage.
   * 
   * @param file - File to upload (File object or Buffer)
   * @param customPath - Optional custom path. If provided, uses this path.
   *                     Otherwise, generates a unique filename.
   * @returns Promise resolving to the blob path (can be used with getUrl)
   * @throws {Error} If file upload fails
   * 
   * @example
   * ```typescript
   * const file = new File(['content'], 'test.txt', { type: 'text/plain' });
   * const path = await storage.upload(file);
   * // Returns: 'uploads/1234567890-abc123-test.txt'
   * ```
   */
  async upload(file: File | Buffer, customPath?: string): Promise<string> {
    try {
      let filename: string;
      let fileBuffer: Buffer;
      let mimeType: string;

      if (file instanceof File) {
        filename = customPath || this.generateUniqueFilename(file.name);
        fileBuffer = Buffer.from(await file.arrayBuffer());
        mimeType = file.type || "application/octet-stream";
      } else {
        // Buffer - need to provide a default name if no custom path
        if (!customPath) {
          throw new Error("Custom path is required when uploading a Buffer");
        }
        filename = customPath;
        fileBuffer = file;
        mimeType = "application/octet-stream";
      }

      // Ensure filename starts with 'uploads/' prefix
      const blobPath = filename.startsWith("uploads/")
        ? filename
        : `uploads/${filename}`;

      // Upload to Vercel Blob
      const blob = await put(blobPath, fileBuffer, {
        access: "public",
        token: this.token,
        addRandomSuffix: false, // We handle uniqueness ourselves
        contentType: mimeType, // Explicitly set content type
      });

      // Return the path (without the full URL)
      // The path is the key we use to reference the blob
      return blob.pathname;
    } catch (error) {
      throw new Error(
        `Failed to upload file to Vercel Blob: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Deletes a file from Vercel Blob Storage.
   * 
   * @param filePath - Blob path (e.g., 'uploads/filename.jpg')
   * @returns Promise that resolves when the file is deleted
   * @throws {Error} If file deletion fails
   * 
   * @example
   * ```typescript
   * await storage.delete('uploads/1234567890-abc123-test.txt');
   * ```
   */
  async delete(filePath: string): Promise<void> {
    try {
      // Ensure path starts with 'uploads/' and normalize
      const normalizedPath = filePath.startsWith("uploads/")
        ? filePath
        : `uploads/${filePath}`;

      // Vercel Blob del() accepts either URL or pathname
      // We'll use pathname directly
      await del(normalizedPath, {
        token: this.token,
      });
    } catch (error) {
      // If file doesn't exist, that's okay (idempotent operation)
      if (error instanceof Error && (error.message.includes("not found") || error.message.includes("NotFound"))) {
        return;
      }
      throw new Error(
        `Failed to delete file from Vercel Blob: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Lists files in Vercel Blob Storage.
   * 
   * @param prefix - Optional path prefix to filter files (e.g., 'uploads/images/')
   * @returns Promise resolving to an array of file metadata
   * @throws {Error} If listing files fails
   * 
   * @example
   * ```typescript
   * const files = await storage.list();
   * // Returns: [{ path: 'uploads/file1.jpg', name: 'file1.jpg', ... }, ...]
   * ```
   */
  async list(prefix?: string): Promise<FileMetadata[]> {
    try {
      const { blobs } = await list({
        prefix: prefix || "uploads/",
        token: this.token,
      });

      const metadata: FileMetadata[] = blobs.map((blob) => {
        // Extract filename from pathname
        const filename = blob.pathname.substring(
          blob.pathname.lastIndexOf("/") + 1
        );

        // Get MIME type from filename extension
        const mimeType = this.getMimeTypeFromFilename(filename);

        return {
          path: blob.pathname,
          name: filename,
          size: blob.size,
          mimeType,
          createdAt: new Date(blob.uploadedAt),
        };
      });

      return metadata;
    } catch (error) {
      throw new Error(
        `Failed to list files from Vercel Blob: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Gets the public URL for a file.
   * 
   * For Vercel Blob Storage, returns the full public URL of the blob.
   * 
   * @param filePath - Blob path (e.g., 'uploads/filename.jpg')
   * @returns Promise resolving to the public URL
   * @throws {Error} If the file doesn't exist
   * 
   * @example
   * ```typescript
   * const url = await storage.getUrl('uploads/1234567890-abc123-test.txt');
   * // Returns: 'https://[store].public.blob.vercel-storage.com/uploads/...'
   * ```
   */
  async getUrl(filePath: string): Promise<string> {
    try {
      // Ensure path starts with 'uploads/' and normalize
      const normalizedPath = filePath.startsWith("uploads/")
        ? filePath
        : `uploads/${filePath}`;

      // Check if blob exists by using head
      // This will throw if the blob doesn't exist
      const blob = await head(normalizedPath, {
        token: this.token,
      });

      // Return the public URL
      return blob.url;
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(
        `Failed to get URL for file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Gets MIME type from filename extension.
   * 
   * @private
   * @param filename - Filename with extension
   * @returns MIME type string
   */
  private getMimeTypeFromFilename(filename: string): string {
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".json": "application/json",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
}

