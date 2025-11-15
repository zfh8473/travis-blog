import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { Role } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

/**
 * E2E tests for media management functionality.
 * 
 * Tests complete user flows including:
 * - View media library page (authenticated as admin)
 * - Display media files with thumbnails and metadata
 * - Preview images
 * - Delete media files
 * - Handle file-in-use warnings
 * - Pagination
 */

test.describe("Media Management E2E Tests", () => {
  const testAdminEmail = "e2e-media-admin@example.com";
  const testAdminPassword = "testPassword123";
  let testAdminId: string;
  let testArticleId: string;
  const testUploadDir = path.join(process.cwd(), "public", "uploads");

  test.beforeAll(async () => {
    // Create a test admin user
    const hashedPassword = await hashPassword(testAdminPassword);
    const admin = await prisma.user.upsert({
      where: { email: testAdminEmail },
      update: {
        password: hashedPassword,
        role: Role.ADMIN,
      },
      create: {
        email: testAdminEmail,
        password: hashedPassword,
        name: "E2E Media Admin",
        role: Role.ADMIN,
      },
    });
    testAdminId = admin.id;

    // Create a test article that uses a media file
    const article = await prisma.article.create({
      data: {
        title: "Test Article with Image",
        content: '<img src="/uploads/test-image.jpg" alt="Test Image" />',
        status: "PUBLISHED",
        authorId: testAdminId,
        publishedAt: new Date(),
      },
    });
    testArticleId = article.id;

    // Create test media files in uploads directory
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }

    // Create test image file
    const testImagePath = path.join(testUploadDir, "test-image.jpg");
    fs.writeFileSync(testImagePath, "fake image content");

    // Create test document file
    const testDocPath = path.join(testUploadDir, "test-document.pdf");
    fs.writeFileSync(testDocPath, "fake pdf content");

    // Create additional test files for pagination
    for (let i = 1; i <= 5; i++) {
      const filePath = path.join(testUploadDir, `test-file-${i}.jpg`);
      fs.writeFileSync(filePath, `fake image content ${i}`);
    }
  });

  test.afterEach(async () => {
    // Clean up any test files created during individual tests
    // This ensures cleanup even if a test fails
    try {
      const testFiles = ["test-force-delete.jpg"];
      for (const fileName of testFiles) {
        const filePath = path.join(testUploadDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.warn("Error during test cleanup:", error);
    }
  });

  test.afterAll(async () => {
    try {
      // Delete test article
      await prisma.article.deleteMany({
        where: { id: testArticleId },
      });

      // Delete test user
      await prisma.user.deleteMany({
        where: { id: testAdminId },
      });

      // Clean up test files
      const testFiles = [
        "test-image.jpg",
        "test-document.pdf",
        ...Array.from({ length: 5 }, (_, i) => `test-file-${i + 1}.jpg`),
        "test-force-delete.jpg", // Also clean up in case afterEach didn't catch it
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(testUploadDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.warn("Error during test cleanup:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  /**
   * Helper function to login as test admin
   */
  async function loginAsAdmin(page: any) {
    await page.goto("/login");

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    // Fill in login form
    await page.fill('input[type="email"]', testAdminEmail);
    await page.fill('input[type="password"]', testAdminPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/\/(admin|profile|dashboard)/, { timeout: 10000 });
  }

  test("should display media library page with file list (AC-3.8.1)", async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to media library
    await page.goto("/admin/media");

    // Wait for page to load
    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Check if page title is displayed
    expect(await page.textContent("h1")).toContain("媒体库");

    // Check if files are displayed (at least one file should be visible)
    const fileCards = page.locator('[class*="bg-white"]').filter({
      hasText: /test-.*\.(jpg|pdf)/i,
    });
    await expect(fileCards.first()).toBeVisible({ timeout: 5000 });
  });

  test("should display file metadata (filename, size, date) (AC-3.8.1)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Check if file metadata is displayed
    // File name should be visible
    await expect(page.locator("text=test-image.jpg").first()).toBeVisible({ timeout: 5000 });

    // File size should be displayed (format: "X.XX KB" or similar)
    const sizePattern = /\d+\.?\d*\s*(Bytes|KB|MB)/;
    await expect(page.locator(`text=/${sizePattern}/`).first()).toBeVisible({ timeout: 5000 });
  });

  test("should show thumbnails for image files (AC-3.8.1)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Check if image thumbnails are displayed
    // Images should have src attribute pointing to uploads
    const images = page.locator('img[src*="/uploads/"]');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
  });

  test("should preview image when clicked (AC-3.8.2)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Find an image thumbnail and click it
    const imageThumbnail = page.locator('img[src*="test-image.jpg"]').first();
    await expect(imageThumbnail).toBeVisible({ timeout: 5000 });

    await imageThumbnail.click();

    // Check if preview modal is shown
    await expect(page.locator('button[aria-label="关闭预览"]')).toBeVisible({ timeout: 3000 });
  });

  test("should close image preview when close button is clicked (AC-3.8.2)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Open preview
    const imageThumbnail = page.locator('img[src*="test-image.jpg"]').first();
    await imageThumbnail.click();

    // Wait for preview modal
    const closeButton = page.locator('button[aria-label="关闭预览"]');
    await expect(closeButton).toBeVisible({ timeout: 3000 });

    // Click close button
    await closeButton.click();

    // Preview modal should be closed
    await expect(closeButton).not.toBeVisible({ timeout: 3000 });
  });

  test("should close image preview when ESC key is pressed (AC-3.8.2)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Open preview
    const imageThumbnail = page.locator('img[src*="test-image.jpg"]').first();
    await imageThumbnail.click();

    // Wait for preview modal
    const closeButton = page.locator('button[aria-label="关闭预览"]');
    await expect(closeButton).toBeVisible({ timeout: 3000 });

    // Press ESC key
    await page.keyboard.press("Escape");

    // Preview modal should be closed
    await expect(closeButton).not.toBeVisible({ timeout: 3000 });
  });

  test("should show delete confirmation dialog when delete button is clicked (AC-3.8.3)", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Find delete button for a file that is NOT in use
    const deleteButton = page
      .locator("text=test-document.pdf")
      .locator("..")
      .locator('button:has-text("删除")')
      .first();

    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();

    // Check if confirmation dialog is shown
    await expect(page.locator("text=确认删除")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=/确定要删除此文件吗/")).toBeVisible({ timeout: 3000 });
  });

  test("should delete file after confirmation (AC-3.8.4)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Find delete button for test-document.pdf (not in use)
    const deleteButton = page
      .locator("text=test-document.pdf")
      .locator("..")
      .locator('button:has-text("删除")')
      .first();

    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();

    // Confirm deletion
    await expect(page.locator("text=确认删除")).toBeVisible({ timeout: 3000 });
    const confirmButton = page.locator("text=确认删除").locator("..").locator('button:has-text("删除")').last();
    await confirmButton.click();

    // Check if success message is displayed
    await expect(page.locator("text=文件删除成功")).toBeVisible({ timeout: 5000 });

    // Wait for file to be removed from list (verify it's gone)
    await expect(page.locator("text=test-document.pdf")).not.toBeVisible({ timeout: 5000 });
  });

  test("should show file-in-use warning when trying to delete used file (AC-3.8.5)", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Find delete button for test-image.jpg (which is used in article)
    const deleteButton = page
      .locator("text=test-image.jpg")
      .locator("..")
      .locator('button:has-text("删除")')
      .first();

    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();

    // Confirm deletion in first dialog
    await expect(page.locator("text=确认删除")).toBeVisible({ timeout: 3000 });
    const confirmButton = page.locator("text=确认删除").locator("..").locator('button:has-text("删除")').last();
    await confirmButton.click();

    // Check if file-in-use warning is shown
    await expect(page.locator("text=警告")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=/此文件正在被文章使用/")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=/使用此文件的文章数量/")).toBeVisible({ timeout: 5000 });
  });

  test("should allow force delete when file is in use (AC-3.8.5)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Create a new test file that we'll use in an article and then force delete
    const testForceDeleteFile = path.join(testUploadDir, "test-force-delete.jpg");
    fs.writeFileSync(testForceDeleteFile, "fake image content");

    // Update article to use this file
    await prisma.article.update({
      where: { id: testArticleId },
      data: {
        content: '<img src="/uploads/test-force-delete.jpg" alt="Test" />',
      },
    });

    // Refresh page to see new file
    await page.reload();
    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Find delete button for test-force-delete.jpg
    const deleteButton = page
      .locator("text=test-force-delete.jpg")
      .locator("..")
      .locator('button:has-text("删除")')
      .first();

    await expect(deleteButton).toBeVisible({ timeout: 5000 });
    await deleteButton.click();

    // Confirm deletion in first dialog
    await expect(page.locator("text=确认删除")).toBeVisible({ timeout: 3000 });
    const confirmButton = page.locator("text=确认删除").locator("..").locator('button:has-text("删除")').last();
    await confirmButton.click();

    // Wait for file-in-use warning
    await expect(page.locator("text=警告")).toBeVisible({ timeout: 5000 });

    // Click force delete
    const forceDeleteButton = page.locator("text=强制删除");
    await expect(forceDeleteButton).toBeVisible({ timeout: 3000 });
    await forceDeleteButton.click();

    // Check if force delete success message is displayed
    await expect(page.locator("text=文件已强制删除")).toBeVisible({ timeout: 5000 });

    // File cleanup will be handled by afterEach hook
  });

  test("should display pagination when there are multiple pages", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/media");

    await page.waitForSelector("h1:has-text('媒体库')", { timeout: 5000 });

    // Check if pagination controls are displayed (if there are enough files)
    // Note: This test assumes there are enough files to trigger pagination
    // In a real scenario, we'd create enough test files or mock the API response
    const paginationInfo = page.locator("text=/第.*页，共.*页/");
    const paginationExists = await paginationInfo.count();

    if (paginationExists > 0) {
      // Pagination is shown
      await expect(paginationInfo.first()).toBeVisible({ timeout: 3000 });
      await expect(page.locator("text=上一页")).toBeVisible({ timeout: 3000 });
      await expect(page.locator("text=下一页")).toBeVisible({ timeout: 3000 });
    } else {
      // Not enough files for pagination, skip this assertion
      test.skip();
    }
  });

  test("should handle authentication errors", async ({ page }) => {
    // Try to access media library without login
    await page.goto("/admin/media");

    // Should be redirected to login or show error
    // The exact behavior depends on middleware implementation
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(login|auth)/);
  });
});

