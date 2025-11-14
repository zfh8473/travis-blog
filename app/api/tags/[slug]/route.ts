import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Get a tag by slug.
 * 
 * Returns a single tag by its slug.
 * 
 * @route GET /api/tags/[slug]
 * @authentication Optional (public access)
 * 
 * @response 200 Success
 * ```typescript
 * {
 *   success: true,
 *   data: Tag
 * }
 * ```
 * 
 * @response 404 Not Found
 * 
 * @response 500 Internal Server Error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/tags/react');
 * const { data } = await response.json();
 * // data is the Tag object
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Query tag from database by slug
    const tag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (!tag) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Tag not found",
            code: "TAG_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch tag",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

