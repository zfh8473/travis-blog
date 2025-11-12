import { promises as fs } from "fs";
import path from "path";
import { StorageInterface, FileMetadata } from "./interface";

/**
 * Local file system storage implementation.
 * 
 * This implementation stores files in the local file system under
 * the `public/uploads/` directory. Files are accessible via HTTP
 * at `/uploads/{filename}`.
 * 
 * @implements {StorageInterface}
 * 
 * @example
 * ```typescript
 * const storage = new LocalStorage();
 * const filePath = await storage.upload(file);
 * const url = await storage.getUrl(filePath);
 * ```
 */
export class LocalStorage implements StorageInterface {
  private readonly uploadDir: string;

  /**
   * Creates a new LocalStorage instance.
   * 
   * @param uploadDir - Directory to store uploaded files (default: 'public/uploads')
   */
  constructor(uploadDir: string = "public/uploads") {
    this.uploadDir = uploadDir;
  }

  /**
   * Ensures the upload directory exists.
   * 
   * Creates the directory and any necessary parent directories
   * if they don't exist.
   * 
   * @private
   * @throws {Error} If directory creation fails
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create upload directory: ${this.uploadDir}. ${error instanceof Error ? error.message : "Unknown error"}`
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
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, "_");
    return `${timestamp}-${random}-${sanitizedName}${ext}`;
  }

  /**
   * Uploads a file to local storage.
   * 
   * @param file - File to upload (File object or Buffer)
   * @param customPath - Optional custom path. If provided, uses this path.
   *                     Otherwise, generates a unique filename.
   * @returns Promise resolving to the relative file path
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
      await this.ensureUploadDir();

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

      const filePath = path.join(this.uploadDir, filename);
      await fs.writeFile(filePath, fileBuffer);

      // Return relative path from public directory
      return path.join("uploads", filename).replace(/\\/g, "/");
    } catch (error) {
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Deletes a file from local storage.
   * 
   * @param filePath - Relative file path (e.g., 'uploads/filename.jpg')
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
      // Remove 'uploads/' prefix if present to get the filename
      const filename = filePath.startsWith("uploads/")
        ? filePath.substring(8)
        : filePath;
      const fullPath = path.join(this.uploadDir, filename);

      await fs.unlink(fullPath);
    } catch (error) {
      // If file doesn't exist, that's okay (idempotent operation)
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Lists files in local storage.
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
      await this.ensureUploadDir();

      const files = await fs.readdir(this.uploadDir);
      const metadata: FileMetadata[] = [];

      for (const filename of files) {
        const filePath = path.join(this.uploadDir, filename);
        const relativePath = path.join("uploads", filename).replace(/\\/g, "/");

        // Filter by prefix if provided
        if (prefix && !relativePath.startsWith(prefix)) {
          continue;
        }

        try {
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            // Try to detect MIME type from extension
            const ext = path.extname(filename).toLowerCase();
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
            const mimeType = mimeTypes[ext] || "application/octet-stream";

            metadata.push({
              path: relativePath,
              name: filename,
              size: stats.size,
              mimeType,
              createdAt: stats.birthtime,
            });
          }
        } catch (error) {
          // Skip files that can't be accessed
          console.warn(`Failed to get stats for ${filename}:`, error);
        }
      }

      return metadata;
    } catch (error) {
      throw new Error(
        `Failed to list files: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Gets the public URL for a file.
   * 
   * For local storage, returns a relative path that can be used
   * in the application (e.g., '/uploads/filename.jpg').
   * 
   * @param filePath - Relative file path (e.g., 'uploads/filename.jpg')
   * @returns Promise resolving to the public URL
   * @throws {Error} If the file doesn't exist
   * 
   * @example
   * ```typescript
   * const url = await storage.getUrl('uploads/1234567890-abc123-test.txt');
   * // Returns: '/uploads/1234567890-abc123-test.txt'
   * ```
   */
  async getUrl(filePath: string): Promise<string> {
    try {
      // Ensure path starts with 'uploads/' and normalize
      const normalizedPath = filePath.startsWith("uploads/")
        ? filePath
        : `uploads/${filePath}`;
      const filename = normalizedPath.substring(8); // Remove 'uploads/' prefix
      const fullPath = path.join(this.uploadDir, filename);

      // Check if file exists
      await fs.access(fullPath);

      // Return URL path (starts with /)
      return `/${normalizedPath}`;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(
        `Failed to get URL for file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

