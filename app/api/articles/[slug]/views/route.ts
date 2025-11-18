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
  try {
    const { slug } = await params;
    console.log("[Views API] Received slug:", slug);

    // Decode URL-encoded slug if needed
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
      console.log("[Views API] Decoded slug:", decodedSlug);
    } catch {
      // Already decoded or invalid encoding, use original
      decodedSlug = slug;
      console.log("[Views API] Using original slug (decode failed)");
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
      console.error("[Views API] Article not found for slug:", decodedSlug);
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
      console.log("[Views API] Article is not published, status:", article.status);
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

    console.log("[Views API] Article views incremented:", {
      articleId: article.id,
      slug: decodedSlug,
      newViews: updatedArticle.views,
    });

    // Create response with explicit headers to ensure proper connection handling
    const response = NextResponse.json({
      success: true,
      data: {
        views: updatedArticle.views,
      },
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'close',
      },
    });

    console.log("[Views API] Response created, sending to client");
    return response;
  } catch (error) {
    console.error("[Views API] Error in POST handler:", error);
    console.error("[Views API] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to process request",
          code: "INTERNAL_ERROR",
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

