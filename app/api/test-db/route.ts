import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

/**
 * Test database connection API endpoint.
 * 
 * This endpoint is used to verify that the production database connection
 * is working correctly. It performs a simple query to test connectivity.
 * 
 * @route GET /api/test-db
 * @returns {Promise<NextResponse>} Response with database connection status
 * 
 * @example
 * ```typescript
 * // Test database connection
 * const response = await fetch('/api/test-db');
 * const data = await response.json();
 * ```
 */
export async function GET() {
  try {
    // Test database connection with a simple query
    const userCount = await prisma.user.count();
    const articleCount = await prisma.article.count();

    return NextResponse.json(
      {
        success: true,
        message: "Database connection successful!",
        data: {
          userCount,
          articleCount,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || "unknown",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown database error",
          code: "DATABASE_CONNECTION_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

