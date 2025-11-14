import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Get all categories.
 * 
 * Returns a list of all categories in the database.
 * Categories are used to organize articles.
 * 
 * @route GET /api/categories
 * @authentication Optional (public access)
 * 
 * @response 200 Success
 * ```typescript
 * {
 *   success: true,
 *   data: Category[]
 * }
 * ```
 * 
 * @response 500 Internal Server Error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/categories');
 * const { data } = await response.json();
 * // data is an array of Category objects
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Query all categories from database
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch categories",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

