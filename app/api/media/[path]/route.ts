import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { getStorage } from "@/lib/storage";
import { checkFileUsage } from "@/lib/utils/media";

/**
 * Delete a media file.
 * 
 * Deletes a media file from storage. Before deletion, checks if the file
 * is used in any article. If the file is in use, returns a warning response.
 * 
 * @route DELETE /api/media/[path]
 * @requires Authentication (ADMIN role)
 * 
 * @pathParams
 * - path: string - URL-encoded file path (e.g., "uploads%2Ffilename.jpg")
 * 
 * @queryParams
 * - force?: boolean - Force delete even if file is in use (default: false)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/media/uploads%2Fimage.jpg', {
 *   method: 'DELETE',
 *   headers: { 'Cookie': 'next-auth.session-token=...' }
 * });
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  // Get user information from request headers (set by middleware)
  const user = getUserFromHeaders(request.headers);

  // Check if user is authenticated and has ADMIN role
  const adminError = requireAdmin(user);
  if (adminError) {
    return adminError;
  }

  try {
    // Extract and decode file path from route parameter
    const { path: encodedPath } = await params;
    const filePath = decodeURIComponent(encodedPath);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    // Check if file is used in any article (unless force delete)
    if (!force) {
      const articlesUsingFile = await checkFileUsage(filePath);

      if (articlesUsingFile.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "File is in use",
              code: "FILE_IN_USE",
              inUse: true,
              articleIds: articlesUsingFile,
            },
          },
          { status: 400 }
        );
      }
    }

    // Get storage instance
    const storage = getStorage();

    // Delete file from storage
    await storage.delete(filePath);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting media file:", error);

    // Check if error is "file not found"
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "File not found",
            code: "FILE_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to delete file",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

