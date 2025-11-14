import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Get published articles (public endpoint).
 * 
 * Returns a list of published articles with optional filtering by category or tag.
 * This is a public endpoint - no authentication required.
 * 
 * @route GET /api/articles/public
 * @requires No authentication (public access)
 * 
 * @queryParams
 * - categoryId?: string - Filter by category ID
 * - categorySlug?: string - Filter by category slug
 * - tagId?: string - Filter by tag ID
 * - tagSlug?: string - Filter by tag slug
 * - page?: number - Page number (default: 1)
 * - limit?: number - Items per page (default: 20, max: 100)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/articles/public?categoryId=xxx&page=1&limit=20');
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const tagId = searchParams.get("tagId") || undefined;
    const tagSlug = searchParams.get("tagSlug") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Build where clause for filtering
    const where: {
      status: "PUBLISHED";
      categoryId?: string;
      tags?: {
        some: {
          tagId: string;
        };
      };
    } = {
      status: "PUBLISHED", // Only published articles
    };

    // Handle category filtering
    if (categorySlug) {
      // Find category by slug first
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      if (category) {
        where.categoryId = category.id;
      } else {
        // Category not found, return empty result
        return NextResponse.json({
          success: true,
          data: {
            articles: [],
            pagination: {
              page: 1,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
        });
      }
    } else if (categoryId) {
      where.categoryId = categoryId;
    }

    // Handle tag filtering
    if (tagSlug) {
      // Find tag by slug first
      const tag = await prisma.tag.findUnique({
        where: { slug: tagSlug },
        select: { id: true },
      });
      if (tag) {
        where.tags = {
          some: {
            tagId: tag.id,
          },
        };
      } else {
        // Tag not found, return empty result
        return NextResponse.json({
          success: true,
          data: {
            articles: [],
            pagination: {
              page: 1,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
        });
      }
    } else if (tagId) {
      where.tags = {
        some: {
          tagId: tagId,
        },
      };
    }

    // Get total count for pagination
    const total = await prisma.article.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Query articles from database
    const articles = await prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        publishedAt: "desc", // Sort by publish date, newest first
      },
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

    // Transform tags to simple array format
    const transformedArticles = articles.map((article) => ({
      ...article,
      tags: article.tags.map((at) => at.tag),
    }));

    return NextResponse.json({
      success: true,
      data: {
        articles: transformedArticles,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching published articles:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch articles",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

