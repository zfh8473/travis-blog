import { getStorage } from "@/lib/storage";
import { NextResponse } from "next/server";

/**
 * Test storage layer API endpoint.
 * 
 * This endpoint tests all storage layer functionality:
 * - File upload
 * - File listing
 * - URL generation
 * - File deletion
 * - Error handling
 * 
 * @route GET /api/test-storage
 * @route POST /api/test-storage
 * @returns {Promise<NextResponse>} Response with storage test results
 */
export async function GET() {
  try {
    const storage = getStorage();

    // Test 1: List existing files
    const files = await storage.list();
    const fileCount = files.length;

    // Test 2: Get storage type from environment
    const storageType = process.env.STORAGE_TYPE || "local";

    return NextResponse.json(
      {
        success: true,
        message: "Storage layer is working correctly!",
        data: {
          storageType,
          fileCount,
          files: files.slice(0, 10), // Return first 10 files as sample
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || "unknown",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Storage layer test error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown storage error",
          code: "STORAGE_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for testing file upload and deletion.
 * 
 * @route POST /api/test-storage
 * @param request - Request with form data containing a test file
 * @returns {Promise<NextResponse>} Response with upload test results
 */
export async function POST(request: Request) {
  try {
    const storage = getStorage();
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

    // Test 1: Upload file
    const uploadStartTime = Date.now();
    const filePath = await storage.upload(file);
    const uploadTime = Date.now() - uploadStartTime;

    // Test 2: Get URL
    const url = await storage.getUrl(filePath);

    // Test 3: List files (should include the new file)
    const filesAfterUpload = await storage.list();
    const uploadedFile = filesAfterUpload.find((f) => f.path === filePath);

    // Test 4: Delete file
    const deleteStartTime = Date.now();
    await storage.delete(filePath);
    const deleteTime = Date.now() - deleteStartTime;

    // Test 5: Verify deletion (file should not exist)
    const filesAfterDelete = await storage.list();
    const fileStillExists = filesAfterDelete.some((f) => f.path === filePath);

    return NextResponse.json(
      {
        success: true,
        message: "All storage operations completed successfully!",
        data: {
          upload: {
            filePath,
            url,
            timeMs: uploadTime,
            success: true,
          },
          fileMetadata: uploadedFile || null,
          delete: {
            filePath,
            timeMs: deleteTime,
            success: true,
            fileStillExists: fileStillExists,
          },
          verification: {
            fileExistsAfterDelete: fileStillExists,
            deletionVerified: !fileStillExists,
          },
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Storage test error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown storage error",
          code: "STORAGE_TEST_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
