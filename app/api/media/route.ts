import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { getStorage } from "@/lib/storage";

/**
 * Get media file list with pagination.
 * 
 * Returns a paginated list of all uploaded media files with their metadata.
 * Only accessible to ADMIN users.
 * 
 * @route GET /api/media
 * @requires Authentication (ADMIN role)
 * 
 * @queryParams
 * - page?: number - Page number (default: 1)
 * - limit?: number - Items per page (default: 20, max: 50)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/media?page=1&limit=20', {
 *   headers: { 'Cookie': 'next-auth.session-token=...' }
 * });
 * ```
 */
export async function GET(request: NextRequest) {
  // Get user information from request headers (set by middleware)
  const user = getUserFromHeaders(request.headers);

  // Check if user is authenticated and has ADMIN role
  const adminError = requireAdmin(user);
  if (adminError) {
    return adminError;
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Get storage instance
    const storage = getStorage();

    // List all files
    const allFiles = await storage.list();

    // Sort by creation date (newest first)
    const sortedFiles = allFiles.sort((a, b) => {
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Calculate pagination
    const total = sortedFiles.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = sortedFiles.slice(startIndex, endIndex);

    // Get URLs for all files
    const filesWithUrls = await Promise.all(
      paginatedFiles.map(async (file) => {
        const url = await storage.getUrl(file.path);
        return {
          ...file,
          url,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        files: filesWithUrls,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching media files:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch media files",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

