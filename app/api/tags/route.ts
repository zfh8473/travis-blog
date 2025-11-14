import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { generateSlug } from "@/lib/utils/slug";

/**
 * Get all tags.
 * 
 * Returns a list of all tags in the database.
 * Tags are used for flexible categorization of articles.
 * 
 * @route GET /api/tags
 * @authentication Optional (public access)
 * 
 * @response 200 Success
 * ```typescript
 * {
 *   success: true,
 *   data: Tag[]
 * }
 * ```
 * 
 * @response 500 Internal Server Error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/tags');
 * const { data } = await response.json();
 * // data is an array of Tag objects
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Query all tags from database
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch tags",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Create a new tag.
 * 
 * Creates a new tag with the provided name. The slug is automatically
 * generated from the name. Requires admin authentication.
 * 
 * @route POST /api/tags
 * @authentication Required (admin only)
 * 
 * @body
 * ```typescript
 * {
 *   name: string  // Tag name (required, unique)
 * }
 * ```
 * 
 * @response 201 Created
 * ```typescript
 * {
 *   success: true,
 *   data: Tag
 * }
 * ```
 * 
 * @response 400 Bad Request (validation error, duplicate name)
 * @response 401 Unauthorized
 * @response 403 Forbidden (not admin)
 * @response 500 Internal Server Error
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/tags', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'React' })
 * });
 * const { data } = await response.json();
 * // data is the created Tag object
 * ```
 */
export async function POST(request: NextRequest) {
  // Check authentication and admin role
  const user = getUserFromHeaders(request.headers);
  const adminError = requireAdmin(user);

  if (adminError) {
    return adminError;
  }

  try {
    // Parse request body
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Tag name is required",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check if tag with same name already exists (case-insensitive)
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Tag with this name already exists",
            code: "DUPLICATE_TAG",
          },
        },
        { status: 400 }
      );
    }

    // Generate slug from name
    const baseSlug = generateSlug(trimmedName);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (true) {
      const existingSlug = await prisma.tag.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existingSlug) {
        break;
      }

      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        name: trimmedName,
        slug,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: tag,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to create tag",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

