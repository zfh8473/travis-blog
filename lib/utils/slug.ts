import { prisma } from "@/lib/db/prisma";

/**
 * Generates a URL-friendly slug from a title.
 * 
 * Converts the title to lowercase, replaces spaces and special characters
 * with hyphens, removes consecutive hyphens, and trims leading/trailing hyphens.
 * 
 * **Note on Chinese character support:**
 * This function preserves Chinese characters (CJK Unified Ideographs) in the slug.
 * For better Chinese character handling (e.g., pinyin conversion), consider using
 * a specialized library like `slugify` or `transliteration` in the future.
 * 
 * @param title - The article title to convert to a slug
 * @returns A URL-friendly slug string
 * 
 * @example
 * ```typescript
 * const slug = generateSlug("Hello World!");
 * // Returns: "hello-world"
 * 
 * const slug2 = generateSlug("  Multiple   Spaces  ");
 * // Returns: "multiple-spaces"
 * 
 * const slug3 = generateSlug("文章标题");
 * // Returns: "文章标题" (Chinese characters preserved)
 * ```
 */
export function generateSlug(title: string): string {
  if (!title || title.trim().length === 0) {
    return "";
  }

  return title
    .toLowerCase()
    .trim()
    // Preserve Chinese characters (CJK Unified Ideographs: \u4e00-\u9fff)
    // and other Unicode word characters, spaces, and hyphens
    .replace(/[^\w\s\u4e00-\u9fff-]/g, "") // Remove special characters except word chars, Chinese chars, spaces, and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
}

/**
 * Generates a unique slug from a title by checking for conflicts.
 * 
 * If a slug already exists in the database, appends a number (e.g., "my-article-2")
 * to ensure uniqueness.
 * 
 * @param title - The article title to convert to a slug
 * @param excludeId - Optional article ID to exclude from uniqueness check (for updates)
 * @returns A unique URL-friendly slug string
 * 
 * @example
 * ```typescript
 * const uniqueSlug = await generateUniqueSlug("My Article");
 * // If "my-article" exists, returns "my-article-2"
 * 
 * const uniqueSlug2 = await generateUniqueSlug("My Article", "existing-article-id");
 * // Excludes the current article from uniqueness check
 * ```
 */
export async function generateUniqueSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  let baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists in database
  while (true) {
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    // If no existing article, or it's the same article (for updates), slug is unique
    if (!existingArticle || (excludeId && existingArticle.id === excludeId)) {
      break;
    }

    // Slug exists, append number
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

