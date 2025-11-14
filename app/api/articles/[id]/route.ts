import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { updateArticleSchema } from "@/lib/validations/article";
import { generateUniqueSlug } from "@/lib/utils/slug";

/**
 * Get article detail by ID.
 * 
 * Returns a single article with all relations (author, category, tags).
 * Draft articles require ADMIN role, published articles allow public access.
 * 
 * @route GET /api/articles/[id]
 * @requires Authentication (ADMIN role for draft articles, optional for published)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/articles/article-id', {
 *   headers: { 'Cookie': 'next-auth.session-token=...' }
 * });
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id;

  try {
    // Query article from database
    const article = await prisma.article.findUnique({
      where: { id: articleId },
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

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Article not found",
            code: "ARTICLE_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Check article status and permissions
    const user = getUserFromHeaders(request.headers);

    // If article is DRAFT, require ADMIN role
    if (article.status === "DRAFT") {
      const adminError = requireAdmin(user);
      if (adminError) {
        return adminError;
      }
    }
    // If article is PUBLISHED, allow public access (optional authentication)

    // Transform tags to simple array format
    const transformedArticle = {
      ...article,
      tags: article.tags.map((at) => at.tag),
    };

    return NextResponse.json({
      success: true,
      data: transformedArticle,
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch article",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Update an existing article.
 * 
 * Updates an article with the provided data. Supports partial updates.
 * If title is updated, regenerates slug. Updates publishedAt when status changes.
 * 
 * @route PUT /api/articles/[id]
 * @requires Authentication (ADMIN role)
 * 
 * @requestBody (all fields optional)
 * - title?: string (max 200 chars)
 * - content?: string (HTML format)
 * - excerpt?: string (max 500 chars)
 * - categoryId?: string (UUID)
 * - tagIds?: string[] (array of UUIDs)
 * - status?: "DRAFT" | "PUBLISHED"
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/articles/article-id', {
 *   method: 'PUT',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Cookie': 'next-auth.session-token=...'
 *   },
 *   body: JSON.stringify({
 *     title: "Updated Title",
 *     status: "PUBLISHED"
 *   })
 * });
 * ```
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id;

  // Get user information from request headers (set by middleware)
  const user = getUserFromHeaders(request.headers);

  // Check if user is authenticated and has ADMIN role
  const adminError = requireAdmin(user);
  if (adminError) {
    return adminError;
  }

  try {
    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, status: true },
    });

    if (!existingArticle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Article not found",
            code: "ARTICLE_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = updateArticleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid input data",
            code: "VALIDATION_ERROR",
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { title, content, excerpt, categoryId, tagIds, status } =
      validationResult.data;

    // Prepare update data (only include fields that are provided)
    const updateData: {
      title?: string;
      content?: string;
      excerpt?: string | null;
      slug?: string;
      status?: "DRAFT" | "PUBLISHED";
      categoryId?: string | null;
      publishedAt?: Date | null;
    } = {};

    // If title is updated, regenerate slug
    if (title !== undefined && title !== existingArticle.title) {
      updateData.title = title;
      updateData.slug = await generateUniqueSlug(title, articleId);
    }

    // Update content if provided
    if (content !== undefined) {
      updateData.content = content;
    }

    // Update excerpt if provided
    if (excerpt !== undefined) {
      updateData.excerpt = excerpt === "" ? null : excerpt;
    }

    // Update categoryId if provided
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId === "" ? null : categoryId;
    }

    // Update status if provided
    if (status !== undefined) {
      updateData.status = status;

      // Update publishedAt based on status change
      if (status === "PUBLISHED" && existingArticle.status === "DRAFT") {
        // Status changed from DRAFT to PUBLISHED
        updateData.publishedAt = new Date();
      } else if (status === "DRAFT" && existingArticle.status === "PUBLISHED") {
        // Status changed from PUBLISHED to DRAFT
        updateData.publishedAt = null;
      }
    }

    // Update article with tags in a transaction
    const article = await prisma.$transaction(async (tx) => {
      // Update article
      const updatedArticle = await tx.article.update({
        where: { id: articleId },
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

      // Update ArticleTag records if tagIds provided
      if (tagIds !== undefined) {
        // Delete existing ArticleTag records
        await tx.articleTag.deleteMany({
          where: { articleId },
        });

        // Create new ArticleTag records if tagIds provided
        if (tagIds.length > 0) {
          await tx.articleTag.createMany({
            data: tagIds.map((tagId) => ({
              articleId,
              tagId,
            })),
          });

          // Reload article with tags
          return await tx.article.findUnique({
            where: { id: articleId },
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
      }

      return updatedArticle;
    });

    // Transform tags to simple array format
    const transformedArticle = {
      ...article!,
      tags: article!.tags.map((at) => at.tag),
    };

    return NextResponse.json({
      success: true,
      data: transformedArticle,
    });
  } catch (error) {
    console.error("Error updating article:", error);

    // Handle database errors
    if (error instanceof Error) {
      // Prisma unique constraint error (e.g., duplicate slug)
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Article with this slug already exists",
              code: "DUPLICATE_SLUG",
            },
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to update article",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Delete an article.
 * 
 * Deletes an article and all related data (ArticleTag records, Comment records).
 * Category relation is set to null (onDelete: SetNull).
 * 
 * @route DELETE /api/articles/[id]
 * @requires Authentication (ADMIN role)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/articles/article-id', {
 *   method: 'DELETE',
 *   headers: { 'Cookie': 'next-auth.session-token=...' }
 * });
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id;

  // Get user information from request headers (set by middleware)
  const user = getUserFromHeaders(request.headers);

  // Check if user is authenticated and has ADMIN role
  const adminError = requireAdmin(user);
  if (adminError) {
    return adminError;
  }

  try {
    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true },
    });

    if (!existingArticle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Article not found",
            code: "ARTICLE_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Delete article (cascade deletes ArticleTag and Comment records)
    // Category relation is set to null (onDelete: SetNull)
    await prisma.article.delete({
      where: { id: articleId },
    });

    return NextResponse.json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to delete article",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

