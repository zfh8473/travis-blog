import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequestOrHeaders } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/auth/permissions";
import { getStorage } from "@/lib/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Maximum allowed file size in bytes (5MB).
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Allowed image MIME types.
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Allowed image file extensions.
 */
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

/**
 * Upload image file for Tiptap editor.
 * 
 * Handles image uploads from Tiptap editor via drag-and-drop or paste.
 * Validates file type and size, uploads to storage abstraction layer,
 * and returns image URL for insertion into editor.
 * 
 * @route POST /api/upload
 * @requires Authentication (ADMIN role)
 * 
 * @requestBody multipart/form-data
 * - file: File - Image file to upload (jpg, png, gif, webp, max 5MB)
 * 
 * @response 200 Success
 * ```typescript
 * {
 *   success: true,
 *   data: {
 *     url: string,  // Image URL path (e.g., "/uploads/filename.jpg")
 *     path: string  // Storage path (e.g., "uploads/filename.jpg")
 *   }
 * }
 * ```
 * 
 * @response 400 Bad Request - Invalid file type or size
 * @response 401 Unauthorized - Not authenticated
 * @response 403 Forbidden - Not admin
 * @response 413 Payload Too Large - File too large
 * @response 500 Internal Server Error - Upload failed
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', imageFile);
 * 
 * const response = await fetch('/api/upload', {
 *   method: 'POST',
 *   body: formData,
 *   headers: { 'Cookie': 'next-auth.session-token=...' }
 * });
 * 
 * const { data } = await response.json();
 * // data.url can be inserted into Tiptap editor
 * ```
 */
export async function POST(request: NextRequest) {
  // Debug: Log request details
  if (process.env.VERCEL_ENV || process.env.NODE_ENV === "development") {
    const cookies = request.cookies.getAll();
    console.log("[POST /api/upload] Cookie count:", cookies.length);
    console.log("[POST /api/upload] Cookie names:", cookies.map(c => c.name).join(", "));
    console.log("[POST /api/upload] Headers x-user-id:", request.headers.get("x-user-id"));
    console.log("[POST /api/upload] Headers x-user-role:", request.headers.get("x-user-role"));
  }

  // Try multiple methods to get user information
  // 1. First try getUserFromRequestOrHeaders (handles headers and token reading)
  let user = await getUserFromRequestOrHeaders(request, request.headers);
  
  if (process.env.VERCEL_ENV || process.env.NODE_ENV === "development") {
    console.log("[POST /api/upload] User from getUserFromRequestOrHeaders:", !!user);
    if (user) {
      console.log("[POST /api/upload] User role:", user.role);
    }
  }
  
  // 2. If that fails, try getServerSession as fallback
  // Note: getServerSession may work better in some Vercel environments
  if (!user) {
    try {
      const session = await getServerSession(authOptions);
      if (process.env.VERCEL_ENV || process.env.NODE_ENV === "development") {
        console.log("[POST /api/upload] Session from getServerSession:", !!session);
      }
      if (session?.user) {
        user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        };
      }
    } catch (error) {
      console.error("Error getting session in POST /api/upload:", error);
    }
  }

  // Check if user is authenticated and has ADMIN role
  const adminError = requireAdmin(user);
  if (adminError) {
    if (process.env.VERCEL_ENV || process.env.NODE_ENV === "development") {
      console.log("[POST /api/upload] Admin check failed, returning error");
    }
    return adminError;
  }

  try {
    // Parse multipart/form-data request
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "No file provided",
            code: "MISSING_FILE",
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type;
    const fileName = file.name;
    const fileExtension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf("."));

    if (
      !ALLOWED_MIME_TYPES.includes(fileType) ||
      !ALLOWED_EXTENSIONS.includes(fileExtension)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Invalid file type. Allowed types: jpg, jpeg, png, gif, webp",
            code: "INVALID_FILE_TYPE",
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
            message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            code: "FILE_TOO_LARGE",
          },
        },
        { status: 413 }
      );
    }

    // Upload file using storage abstraction layer
    const storage = getStorage();
    const filePath = await storage.upload(file);

    // Get file URL
    const fileUrl = await storage.getUrl(filePath);

    return NextResponse.json(
      {
        success: true,
        data: {
          url: fileUrl,
          path: filePath,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading file:", error);

    // Handle storage errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Failed to upload file",
            code: "UPLOAD_FAILED",
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to upload file",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

