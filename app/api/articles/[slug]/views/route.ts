import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Ensure this route runs in Node.js runtime (required for Prisma)
export const runtime = "nodejs";

/**
 * Increment article view count.
 * 
 * Increments the view count for a published article by slug.
 * This is a public endpoint - no authentication required.
 * 
 * @route POST /api/articles/[slug]/views
 * @requires No authentication (public access)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/articles/article-slug/views', {
 *   method: 'POST'
 * });
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Decode URL-encoded slug if needed
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    // Already decoded or invalid encoding, use original
    decodedSlug = slug;
  }

  try {
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
      console.error("Article not found for slug:", decodedSlug);
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

    // Only increment views for published articles
    if (article.status !== "PUBLISHED") {
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

    console.log("Article views incremented:", {
      articleId: article.id,
      slug: decodedSlug,
      newViews: updatedArticle.views,
    });

    return NextResponse.json({
      success: true,
      data: {
        views: updatedArticle.views,
      },
    });
  } catch (error) {
    console.error("Error incrementing article views:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to increment views",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

