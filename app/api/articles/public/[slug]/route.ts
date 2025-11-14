import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Get published article by slug (public endpoint).
 * 
 * Returns a single published article by slug with all relations.
 * This is a public endpoint - no authentication required.
 * 
 * @route GET /api/articles/public/[slug]
 * @requires No authentication (public access)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/articles/public/article-slug');
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Query article from database by slug
    const article = await prisma.article.findUnique({
      where: { slug },
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

    // Only allow access to published articles
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

