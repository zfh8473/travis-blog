import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeaders } from "@/lib/auth/middleware";

/**
 * Protected API route example.
 * 
 * Demonstrates how to access user information from middleware
 * in API route handlers.
 * 
 * @see middleware.ts - User information is attached to request headers
 */
export async function GET(request: NextRequest) {
  // Get user information from request headers (set by middleware)
  const user = getUserFromHeaders(request.headers);

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

  // User is authenticated - return user information
  return NextResponse.json({
    success: true,
    data: {
      message: "This is a protected route",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
  });
}

