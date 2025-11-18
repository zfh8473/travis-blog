"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db/prisma";
import { createArticleSchema, updateArticleSchema } from "@/lib/validations/article";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { ActionResult } from "@/lib/types/action-result";

/**
 * Input type for creating an article.
 */
export interface CreateArticleInput {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  tagIds?: string[];
  status: "DRAFT" | "PUBLISHED";
}

/**
 * Input type for updating an article.
 */
export interface UpdateArticleInput {
  title?: string;
  content?: string;
  excerpt?: string;
  categoryId?: string;
  tagIds?: string[];
  status?: "DRAFT" | "PUBLISHED";
}

/**
 * Article type returned from actions.
 */
export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  categoryId: string | null;
  authorId: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ id: string; name: string; slug: string }>;
}

/**
 * Server action to increment article view count.
 * 
 * This is a public action - no authentication required.
 * Increments the view count for a published article by slug.
 * 
 * @param slug - Article slug
 * @returns Promise resolving to the updated view count or an error
 * 
 * @example
 * ```typescript
 * const result = await incrementArticleViewsAction("article-slug");
 * 
 * if (result.success) {
 *   console.log('Views:', result.data.views);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export async function incrementArticleViewsAction(
  slug: string
): Promise<ActionResult<{ views: number }>> {
  try {
    console.log("[Views Action] Received slug:", slug);

    // Decode URL-encoded slug if needed
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
      console.log("[Views Action] Decoded slug:", decodedSlug);
    } catch {
      // Already decoded or invalid encoding, use original
      decodedSlug = slug;
      console.log("[Views Action] Using original slug (decode failed)");
    }

    // Find the article by slug
    const article = await prisma.article.findUnique({
      where: { slug: decodedSlug },
      select: {
        id: true,
        status: true,
      },
    });

    // Article not found
    if (!article) {
      console.error("[Views Action] Article not found for slug:", decodedSlug);
      return {
        success: false,
        error: {
          message: "Article not found",
          code: "ARTICLE_NOT_FOUND",
        },
      };
    }

    // Only increment views for published articles
    if (article.status !== "PUBLISHED") {
      console.log("[Views Action] Article is not published, status:", article.status);
      return {
        success: false,
        error: {
          message: "Article not found",
          code: "ARTICLE_NOT_FOUND",
        },
      };
    }

    // Increment view count atomically
    const updatedArticle = await prisma.article.update({
      where: { id: article.id },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        views: true,
      },
    });

    console.log("[Views Action] Article views incremented:", {
      articleId: article.id,
      slug: decodedSlug,
      newViews: updatedArticle.views,
    });

    return {
      success: true,
      data: {
        views: updatedArticle.views,
      },
    };
  } catch (error) {
    console.error("[Views Action] Error in incrementArticleViewsAction:", error);
    console.error("[Views Action] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return {
      success: false,
      error: {
        message: "Failed to process request",
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Server action to create a new article.
 * 
 * This action handles article creation on the server side,
 * including validation, authorization checks, and database operations.
 * Only administrators can create articles.
 * 
 * @param data - Article data including title, content, and optional fields
 * @returns Promise resolving to the created article or an error
 * 
 * @example
 * ```typescript
 * const result = await createArticleAction({
 *   title: "My Article",
 *   content: "<p>Article content</p>",
 *   status: "DRAFT"
 * });
 * 
 * if (result.success) {
 *   console.log('Article created:', result.data);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export async function createArticleAction(
  data: CreateArticleInput
): Promise<ActionResult<Article>> {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const user = session?.user;

    // Check authentication and admin role
    if (!user) {
      return {
        success: false,
        error: {
          message: "请先登录",
          code: "UNAUTHORIZED",
        },
      };
    }

    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: {
          message: "您没有权限执行此操作",
          code: "FORBIDDEN",
        },
      };
    }

    // Validate input
    const validationResult = createArticleSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          message: validationResult.error.issues[0]?.message || "Validation failed",
          code: "VALIDATION_ERROR",
        },
      };
    }

    const validatedData = validationResult.data;

    // Generate unique slug from title
    const slug = await generateUniqueSlug(validatedData.title);

    // Prepare article data
    const articleData: {
      title: string;
      content: string;
      excerpt?: string | null;
      slug: string;
      status: "DRAFT" | "PUBLISHED";
      categoryId?: string | null;
      authorId: string;
      publishedAt?: Date | null;
    } = {
      title: validatedData.title,
      content: validatedData.content,
      slug,
      status: validatedData.status,
      authorId: user.id,
    };

    // Set excerpt if provided
    if (validatedData.excerpt !== undefined && validatedData.excerpt !== "") {
      articleData.excerpt = validatedData.excerpt;
    } else {
      articleData.excerpt = null;
    }

    // Set categoryId if provided
    if (validatedData.categoryId !== undefined && validatedData.categoryId !== "") {
      articleData.categoryId = validatedData.categoryId;
    } else {
      articleData.categoryId = null;
    }

    // Set publishedAt if status is PUBLISHED
    if (validatedData.status === "PUBLISHED") {
      articleData.publishedAt = new Date();
    } else {
      articleData.publishedAt = null;
    }

    // Create article with tags in a transaction
    const article = await prisma.$transaction(async (tx) => {
      // Create article
      const createdArticle = await tx.article.create({
        data: articleData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // Create ArticleTag records if tagIds provided
      if (validatedData.tagIds && validatedData.tagIds.length > 0) {
        await tx.articleTag.createMany({
          data: validatedData.tagIds.map((tagId) => ({
            articleId: createdArticle.id,
            tagId,
          })),
        });

        // Reload article with tags
        return await tx.article.findUnique({
          where: { id: createdArticle.id },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            category: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });
      }

      return createdArticle;
    });

    if (!article) {
      return {
        success: false,
        error: {
          message: "Failed to create article",
          code: "INTERNAL_ERROR",
        },
      };
    }

    // Transform to Article interface
    const resultArticle: Article = {
      id: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      slug: article.slug,
      status: article.status,
      categoryId: article.categoryId,
      authorId: article.authorId,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      tags: article.tags.map((at) => ({
        id: at.tag.id,
        name: at.tag.name,
        slug: at.tag.slug,
      })),
    };

    return {
      success: true,
      data: resultArticle,
    };
  } catch (error) {
    console.error("Error creating article:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to create article",
        code: "INTERNAL_ERROR",
      },
    };
  }
}

/**
 * Server action to update an existing article.
 * 
 * This action handles article updates on the server side,
 * including validation, authorization checks, and database operations.
 * Only administrators can update articles.
 * 
 * @param id - Article ID
 * @param data - Article data to update (all fields optional)
 * @returns Promise resolving to the updated article or an error
 * 
 * @example
 * ```typescript
 * const result = await updateArticleAction("article-123", {
 *   title: "Updated Title",
 *   status: "PUBLISHED"
 * });
 * 
 * if (result.success) {
 *   console.log('Article updated:', result.data);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export async function updateArticleAction(
  id: string,
  data: UpdateArticleInput
): Promise<ActionResult<Article>> {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const user = session?.user;

    // Check authentication and admin role
    if (!user) {
      return {
        success: false,
        error: {
          message: "请先登录",
          code: "UNAUTHORIZED",
        },
      };
    }

    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: {
          message: "您没有权限执行此操作",
          code: "FORBIDDEN",
        },
      };
    }

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: { id: true, status: true, title: true },
    });

    if (!existingArticle) {
      return {
        success: false,
        error: {
          message: "Article not found",
          code: "ARTICLE_NOT_FOUND",
        },
      };
    }

    // Validate input
    const validationResult = updateArticleSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          message: validationResult.error.issues[0]?.message || "Validation failed",
          code: "VALIDATION_ERROR",
        },
      };
    }

    const validatedData = validationResult.data;

    // Prepare update data
    const updateData: {
      title?: string;
      content?: string;
      excerpt?: string | null;
      slug?: string;
      status?: "DRAFT" | "PUBLISHED";
      categoryId?: string | null;
      publishedAt?: Date | null;
    } = {};

    // Update title and regenerate slug if title changed
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
      updateData.slug = await generateUniqueSlug(validatedData.title, id);
    }

    // Update content if provided
    if (validatedData.content !== undefined) {
      updateData.content = validatedData.content;
    }

    // Update excerpt if provided
    if (validatedData.excerpt !== undefined) {
      updateData.excerpt = validatedData.excerpt === "" ? null : validatedData.excerpt;
    }

    // Update categoryId if provided
    if (validatedData.categoryId !== undefined) {
      updateData.categoryId = validatedData.categoryId === "" ? null : validatedData.categoryId;
    }

    // Update status and publishedAt if status changed
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      if (validatedData.status === "PUBLISHED") {
        // Only set publishedAt if article wasn't already published
        const currentArticle = await prisma.article.findUnique({
          where: { id },
          select: { publishedAt: true },
        });
        if (!currentArticle?.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
    }

    // Update article with tags in a transaction
    const article = await prisma.$transaction(async (tx) => {
      // Update article
      const updatedArticle = await tx.article.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // Update tags if provided
      if (validatedData.tagIds !== undefined) {
        // Delete existing ArticleTag records
        await tx.articleTag.deleteMany({
          where: { articleId: id },
        });

        // Create new ArticleTag records
        if (validatedData.tagIds.length > 0) {
          await tx.articleTag.createMany({
            data: validatedData.tagIds.map((tagId) => ({
              articleId: id,
              tagId,
            })),
          });
        }

        // Reload article with updated tags
        return await tx.article.findUnique({
          where: { id },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            category: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });
      }

      return updatedArticle;
    });

    if (!article) {
      return {
        success: false,
        error: {
          message: "Failed to update article",
          code: "INTERNAL_ERROR",
        },
      };
    }

    // Transform to Article interface
    const resultArticle: Article = {
      id: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      slug: article.slug,
      status: article.status,
      categoryId: article.categoryId,
      authorId: article.authorId,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      tags: article.tags.map((at) => ({
        id: at.tag.id,
        name: at.tag.name,
        slug: at.tag.slug,
      })),
    };

    return {
      success: true,
      data: resultArticle,
    };
  } catch (error) {
    console.error("Error updating article:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to update article",
        code: "INTERNAL_ERROR",
      },
    };
  }
}

/**
 * Server action to delete an article.
 * 
 * This action handles article deletion on the server side,
 * including authorization checks and database operations.
 * Only administrators can delete articles.
 * 
 * @param id - Article ID to delete
 * @returns Promise resolving to success status or an error
 * 
 * @example
 * ```typescript
 * const result = await deleteArticleAction("article-123");
 * 
 * if (result.success) {
 *   console.log('Article deleted successfully');
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export async function deleteArticleAction(
  id: string
): Promise<ActionResult<{ message: string }>> {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const user = session?.user;

    // Check authentication and admin role
    if (!user) {
      return {
        success: false,
        error: {
          message: "请先登录",
          code: "UNAUTHORIZED",
        },
      };
    }

    if (user.role !== "ADMIN") {
      return {
        success: false,
        error: {
          message: "您没有权限执行此操作",
          code: "FORBIDDEN",
        },
      };
    }

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingArticle) {
      return {
        success: false,
        error: {
          message: "Article not found",
          code: "ARTICLE_NOT_FOUND",
        },
      };
    }

    // Delete article (cascade deletes ArticleTag and Comment records)
    // Category relation is set to null (onDelete: SetNull)
    await prisma.article.delete({
      where: { id },
    });

    return {
      success: true,
      data: {
        message: "Article deleted successfully",
      },
    };
  } catch (error) {
    console.error("Error deleting article:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to delete article",
        code: "INTERNAL_ERROR",
      },
    };
  }
}
