import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Debug endpoint to test article fetching.
 * 
 * This endpoint helps diagnose issues with article detail page.
 * 
 * @route GET /api/debug/article/[slug]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Decode URL-encoded slug
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {
      decodedSlug = slug;
    }

    // Step 1: Test database connection
    let dbConnected = false;
    try {
      await prisma.$connect();
      dbConnected = true;
    } catch (error) {
      return NextResponse.json({
        success: false,
        step: "database_connection",
        error: error instanceof Error ? error.message : String(error),
      }, { status: 500 });
    }

    // Step 2: Query article
    let article = null;
    try {
      article = await prisma.article.findUnique({
        where: { slug: decodedSlug },
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
    } catch (error) {
      return NextResponse.json({
        success: false,
        step: "article_query",
        slug: decodedSlug,
        error: error instanceof Error ? error.message : String(error),
      }, { status: 500 });
    }

    if (!article) {
      return NextResponse.json({
        success: false,
        step: "article_not_found",
        slug: decodedSlug,
        message: "Article not found in database",
      }, { status: 404 });
    }

    // Step 3: Check status
    if (article.status !== "PUBLISHED") {
      return NextResponse.json({
        success: false,
        step: "article_not_published",
        slug: decodedSlug,
        status: article.status,
        message: "Article is not published",
      }, { status: 404 });
    }

    // Step 4: Validate fields
    const validation = {
      hasId: !!article.id,
      hasTitle: !!article.title,
      hasContent: !!article.content,
      hasSlug: !!article.slug,
      hasAuthor: !!article.author,
      hasCreatedAt: !!article.createdAt,
      hasUpdatedAt: !!article.updatedAt,
    };

    const missingFields = Object.entries(validation)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        step: "validation_failed",
        slug: decodedSlug,
        missingFields,
        validation,
      }, { status: 500 });
    }

    // Step 5: Test serialization
    try {
      const testSerialization = {
        id: String(article.id),
        title: String(article.title),
        content: String(article.content),
        excerpt: article.excerpt ? String(article.excerpt) : null,
        slug: String(article.slug),
        status: "PUBLISHED" as const,
        publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      };
      
      // Try to serialize
      JSON.stringify(testSerialization);
    } catch (error) {
      return NextResponse.json({
        success: false,
        step: "serialization_failed",
        slug: decodedSlug,
        error: error instanceof Error ? error.message : String(error),
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      slug: decodedSlug,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
        hasAuthor: !!article.author,
        hasCategory: !!article.category,
        tagsCount: article.tags.length,
      },
      validation,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      step: "unknown_error",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

