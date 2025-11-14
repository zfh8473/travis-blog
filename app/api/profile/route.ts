import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAuth } from "@/lib/auth/permissions";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { prisma } from "@/lib/db/prisma";

/**
 * Get current user's profile.
 * 
 * Returns the authenticated user's profile information including
 * id, email, name, image, bio, and role.
 * 
 * @route GET /api/profile
 * @requires Authentication
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/profile', {
 *   headers: { 'Cookie': 'next-auth.session-token=...' }
 * });
 * ```
 */
export async function GET(request: NextRequest) {
  // Get user information from request headers (set by middleware)
  const user = getUserFromHeaders(request.headers);

  // Check if user is authenticated
  const authError = requireAuth(user);
  if (authError) {
    return authError;
  }

  try {
    // Fetch user profile from database
    const profile = await prisma.user.findUnique({
      where: { id: user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "User not found",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch profile",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Update current user's profile.
 * 
 * Updates the authenticated user's profile information.
 * Accepts name, bio, and image (file path) fields.
 * All fields are optional to allow partial updates.
 * 
 * @route PUT /api/profile
 * @requires Authentication
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/profile', {
 *   method: 'PUT',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Cookie': 'next-auth.session-token=...'
 *   },
 *   body: JSON.stringify({
 *     name: "John Doe",
 *     bio: "Software developer"
 *   })
 * });
 * ```
 */
export async function PUT(request: NextRequest) {
  // Get user information from request headers (set by middleware)
  const user = getUserFromHeaders(request.headers);

  // Check if user is authenticated
  const authError = requireAuth(user);
  if (authError) {
    return authError;
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid input data",
            code: "VALIDATION_ERROR",
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { name, bio, image } = validationResult.data;

    // Build update data object (only include fields that are provided)
    const updateData: {
      name?: string | null;
      bio?: string | null;
      image?: string | null;
    } = {};

    if (name !== undefined) {
      updateData.name = name === "" ? null : name;
    }
    if (bio !== undefined) {
      updateData.bio = bio === "" ? null : bio;
    }
    if (image !== undefined) {
      updateData.image = image === "" ? null : image;
    }

    // Update user profile in database
    const updatedProfile = await prisma.user.update({
      where: { id: user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to update profile",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

