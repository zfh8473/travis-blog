import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { getUserFromRequestOrHeaders } from "@/lib/auth/middleware";

/**
 * Comment data type for unread comments list.
 */
interface UnreadComment {
  id: string;
  content: string;
  articleId: string;
  userId: string | null;
  authorName: string | null;
  createdAt: string;
  article: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

/**
 * GET /api/admin/comments/unread
 * 
 * Returns a list of unread comments for admin users.
 * Only accessible by users with ADMIN role.
 * 
 * Query parameters:
 * - limit: Maximum number of comments to return (default: 20, max: 100)
 * 
 * @returns { success: true, data: { comments: UnreadComment[] } }
 */
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    // First try getUserFromRequestOrHeaders (more robust in Vercel)
    let user = await getUserFromRequestOrHeaders(request, request.headers);
    
    // Fallback to getServerSession if getUserFromRequestOrHeaders fails
    if (!user) {
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        user = {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.name,
          role: session.user.role || Role.USER,
        };
      }
    }
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Authentication required",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      );
    }

    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Admin role required",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // Get limit from query parameters
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = limitParam 
      ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100)
      : 20;

    // Fetch unread comments with article information
    const comments = await prisma.comment.findMany({
      where: {
        isRead: false,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Newest first
      },
      take: limit,
    });

    // Transform to response format
    const transformedComments: UnreadComment[] = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      articleId: comment.articleId,
      userId: comment.userId,
      authorName: comment.authorName,
      createdAt: comment.createdAt.toISOString(),
      article: {
        id: comment.article.id,
        title: comment.article.title,
        slug: comment.article.slug,
      },
      user: comment.user,
    }));

    return NextResponse.json({
      success: true,
      data: {
        comments: transformedComments,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/comments/unread] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch unread comments",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

