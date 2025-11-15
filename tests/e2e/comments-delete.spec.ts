/**
 * E2E tests for comment deletion functionality.
 * 
 * Tests complete user flows including:
 * - Complete delete flow (admin)
 * - Permission check (regular user cannot see delete button)
 * - Cascade delete
 * - Confirmation dialog
 */

import { test, expect } from "@playwright/test";

/**
 * Helper function to login as admin user.
 */
async function loginAsAdmin(page: any) {
  // Navigate to login page
  await page.goto("/api/auth/signin");

  // Fill in admin credentials (adjust based on your test setup)
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "admin123");

  // Submit login form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/(admin|articles)/, { timeout: 5000 });
}

/**
 * Helper function to login as regular user.
 */
async function loginAsRegularUser(page: any) {
  // Navigate to login page
  await page.goto("/api/auth/signin");

  // Fill in regular user credentials
  await page.fill('input[name="email"]', "user@example.com");
  await page.fill('input[name="password"]', "user123");

  // Submit login form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/(admin|articles)/, { timeout: 5000 });
}

test.describe("Comment Deletion E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to an article page with comments
    // Adjust the URL based on your test data
    await page.goto("/articles/test-article-slug");
    await page.waitForSelector('[data-testid="comment-list"]', { timeout: 5000 });
  });

  test("should show delete button for admin users (AC-5.3.1)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/articles/test-article-slug");
    await page.waitForSelector('[data-testid="comment-list"]', { timeout: 5000 });

    // Check if delete button is visible for admin
    const deleteButtons = await page.locator('button:has-text("删除")').all();
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  test("should not show delete button for regular users (AC-5.3.1)", async ({ page }) => {
    await loginAsRegularUser(page);
    await page.goto("/articles/test-article-slug");
    await page.waitForSelector('[data-testid="comment-list"]', { timeout: 5000 });

    // Check if delete button is NOT visible for regular users
    const deleteButtons = await page.locator('button:has-text("删除")');
    await expect(deleteButtons).toHaveCount(0);
  });

  test("should show confirmation dialog when delete button is clicked (AC-5.3.2)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/articles/test-article-slug");
    await page.waitForSelector('[data-testid="comment-list"]', { timeout: 5000 });

    // Set up dialog handler
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("确定要删除这条留言吗");
      await dialog.dismiss(); // Cancel deletion for this test
    });

    // Click delete button
    const deleteButton = page.locator('button:has-text("删除")').first();
    await deleteButton.click();

    // Dialog should have been triggered
    // (The dialog handler above will verify the message)
  });

  test("should delete comment after confirmation (AC-5.3.2)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/articles/test-article-slug");
    await page.waitForSelector('[data-testid="comment-list"]', { timeout: 5000 });

    // Get initial comment count
    const initialComments = await page.locator('[data-testid="comment-item"]').count();

    // Set up dialog handler to confirm deletion
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("确定要删除这条留言吗");
      await dialog.accept();
    });

    // Click delete button
    const deleteButton = page.locator('button:has-text("删除")').first();
    await deleteButton.click();

    // Wait for success alert
    page.on("dialog", async (dialog) => {
      if (dialog.type() === "alert") {
        expect(dialog.message()).toContain("留言删除成功");
        await dialog.accept();
      }
    });

    // Wait for page reload
    await page.waitForLoadState("networkidle");

    // Verify comment count decreased
    const finalComments = await page.locator('[data-testid="comment-item"]').count();
    expect(finalComments).toBeLessThan(initialComments);
  });

  test("should show cascade warning when deleting comment with replies (AC-5.3.3)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/articles/test-article-slug");
    await page.waitForSelector('[data-testid="comment-list"]', { timeout: 5000 });

    // Find a comment with replies (adjust selector based on your implementation)
    const commentWithReplies = page.locator('[data-testid="comment-item"]').first();

    // Set up dialog handler
    page.on("dialog", async (dialog) => {
      const message = dialog.message();
      expect(message).toContain("此留言有");
      expect(message).toContain("条回复");
      expect(message).toContain("删除后所有回复也将被删除");
      await dialog.dismiss(); // Cancel deletion for this test
    });

    // Click delete button on comment with replies
    const deleteButton = commentWithReplies.locator('button:has-text("删除")');
    await deleteButton.click();

    // Dialog should have been triggered with cascade warning
  });

  test("should delete parent comment and all replies (cascade delete) (AC-5.3.3)", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/articles/test-article-slug");
    await page.waitForSelector('[data-testid="comment-list"]', { timeout: 5000 });

    // Find a comment with replies
    const commentWithReplies = page.locator('[data-testid="comment-item"]').first();
    const initialReplyCount = await commentWithReplies.locator('[data-testid="reply-item"]').count();

    // Set up dialog handler to confirm deletion
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    // Click delete button
    const deleteButton = commentWithReplies.locator('button:has-text("删除")');
    await deleteButton.click();

    // Wait for success alert
    page.on("dialog", async (dialog) => {
      if (dialog.type() === "alert") {
        await dialog.accept();
      }
    });

    // Wait for page reload
    await page.waitForLoadState("networkidle");

    // Verify parent comment and all replies are deleted
    // (The comment with replies should no longer exist)
    const commentStillExists = await commentWithReplies.isVisible().catch(() => false);
    expect(commentStillExists).toBe(false);
  });

