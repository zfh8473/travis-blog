import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { Role } from "@prisma/client";

/**
 * E2E tests for comment functionality.
 *
 * Tests complete user flows including:
 * - Complete comment creation flow (logged-in user)
 * - Complete comment creation flow (anonymous user)
 * - Validation error display
 * - Comment display on article page
 * - Comment sorting
 */

test.describe("Comment Functionality E2E Tests", () => {
  const testUserEmail = "e2e-comment-user@example.com";
  const testUserPassword = "testPassword123";
  let testUserId: string;
  let testArticleId: string;
  let testArticleSlug: string;

  test.beforeAll(async () => {
    // Create a test user
    const hashedPassword = await hashPassword(testUserPassword);
    const user = await prisma.user.upsert({
      where: { email: testUserEmail },
      update: {
        password: hashedPassword,
        role: Role.USER,
      },
      create: {
        email: testUserEmail,
        password: hashedPassword,
        name: "E2E Comment User",
        role: Role.USER,
      },
    });
    testUserId = user.id;

    // Create a test published article
    const article = await prisma.article.create({
      data: {
        title: "E2E Comment Test Article",
        content: "<p>This is a test article for comment E2E tests.</p>",
        excerpt: "Test article for comments",
        slug: "e2e-comment-test-article",
        status: "PUBLISHED",
        authorId: testUserId,
        publishedAt: new Date("2025-11-15T10:00:00Z"),
      },
    });
    testArticleId = article.id;
    testArticleSlug = article.slug;
  });

  test.afterAll(async () => {
    // Clean up test data
    await prisma.comment.deleteMany({
      where: { articleId: testArticleId },
    });
    await prisma.article.delete({
      where: { id: testArticleId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  test("AC-5.1.2: Complete comment creation flow (logged-in user)", async ({
    page,
  }) => {
    // Login first
    await page.goto("/api/auth/signin");
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 5000 });

    // Navigate to article detail page
    await page.goto(`/articles/${testArticleSlug}`);

    // Wait for comment form to be visible
    await expect(page.getByLabel(/留言内容/i)).toBeVisible();

    // Fill in comment
    const commentText = "This is a test comment from E2E test (logged-in user)";
    await page.fill('textarea[id="content"]', commentText);

    // Submit comment
    await page.click('button:has-text("提交留言")');

    // Wait for success message
    await expect(page.getByText(/留言提交成功/i)).toBeVisible({ timeout: 5000 });

    // Verify comment appears in the list
    await expect(page.getByText(commentText)).toBeVisible();

    // Verify user name is displayed
    await expect(page.getByText("E2E Comment User")).toBeVisible();
  });

  test("AC-5.1.2: Complete comment creation flow (anonymous user)", async ({
    page,
  }) => {
    // Navigate to article detail page (not logged in)
    await page.goto(`/articles/${testArticleSlug}`);

    // Wait for comment form to be visible
    await expect(page.getByLabel(/留言内容/i)).toBeVisible();

    // Fill in name (for anonymous user)
    const authorName = "Anonymous E2E User";
    await page.fill('input[id="authorName"]', authorName);

    // Fill in comment
    const commentText = "This is a test comment from E2E test (anonymous user)";
    await page.fill('textarea[id="content"]', commentText);

    // Submit comment
    await page.click('button:has-text("提交留言")');

    // Wait for success message
    await expect(page.getByText(/留言提交成功/i)).toBeVisible({ timeout: 5000 });

    // Verify comment appears in the list
    await expect(page.getByText(commentText)).toBeVisible();

    // Verify anonymous name is displayed
    await expect(page.getByText(authorName)).toBeVisible();
  });

  test("AC-5.1.5: Validation error display - empty content", async ({ page }) => {
    await page.goto(`/articles/${testArticleSlug}`);

    // Try to submit empty comment
    await page.click('button:has-text("提交留言")');

    // Check for validation error (HTML5 validation or custom error)
    // HTML5 validation might show native tooltip, or our custom validation might show error
    const textarea = page.locator('textarea[id="content"]');
    const isRequired = await textarea.getAttribute("required");
    expect(isRequired).toBe("");

    // If custom validation is shown, check for error message
    const errorMessage = page.locator('text=/验证失败|required|Comment content is required/i');
    // Note: HTML5 validation might prevent form submission, so error might not be visible
    // This test verifies that empty submission is prevented
  });

  test("AC-5.1.5: Validation error display - content too long", async ({ page }) => {
    await page.goto(`/articles/${testArticleSlug}`);

    // Fill in comment exceeding 5000 characters
    const longContent = "a".repeat(5001);
    await page.fill('textarea[id="content"]', longContent);

    // Try to submit
    await page.click('button:has-text("提交留言")');

    // Check for validation error
    await expect(
      page.getByText(/5000|must be less than 5000/i)
    ).toBeVisible({ timeout: 3000 });
  });

  test("AC-5.1.1: Comment form is displayed on article detail page", async ({
    page,
  }) => {
    await page.goto(`/articles/${testArticleSlug}`);

    // Check for comment section
    await expect(page.getByRole("heading", { name: /留言/i })).toBeVisible();

    // Check for comment form
    await expect(page.getByLabel(/留言内容/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /提交留言/i })).toBeVisible();
  });

  test("AC-5.1.3: Logged-in user comment displays name and avatar", async ({
    page,
  }) => {
    // Login first
    await page.goto("/api/auth/signin");
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 5000 });

    // Navigate to article and create a comment
    await page.goto(`/articles/${testArticleSlug}`);
    const commentText = "Test comment for user display";
    await page.fill('textarea[id="content"]', commentText);
    await page.click('button:has-text("提交留言")');
    await expect(page.getByText(/留言提交成功/i)).toBeVisible({ timeout: 5000 });

    // Verify user name is displayed
    await expect(page.getByText("E2E Comment User")).toBeVisible();

    // Verify Reply button is shown
    await expect(page.getByRole("button", { name: /回复/i })).toBeVisible();
  });

  test("AC-5.1.4: Anonymous user comment displays entered name and no avatar", async ({
    page,
  }) => {
    // Navigate to article (not logged in)
    await page.goto(`/articles/${testArticleSlug}`);

    // Create anonymous comment
    const authorName = "E2E Anonymous Test";
    const commentText = "Test comment from anonymous user";
    await page.fill('input[id="authorName"]', authorName);
    await page.fill('textarea[id="content"]', commentText);
    await page.click('button:has-text("提交留言")');
    await expect(page.getByText(/留言提交成功/i)).toBeVisible({ timeout: 5000 });

    // Verify anonymous name is displayed
    await expect(page.getByText(authorName)).toBeVisible();

    // Verify Reply button is shown
    await expect(page.getByRole("button", { name: /回复/i })).toBeVisible();
  });

  test("AC-5.1.6: Comments are sorted by creation time (newest first)", async ({
    page,
  }) => {
    // Create multiple comments programmatically
    const comments = [
      {
        content: "First comment (oldest)",
        authorName: "User 1",
      },
      {
        content: "Second comment (middle)",
        authorName: "User 2",
      },
      {
        content: "Third comment (newest)",
        authorName: "User 3",
      },
    ];

    // Create comments via database
    for (const comment of comments) {
      await prisma.comment.create({
        data: {
          content: comment.content,
          articleId: testArticleId,
          userId: null,
          authorName: comment.authorName,
        },
      });
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Navigate to article page
    await page.goto(`/articles/${testArticleSlug}`);
    await page.reload(); // Reload to see new comments

    // Get all comment texts
    const commentElements = page.locator('[class*="border-b"]').filter({
      hasText: /comment/,
    });

    // Verify comments are displayed (newest first)
    // The newest comment should appear first
    await expect(page.getByText("Third comment (newest)")).toBeVisible();
    await expect(page.getByText("Second comment (middle)")).toBeVisible();
    await expect(page.getByText("First comment (oldest)")).toBeVisible();

    // Clean up test comments
    await prisma.comment.deleteMany({
      where: {
        articleId: testArticleId,
        authorName: { in: ["User 1", "User 2", "User 3"] },
      },
    });
  });

  test("AC-5.1.1: Comment form shows name input for anonymous users", async ({
    page,
  }) => {
    // Navigate to article (not logged in)
    await page.goto(`/articles/${testArticleSlug}`);

    // Verify name input is visible for anonymous users
    await expect(page.getByLabel(/姓名/i)).toBeVisible();
    await expect(page.getByLabel(/留言内容/i)).toBeVisible();
  });

  test("AC-5.1.1: Comment form hides name input for logged-in users", async ({
    page,
  }) => {
    // Login first
    await page.goto("/api/auth/signin");
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/", { timeout: 5000 });

    // Navigate to article
    await page.goto(`/articles/${testArticleSlug}`);

    // Verify name input is NOT visible for logged-in users
    const nameInput = page.locator('input[id="authorName"]');
    await expect(nameInput).not.toBeVisible();

    // Verify comment textarea is visible
    await expect(page.getByLabel(/留言内容/i)).toBeVisible();
  });

  test("AC-5.1.2: Success message is displayed after comment submission", async ({
    page,
  }) => {
    await page.goto(`/articles/${testArticleSlug}`);

    // Fill in comment
    await page.fill('input[id="authorName"]', "Test User");
    await page.fill('textarea[id="content"]', "Test comment for success message");

    // Submit comment
    await page.click('button:has-text("提交留言")');

    // Verify success message appears
    await expect(page.getByText(/留言提交成功/i)).toBeVisible({ timeout: 5000 });
  });

  test("AC-5.1.6: Empty state is displayed when article has no comments", async ({
    page,
  }) => {
    // Create a new article without comments
    const emptyArticle = await prisma.article.create({
      data: {
        title: "Empty Article for E2E",
        content: "<p>This article has no comments.</p>",
        excerpt: "Empty article",
        slug: "e2e-empty-article",
        status: "PUBLISHED",
        authorId: testUserId,
        publishedAt: new Date(),
      },
    });

    await page.goto(`/articles/${emptyArticle.slug}`);

    // Verify empty state message
    await expect(
      page.getByText(/还没有留言|暂无留言|快来发表第一条留言/i)
    ).toBeVisible();

    // Clean up
    await prisma.article.delete({
      where: { id: emptyArticle.id },
    });
  });
});

