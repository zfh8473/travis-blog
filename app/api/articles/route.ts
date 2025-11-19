import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequestOrHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { createArticleSchema } from "@/lib/validations/article";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Ensure Node.js runtime for Prisma
export const runtime = "nodejs";
export const maxDuration = 30; // 30 seconds max duration

/**
 * Get article list with pagination and filtering.
 * 
 * Returns a paginated list of articles with optional filtering by status,
 * category, or tag. Only accessible to ADMIN users.
 * 
 * @route GET /api/articles
 * @requires Authentication (ADMIN role)
 * 
 * @queryParams
 * - status?: "DRAFT" | "PUBLISHED" - Filter by status
 * - categoryId?: string - Filter by category ID
 * - tagId?: string - Filter by tag ID
 * - page?: number - Page number (default: 1)
 * - limit?: number - Items per page (default: 20, max: 50)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/articles?status=PUBLISHED&page=1&limit=20', {
 *   headers: { 'Cookie': 'next-auth.session-token=...' }
 * });
 * ```
 */
export async function GET(request: NextRequest) {
  // Get user information from request (with fallback to direct token reading)
  const user = await getUserFromRequestOrHeaders(request, request.headers);

  // Check if user is authenticated and has ADMIN role
  const adminError = requireAdmin(user);
  if (adminError) {
    return adminError;
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as "DRAFT" | "PUBLISHED" | null;
    const categoryId = searchParams.get("categoryId") || undefined;
    const tagId = searchParams.get("tagId") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Build where clause for filtering
    const where: {
      status?: "DRAFT" | "PUBLISHED";
      categoryId?: string;
      tags?: {
        some: {
          tagId: string;
        };
      };
    } = {};

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tagId) {
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
        createdAt: "desc",
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
    console.error("Error fetching articles:", error);
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

/**
 * Create a new article.
 * 
 * Creates a new article with the provided data. Generates a unique slug
 * from the title and associates the article with categories and tags.
 * 
 * @route POST /api/articles
 * @requires Authentication (ADMIN role)
 * 
 * @requestBody
 * - title: string (required, max 200 chars)
 * - content: string (required, HTML format)
 * - excerpt?: string (optional, max 500 chars)
 * - categoryId?: string (optional, UUID)
 * - tagIds?: string[] (optional, array of UUIDs)
 * - status: "DRAFT" | "PUBLISHED" (required)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/articles', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Cookie': 'next-auth.session-token=...'
 *   },
 *   body: JSON.stringify({
 *     title: "My Article",
 *     content: "<p>Article content</p>",
 *     status: "PUBLISHED"
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  // Try multiple methods to get user information
  // 1. First try getServerSession (most reliable in API routes)
  // Note: getServerSession doesn't work directly with NextRequest in App Router
  // We need to use getUserFromRequestOrHeaders which handles both methods
  let user = await getUserFromRequestOrHeaders(request, request.headers);
  
  // 2. If that fails, try getServerSession as fallback
  if (!user) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        };
      }
    } catch (error) {
      console.error("Error getting session in POST /api/articles:", error);
    }
  }

  // Check if user is authenticated and has ADMIN role
  const adminError = requireAdmin(user);
  if (adminError) {
    return adminError;
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = createArticleSchema.safeParse(body);

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

    // Generate unique slug from title
    const slug = await generateUniqueSlug(title);

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
      title,
      content,
      slug,
      status,
      authorId: user!.id,
    };

    // Set excerpt if provided
    if (excerpt !== undefined && excerpt !== "") {
      articleData.excerpt = excerpt;
    } else {
      articleData.excerpt = null;
    }

    // Set categoryId if provided
    if (categoryId !== undefined && categoryId !== "") {
      articleData.categoryId = categoryId;
    } else {
      articleData.categoryId = null;
    }

    // Set publishedAt if status is PUBLISHED
    if (status === "PUBLISHED") {
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
      if (tagIds && tagIds.length > 0) {
        await tx.articleTag.createMany({
          data: tagIds.map((tagId) => ({
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

    // Transform tags to simple array format
    const transformedArticle = {
      ...article!,
      tags: article!.tags.map((at) => at.tag),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedArticle,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating article:", error);

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
          message: "Failed to create article",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

