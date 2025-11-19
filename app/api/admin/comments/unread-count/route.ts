import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { getUserFromRequestOrHeaders } from "@/lib/auth/middleware";

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

    // Count unread comments
    // Exclude comments made by the admin user themselves
    // Include guest comments (userId = null) and comments from other users
    const unreadCount = await prisma.comment.count({
      where: {
        isRead: false,
        OR: [
          { userId: null }, // Guest comments
          { userId: { not: user.id } }, // Comments from other users (not admin)
        ],
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

