/**
 * Storage abstraction layer interface.
 * 
 * This interface defines the contract for storage implementations,
 * allowing the application to switch between different storage backends
 * (local file system, cloud storage, etc.) without changing the code
 * that uses the storage layer.
 * 
 * @see ADR-004: Storage Abstraction Layer
 */

/**
 * File metadata information.
 * 
 * Contains information about a stored file, including its path, name,
 * size, MIME type, and creation timestamp.
 */
export interface FileMetadata {
  /** File path relative to storage root */
  path: string;
  /** Original file name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type of the file */
  mimeType: string;
  /** File creation timestamp */
  createdAt: Date;
}

/**
 * Storage interface for file operations.
 * 
 * All storage implementations must implement this interface to ensure
 * consistent API across different storage backends.
 * 
 * @example
 * ```typescript
 * const storage = getStorage();
 * const filePath = await storage.upload(file);
 * const url = await storage.getUrl(filePath);
 * await storage.delete(filePath);
 * ```
 */
export interface StorageInterface {
  /**
   * Upload a file to storage.
   * 
   * Saves the file to the storage backend and returns the file path
   * that can be used to reference the file later.
   * 
   * @param file - The file to upload (File object or Buffer)
   * @param path - Optional custom path for the file. If not provided,
   *               a unique filename will be generated.
   * @returns Promise resolving to the file path
   * @throws {Error} If file upload fails (permissions, disk full, etc.)
   * 
   * @example
   * ```typescript
   * const file = new File(['content'], 'test.txt', { type: 'text/plain' });
   * const path = await storage.upload(file);
   * // Returns: 'uploads/abc123-test.txt'
   * ```
   */
  upload(file: File | Buffer, path?: string): Promise<string>;

  /**
   * Delete a file from storage.
   * 
   * Removes the file from the storage backend. If the file doesn't exist,
   * the operation should succeed silently (idempotent).
   * 
   * @param path - The file path to delete
   * @returns Promise that resolves when the file is deleted
   * @throws {Error} If file deletion fails (permissions, etc.)
   * 
   * @example
   * ```typescript
   * await storage.delete('uploads/abc123-test.txt');
   * ```
   */
  delete(path: string): Promise<void>;

  /**
   * List files in storage.
   * 
   * Returns a list of all files with their metadata, optionally filtered
   * by a path prefix.
   * 
   * @param prefix - Optional path prefix to filter files (e.g., 'uploads/images/')
   * @returns Promise resolving to an array of file metadata
   * @throws {Error} If listing files fails (permissions, etc.)
   * 
   * @example
   * ```typescript
   * // List all files
   * const allFiles = await storage.list();
   * 
   * // List files with prefix
   * const images = await storage.list('uploads/images/');
   * ```
   */
  list(prefix?: string): Promise<FileMetadata[]>;

  /**
   * Get the public URL for a file.
   * 
   * Returns a URL that can be used to access the file publicly.
   * For local storage, this returns a relative path.
   * For cloud storage, this returns a full URL.
   * 
   * @param path - The file path
   * @returns Promise resolving to the public URL
   * @throws {Error} If the file doesn't exist or URL generation fails
   * 
   * @example
   * ```typescript
   * const url = await storage.getUrl('uploads/abc123-test.txt');
   * // Local storage: '/uploads/abc123-test.txt'
   * // Cloud storage: 'https://cdn.example.com/uploads/abc123-test.txt'
   * ```
   */
  getUrl(path: string): Promise<string>;
}

