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
  const startTime = Date.now();
  console.log("[GET /api/comments] Request received at", new Date().toISOString());
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const articleId = searchParams.get("articleId");
    console.log("[GET /api/comments] articleId:", articleId);

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
    console.log("[GET /api/comments] Querying database. Time so far:", Date.now() - startTime, "ms");
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
    // Ensure all string fields are explicitly converted to prevent React error #418
    allCommentsRaw.forEach((comment) => {
      commentMap.set(comment.id, {
        id: String(comment.id),
        content: String(comment.content || ""), // Ensure content is never null/undefined
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
    // Ensure replies array is valid before sorting
    const sortReplies = (comment: any) => {
      if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
        comment.replies.sort(
          (a: any, b: any) => {
            try {
              const dateA = new Date(a.createdAt || "").getTime();
              const dateB = new Date(b.createdAt || "").getTime();
              return dateA - dateB;
            } catch (error) {
              console.error("Error sorting replies:", error);
              return 0;
            }
          }
        );
        comment.replies.forEach(sortReplies);
      }
    };
    topLevelComments.forEach(sortReplies);

    const totalTime = Date.now() - startTime;
    console.log("[GET /api/comments] Response ready, total time:", totalTime, "ms", "comments count:", topLevelComments.length);

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
  const startTime = Date.now();
  console.log("[POST /api/comments] Request received at", new Date().toISOString());
  
  try {
    const body = await request.json();
    console.log("[POST /api/comments] Body parsed, articleId:", body.articleId, "has authorName:", !!body.authorName, "has userId:", !!body.userId);

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
    // For anonymous comments, skip session check entirely to avoid timeout issues
    // Anonymous users provide authorName, logged-in users provide userId
    let userId: string | null = null;
    
    // Only try to get session if userId is explicitly provided in request
    // This means it's a logged-in user (client sends userId from session)
    // Anonymous users don't send userId, so we skip session check completely
    console.log("[POST /api/comments] Checking session - userId provided:", !!validatedData.userId, "authorName provided:", !!validatedData.authorName);
    
    if (validatedData.userId) {
      console.log("[POST /api/comments] Attempting to get session for logged-in user");
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
    
    // Final userId: from session (if we tried to get it), or from request, or null for anonymous
    // For anonymous users, validatedData.userId is null, so userId will be null
    // For logged-in users, userId comes from session or validatedData.userId
    userId = userId || validatedData.userId || null;
    console.log("[POST /api/comments] Final userId:", userId ? "logged-in" : "anonymous", "Time so far:", Date.now() - startTime, "ms");

    // Sanitize comment content to prevent XSS
    console.log("[POST /api/comments] Sanitizing content, length:", validatedData.content.length);
    const sanitizedContent = DOMPurify.sanitize(validatedData.content, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
    console.log("[POST /api/comments] Content sanitized, creating comment in database. Time so far:", Date.now() - startTime, "ms");

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

    console.log("[POST /api/comments] Comment created, transforming response. Time so far:", Date.now() - startTime, "ms");
    
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

    const totalTime = Date.now() - startTime;
    console.log("[POST /api/comments] Response ready, total time:", totalTime, "ms");
    
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

