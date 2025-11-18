import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserFromRequestOrHeaders } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

/**
 * DELETE /api/comments/[id]
 * 
 * Deletes a comment and all its nested replies (cascade delete).
 * Only administrators can delete comments.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Comment ID is required",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    // Get user session
    // Try getUserFromRequestOrHeaders first (more reliable in API routes)
    let user = await getUserFromRequestOrHeaders(request, request.headers);
    
    if (!user) {
      // Fallback to getServerSession
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
        console.error("Error getting session in DELETE /api/comments/[id]:", error);
      }
    }

    // Check if user is admin
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Unauthorized - Admin access required",
            code: "UNAUTHORIZED",
          },
        },
        { status: 403 }
      );
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Comment not found",
            code: "COMMENT_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Delete comment (cascade delete will handle nested replies)
    // Prisma will automatically delete all child comments due to onDelete: Cascade
    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to delete comment",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

