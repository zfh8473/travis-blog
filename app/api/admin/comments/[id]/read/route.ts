import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { getUserFromRequestOrHeaders } from "@/lib/auth/middleware";

/**
 * PUT /api/admin/comments/[id]/read
 * 
 * Marks a comment as read by the current admin user.
 * Only accessible by users with ADMIN role.
 * 
 * @param id - Comment ID from URL parameter
 * @returns { success: true, data: { id: string, isRead: boolean, readAt: string, readBy: string } }
 */
export const runtime = "nodejs";
export const maxDuration = 30;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Validate comment ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid comment ID",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, isRead: true },
    });

    if (!existingComment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Comment not found",
            code: "NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // If already read, return success without updating
    if (existingComment.isRead) {
      return NextResponse.json({
        success: true,
        data: {
          id: existingComment.id,
          isRead: true,
          readAt: null, // Already read, but we don't have readAt in this query
          readBy: null, // Already read, but we don't have readBy in this query
        },
      });
    }

    // Mark comment as read
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
        readBy: user.id,
      },
      select: {
        id: true,
        isRead: true,
        readAt: true,
        readBy: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedComment.id,
        isRead: updatedComment.isRead,
        readAt: updatedComment.readAt?.toISOString() || null,
        readBy: updatedComment.readBy || null,
      },
    });
  } catch (error) {
    console.error("[PUT /api/admin/comments/[id]/read] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to mark comment as read",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

