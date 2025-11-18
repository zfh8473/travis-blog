import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createCommentSchema } from "@/lib/validations/comment";
import { sanitizeText } from "@/lib/utils/sanitize";
import { MAX_COMMENT_DEPTH } from "@/lib/utils/comment-depth";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: { message: "Article not found" } },
        { status: 404 }
      );
    }

    // Fetch all comments for the article
    const comments = await prisma.comment.findMany({
      where: { articleId: article.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Organize comments into a tree structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    // Initialize map
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Build tree
    comments.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        } else {
          // Parent not found (maybe deleted), treat as root? Or ignore.
          // For now, if parent is missing, we might treat it as root or orphan.
          // Let's treat as root to be safe, or just ignore.
          // Ideally, cascade delete prevents this.
          rootComments.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    // Sort replies by date (oldest first for conversation flow, or newest first? usually oldest first for nested)
    const sortReplies = (commentList: any[]) => {
      commentList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      commentList.forEach((c) => {
        if (c.replies.length > 0) {
          sortReplies(c.replies);
        }
      });
    };

    // Sort root comments by date (newest first)
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Sort replies
    rootComments.forEach(c => {
        if (c.replies.length > 0) {
            sortReplies(c.replies);
        }
    });

    return NextResponse.json({ success: true, data: rootComments });
  } catch (error) {
    console.error("[Comments GET] Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch comments" } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const article = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: { message: "Article not found" } },
        { status: 404 }
      );
    }

    const validationResult = createCommentSchema.safeParse({
      ...body,
      articleId: article.id,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: validationResult.error.issues[0]?.message || "Validation failed" },
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Check max depth
    if (validatedData.parentId) {
      let currentParentId: string | null = validatedData.parentId;
      let depth = 0;
      
      while (currentParentId && depth < MAX_COMMENT_DEPTH) {
         const ancestor: { parentId: string | null } | null = await prisma.comment.findUnique({
             where: { id: currentParentId },
             select: { parentId: true }
         });
         if (!ancestor) break;
         currentParentId = ancestor.parentId;
         depth++;
      }

      if (depth >= MAX_COMMENT_DEPTH) {
          return NextResponse.json(
              { success: false, error: { message: `已达到最大回复深度 (${MAX_COMMENT_DEPTH})` } },
              { status: 400 }
          );
      }
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // If not logged in, authorName is required (enforced by schema or logic?)
    // Schema has it optional. Let's enforce it if no userId.
    if (!userId && !validatedData.authorName) {
         return NextResponse.json(
            { success: false, error: { message: "未登录用户必须提供昵称" } },
            { status: 400 }
        );
    }

    const sanitizedContent = sanitizeText(validatedData.content);

    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        articleId: validatedData.articleId,
        userId: userId || null,
        parentId: validatedData.parentId || null,
        authorName: userId ? null : validatedData.authorName, // Only save authorName for guests
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

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error("[Comments POST] Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to create comment" } },
      { status: 500 }
    );
  }
}

