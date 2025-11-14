import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAuth } from "@/lib/auth/permissions";
import { getStorage } from "@/lib/storage";
import { prisma } from "@/lib/db/prisma";

/**
 * Maximum file size for avatar upload (5MB).
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Allowed image MIME types for avatar upload.
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Upload avatar file for current user.
 * 
 * Accepts multipart/form-data with file field.
 * Validates file type (images only) and size (max 5MB).
 * Uploads file using storage abstraction layer.
 * Updates user's image field in database.
 * Deletes old avatar file if exists (cleanup).
 * 
 * @route POST /api/profile/avatar
 * @requires Authentication
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', fileObject);
 * 
 * const response = await fetch('/api/profile/avatar', {
 *   method: 'POST',
 *   headers: { 'Cookie': 'next-auth.session-token=...' },
 *   body: formData
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  // Get user information from request headers (set by middleware)
  const user = getUserFromHeaders(request.headers);

  // Check if user is authenticated
  const authError = requireAuth(user);
  if (authError) {
    return authError;
  }

  try {
    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "File is required",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid file type. Only images (jpg, jpeg, png, gif, webp) are allowed",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "File too large. Maximum size is 5MB",
            code: "PAYLOAD_TOO_LARGE",
          },
        },
        { status: 413 }
      );
    }

    // Get storage instance
    const storage = getStorage();

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { image: true },
    });

    // Upload new avatar file
    const filePath = await storage.upload(file);

    // Get file URL
    const fileUrl = await storage.getUrl(filePath);

    // Update user's image field in database
    const updatedProfile = await prisma.user.update({
      where: { id: user!.id },
      data: { image: filePath },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        bio: true,
        role: true,
      },
    });

    // Delete old avatar file if exists (cleanup)
    if (currentUser?.image && currentUser.image !== filePath) {
      try {
        await storage.delete(currentUser.image);
      } catch (error) {
        // Log error but don't fail the request if old file deletion fails
        console.warn("Failed to delete old avatar file:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        path: filePath,
        url: fileUrl,
        profile: updatedProfile,
      },
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to upload avatar",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

