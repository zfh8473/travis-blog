import { StorageInterface } from "./interface";
import { LocalStorage } from "./local";

/**
 * Storage type configuration.
 * 
 * Determines which storage backend to use based on environment variable.
 * Defaults to 'local' if not specified.
 */
type StorageType = "local" | "s3" | "cloudinary" | "vercel-blob";

/**
 * Gets the storage instance based on configuration.
 * 
 * Returns a storage implementation instance based on the `STORAGE_TYPE`
 * environment variable. Defaults to local file system storage if not
 * specified or if the specified type is not supported.
 * 
 * This function implements the factory pattern to allow switching
 * between different storage backends without changing the code that
 * uses the storage layer.
 * 
 * @returns {StorageInterface} Storage implementation instance
 * 
 * @example
 * ```typescript
 * import { getStorage } from '@/lib/storage';
 * 
 * const storage = getStorage();
 * const filePath = await storage.upload(file);
 * ```
 * 
 * @see ADR-004: Storage Abstraction Layer
 */
export function getStorage(): StorageInterface {
  const storageType = (process.env.STORAGE_TYPE || "local") as StorageType;

  switch (storageType) {
    case "local":
      return new LocalStorage();
    // Future implementations:
    // case "s3":
    //   return new S3Storage();
    // case "cloudinary":
    //   return new CloudinaryStorage();
    // case "vercel-blob":
    //   return new VercelBlobStorage();
    default:
      // Default to local storage if unknown type is specified
      console.warn(
        `Unknown storage type: ${storageType}. Falling back to local storage.`
      );
      return new LocalStorage();
  }
}

// Re-export types and classes for convenience
export type { StorageInterface, FileMetadata } from "./interface";
export { LocalStorage } from "./local";

