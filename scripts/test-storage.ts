#!/usr/bin/env tsx

/**
 * Storage layer test script.
 * 
 * This script tests all storage layer functionality:
 * - File upload
 * - File listing
 * - URL generation
 * - File deletion
 * - Error handling
 * 
 * Usage:
 *   npx tsx scripts/test-storage.ts
 */

import { getStorage } from "../lib/storage";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

async function testStorage() {
  console.log("🧪 Testing Storage Abstraction Layer\n");
  console.log("=" .repeat(50));

  const storage = getStorage();
  const storageType = process.env.STORAGE_TYPE || "local";
  console.log(`📦 Storage Type: ${storageType}\n`);

  // Test 1: List existing files
  console.log("Test 1: List existing files");
  try {
    const files = await storage.list();
    console.log(`✅ Success: Found ${files.length} file(s)`);
    if (files.length > 0) {
      console.log(`   Sample files:`);
      files.slice(0, 3).forEach((file) => {
        console.log(`   - ${file.path} (${file.size} bytes, ${file.mimeType})`);
      });
    }
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  console.log();

  // Test 2: Upload a test file
  console.log("Test 2: Upload test file");
  let uploadedFilePath: string | null = null;
  try {
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testFile = new File([testContent], "test-storage.txt", {
      type: "text/plain",
    });
    uploadedFilePath = await storage.upload(testFile);
    console.log(`✅ Success: File uploaded to ${uploadedFilePath}`);
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  console.log();

  if (!uploadedFilePath) {
    console.log("⚠️  Skipping remaining tests (upload failed)");
    return;
  }

  // Test 3: Get URL
  console.log("Test 3: Get file URL");
  try {
    const url = await storage.getUrl(uploadedFilePath);
    console.log(`✅ Success: URL is ${url}`);
    if (!url.startsWith("/uploads/")) {
      console.log(`   ⚠️  Warning: URL format may be incorrect (expected /uploads/...)`);
    }
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  console.log();

  // Test 4: List files after upload
  console.log("Test 4: List files after upload");
  try {
    const filesAfterUpload = await storage.list();
    const uploadedFile = filesAfterUpload.find((f) => f.path === uploadedFilePath!);
    if (uploadedFile) {
      console.log(`✅ Success: Uploaded file found in list`);
      console.log(`   - Path: ${uploadedFile.path}`);
      console.log(`   - Name: ${uploadedFile.name}`);
      console.log(`   - Size: ${uploadedFile.size} bytes`);
      console.log(`   - MIME Type: ${uploadedFile.mimeType}`);
      console.log(`   - Created: ${uploadedFile.createdAt.toISOString()}`);
    } else {
      console.log(`❌ Failed: Uploaded file not found in list`);
    }
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  console.log();

  // Test 5: Delete file
  console.log("Test 5: Delete file");
  try {
    await storage.delete(uploadedFilePath);
    console.log(`✅ Success: File deleted`);
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  console.log();

  // Test 6: Verify deletion
  console.log("Test 6: Verify file deletion");
  try {
    const filesAfterDelete = await storage.list();
    const fileStillExists = filesAfterDelete.some((f) => f.path === uploadedFilePath!);
    if (!fileStillExists) {
      console.log(`✅ Success: File no longer exists in list`);
    } else {
      console.log(`❌ Failed: File still exists after deletion`);
    }
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  console.log();

  // Test 7: Test idempotent delete (delete non-existent file)
  console.log("Test 7: Test idempotent delete (delete non-existent file)");
  try {
    await storage.delete("uploads/non-existent-file.txt");
    console.log(`✅ Success: Delete operation is idempotent (no error for non-existent file)`);
  } catch (error) {
    console.log(`❌ Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    console.log(`   ⚠️  Delete should be idempotent (no error if file doesn't exist)`);
  }
  console.log();

  // Test 8: Test error handling (get URL for non-existent file)
  console.log("Test 8: Test error handling (get URL for non-existent file)");
  try {
    await storage.getUrl("uploads/non-existent-file.txt");
    console.log(`❌ Failed: Should throw error for non-existent file`);
  } catch (error) {
    console.log(`✅ Success: Error thrown for non-existent file`);
    console.log(`   Error message: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  console.log();

  console.log("=" .repeat(50));
  console.log("✅ Storage layer tests completed!");
}

// Run tests
testStorage().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});

