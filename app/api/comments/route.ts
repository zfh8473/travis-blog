import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserFromRequestOrHeaders } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { createCommentSchema, getCommentsSchema } from "@/lib/validations/comment";
import DOMPurify from "isomorphic-dompurify";
import { MAX_COMMENT_DEPTH } from "@/lib/utils/comment-depth";

/**
 * Comment data type with user information.
 * Note: createdAt and updatedAt are ISO strings in API responses.
 */
export interface Comment {
  id: string;
  content: string;
  articleId: string;
  userId: string | null;
  parentId: string | null;
  authorName: string | null;
  createdAt: string; // ISO string in API responses
  updatedAt: string; // ISO string in API responses
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  replies?: Comment[];
}

/**
 * GET /api/comments?articleId=xxx
 * 
 * Fetches all comments for an article, including nested replies.
 * Returns comments in nested structure, sorted by creation time.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get("articleId");

    // Validate input
    const validationResult = getCommentsSchema.safeParse({ articleId });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: validationResult.error.issues[0]?.message || "Invalid article ID",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    // Query all comments for the article
    const allCommentsRaw = await prisma.comment.findMany({
      where: {
        articleId: validationResult.data.articleId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Build nested structure in memory
    const commentMap = new Map<string, any>();
    const topLevelComments: any[] = [];

    // First pass: create comment objects
    allCommentsRaw.forEach((comment) => {
      commentMap.set(comment.id, {
        id: String(comment.id),
        content: String(comment.content),
        articleId: String(comment.articleId),
        userId: comment.userId ? String(comment.userId) : null,
        parentId: comment.parentId ? String(comment.parentId) : null,
        authorName: comment.authorName ? String(comment.authorName) : null,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: comment.user
          ? {
              id: String(comment.user.id),
              name: comment.user.name ? String(comment.user.name) : null,
              image: comment.user.image ? String(comment.user.image) : null,
            }
          : null,
        replies: [],
      });
    });

    // Second pass: build nested structure
    allCommentsRaw.forEach((comment) => {
      const commentData = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentData);
        }
      } else {
        topLevelComments.push(commentData);
      }
    });

    // Sort top-level comments (newest first)
    topLevelComments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Sort replies within each comment (oldest first)
    const sortReplies = (comment: any) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort(
          (a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        comment.replies.forEach(sortReplies);
      }
    };
    topLevelComments.forEach(sortReplies);

    return NextResponse.json({
      success: true,
      data: topLevelComments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch comments",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * 
 * Creates a new comment or reply.
 * Supports both logged-in and anonymous users.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createCommentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: validationResult.error.issues[0]?.message || "Validation failed",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: validatedData.articleId },
      select: { id: true },
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

    // If this is a reply, validate parent comment
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
        select: {
          id: true,
          articleId: true,
          parentId: true,
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Parent comment not found",
              code: "PARENT_COMMENT_NOT_FOUND",
            },
          },
          { status: 404 }
        );
      }

      // Verify parent comment belongs to the same article
      if (parentComment.articleId !== validatedData.articleId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Parent comment does not belong to this article",
              code: "INVALID_PARENT_COMMENT",
            },
          },
          { status: 400 }
        );
      }

      // Calculate nesting depth
      let currentParentId: string | null = parentComment.parentId;
      let depth = 1;

      while (currentParentId && depth < MAX_COMMENT_DEPTH) {
        const currentParent = await prisma.comment.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

        if (!currentParent) {
          break;
        }

        currentParentId = currentParent.parentId;
        depth++;
      }

      // Check if maximum depth would be exceeded
      if (depth >= MAX_COMMENT_DEPTH) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `已达到最大回复深度（${MAX_COMMENT_DEPTH} 层）`,
              code: "MAX_DEPTH_EXCEEDED",
            },
          },
          { status: 400 }
        );
      }
    }

    // Get user session (if logged in)
    // For anonymous comments (no userId in request), skip session check entirely
    // This avoids timeout issues in Vercel environment
    let userId: string | null = null;
    
    // Only try to get session if this might be a logged-in user
    // Check if userId is provided OR if authorName is not provided (logged-in users don't provide authorName)
    const mightBeLoggedIn = validatedData.userId || !validatedData.authorName;
    
    if (mightBeLoggedIn) {
      try {
        // Add timeout to prevent hanging in Vercel (2 seconds)
        const timeoutPromise = new Promise<string | null>((resolve) => {
          setTimeout(() => {
            console.warn("[POST /api/comments] Session check timeout, proceeding as anonymous");
            resolve(null);
          }, 2000);
        });
        
        const sessionPromise = (async (): Promise<string | null> => {
          try {
            // Try getUserFromRequestOrHeaders first (faster, more reliable)
            const user = await getUserFromRequestOrHeaders(request, request.headers);
            if (user) {
              return user.id;
            }
            
            // Fallback to getServerSession (may hang in Vercel)
            const session = await getServerSession(authOptions);
            return session?.user?.id || null;
          } catch (error) {
            console.error("[POST /api/comments] Error getting session:", error);
            return null;
          }
        })();
        
        userId = await Promise.race([sessionPromise, timeoutPromise]);
      } catch (error) {
        console.error("[POST /api/comments] Unexpected error in session check:", error);
        // Continue as anonymous user
        userId = null;
      }
    }
    
    // Final userId: from session, from request, or null for anonymous
    userId = userId || validatedData.userId || null;

    // Sanitize comment content to prevent XSS
    const sanitizedContent = DOMPurify.sanitize(validatedData.content, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    // Create comment in database
    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        articleId: validatedData.articleId,
        userId: userId,
        parentId: validatedData.parentId || null,
        authorName: userId ? null : validatedData.authorName || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Transform to response format
    // Ensure Date objects are converted to ISO strings for JSON serialization
    const responseData: Comment = {
      id: String(comment.id),
      content: String(comment.content),
      articleId: String(comment.articleId),
      userId: comment.userId ? String(comment.userId) : null,
      parentId: comment.parentId ? String(comment.parentId) : null,
      authorName: comment.authorName ? String(comment.authorName) : null,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: comment.user
        ? {
            id: String(comment.user.id),
            name: comment.user.name ? String(comment.user.name) : null,
            image: comment.user.image ? String(comment.user.image) : null,
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to create comment",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

