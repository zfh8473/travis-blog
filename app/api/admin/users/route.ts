import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

/**
 * Admin API route to get all users.
 * 
 * Requires ADMIN role to access.
 * Returns list of all users in the system.
 * 
 * @route GET /api/admin/users
 * @requires ADMIN role
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/users', {
 *   headers: { 'Cookie': 'next-auth.session-token=...' }
 * });
 * ```
 */
export async function GET(request: NextRequest) {
  // Get user information from request headers (set by middleware)
  const user = getUserFromHeaders(request.headers);

  // Check if user is admin
  const adminError = requireAdmin(user);
  if (adminError) {
    return adminError;
  }

  try {
    // Fetch all users (excluding passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch users",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

