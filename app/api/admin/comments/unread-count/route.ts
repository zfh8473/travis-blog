import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/admin/comments/unread-count
 * 
 * Returns the count of unread comments for admin users.
 * Only accessible by users with ADMIN role.
 * 
 * @returns { success: true, data: { unreadCount: number } }
 */
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
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

    if (session.user.role !== Role.ADMIN) {
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

    // Count unread comments
    const unreadCount = await prisma.comment.count({
      where: {
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/comments/unread-count] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch unread comment count",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

