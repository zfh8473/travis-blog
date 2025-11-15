import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

/**
 * E2E tests for admin article creation and editing integration.
 * 
 * Tests complete user flows including:
 * - Admin layout integration (AC-6.3.1, AC-6.3.3)
 * - Article creation flow (AC-6.3.1, AC-6.3.2)
 * - Article edit flow (AC-6.3.3, AC-6.3.4)
 * - "Back to Articles List" navigation (AC-6.3.5)
 */

test.describe("Admin Article Integration E2E Tests", () => {
  const testAdminEmail = "e2e-admin-article-integration@example.com";
  const testAdminPassword = "TestPassword123!";
  let testAdminId: string;
  let testArticleId: string;

  test.beforeAll(async () => {
    // Create test admin user
    const hashedPassword = await hashPassword(testAdminPassword);
    const adminUser = await prisma.user.upsert({
      where: { email: testAdminEmail },
      update: {},
      create: {
        email: testAdminEmail,
        password: hashedPassword,
        name: "Test Admin",
        role: "ADMIN",
      },
    });
    testAdminId = adminUser.id;
  });

  test.afterAll(async () => {
    // Clean up test data
    try {
      await prisma.article.deleteMany({
        where: {
          authorId: testAdminId,
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: testAdminId,
        },
      });
    } catch (error) {
      console.warn("Error during test cleanup:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  /**
   * Helper function to login as admin
   */
  async function loginAsAdmin(page: any) {
    await page.goto("/login");
    await page.fill('input[name="email"]', testAdminEmail);
    await page.fill('input[name="password"]', testAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");
  }

  test.describe("AC-6.3.1 & AC-6.3.3: Admin Layout Integration", () => {
    test("should display article creation form within admin layout", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles/new");

      // Wait for page to load
      await page.waitForSelector("text=创建文章", { timeout: 5000 });

      // Check admin layout elements are visible
      await expect(page.getByText("Travis Blog Admin")).toBeVisible();
      await expect(page.getByText("文章管理")).toBeVisible();
      await expect(page.getByText("媒体管理")).toBeVisible();

      // Check form is displayed
      await expect(page.getByText("创建文章")).toBeVisible();
    });

    test("should display article edit form within admin layout", async ({ page }) => {
      // Create a test article first
      const testArticle = await prisma.article.create({
        data: {
          title: "Test Article for Edit",
          content: "<p>Test content</p>",
          slug: "test-article-for-edit",
          status: "DRAFT",
          authorId: testAdminId,
        },
      });
      testArticleId = testArticle.id;

      await loginAsAdmin(page);
      await page.goto(`/admin/articles/${testArticle.id}/edit`);

      // Wait for page to load
      await page.waitForSelector("text=编辑文章", { timeout: 5000 });

      // Check admin layout elements are visible
      await expect(page.getByText("Travis Blog Admin")).toBeVisible();
      await expect(page.getByText("文章管理")).toBeVisible();
      await expect(page.getByText("媒体管理")).toBeVisible();

      // Check form is displayed
      await expect(page.getByText("编辑文章")).toBeVisible();

      // Clean up
      await prisma.article.delete({ where: { id: testArticle.id } });
    });
  });

  test.describe("AC-6.3.2: Article Creation Flow", () => {
    test("should create article and redirect after success", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles/new");

      await page.waitForSelector("text=创建文章", { timeout: 5000 });

      // Fill in form
      await page.fill('input[name="title"]', "E2E Test Article");
      await page.fill('textarea[name="excerpt"]', "Test excerpt");

      // Wait for Tiptap editor to be ready
      await page.waitForTimeout(500);

      // Type in editor (Tiptap editor content is in a contenteditable div)
      const editor = page.locator('[contenteditable="true"]').first();
      await editor.fill("Test article content");

      // Select status (default is DRAFT, but let's make it explicit)
      await page.click('input[value="DRAFT"]');

      // Submit form
      await page.click('button:has-text("保存为草稿")');

      // Wait for success message
      await page.waitForSelector("text=文章创建成功！", { timeout: 5000 });

      // Should redirect to article detail page
      await page.waitForURL(/\/admin\/articles\/[^/]+$/, { timeout: 5000 });
    });

    test("should navigate from articles list to create page", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=文章管理", { timeout: 5000 });

      // Click "New Article" button
      await page.click('a:has-text("新建文章")');

      // Should navigate to create page
      await expect(page).toHaveURL("/admin/articles/new");
      await expect(page.getByText("创建文章")).toBeVisible();
    });
  });

  test.describe("AC-6.3.3 & AC-6.3.4: Article Edit Flow", () => {
    test("should edit article and show success message", async ({ page }) => {
      // Create a test article
      const testArticle = await prisma.article.create({
        data: {
          title: "Test Article to Edit",
          content: "<p>Original content</p>",
          slug: "test-article-to-edit",
          status: "DRAFT",
          authorId: testAdminId,
        },
      });

      await loginAsAdmin(page);
      await page.goto(`/admin/articles/${testArticle.id}/edit`);

      await page.waitForSelector("text=编辑文章", { timeout: 5000 });

      // Verify form is pre-filled
      const titleInput = page.locator('input[name="title"]');
      await expect(titleInput).toHaveValue("Test Article to Edit");

      // Modify title
      await titleInput.fill("Updated Test Article");

      // Submit form
      await page.click('button:has-text("保存为草稿")');

      // Wait for success message
      await page.waitForSelector("text=文章更新成功！", { timeout: 5000 });

      // Clean up
      await prisma.article.delete({ where: { id: testArticle.id } });
    });

    test("should navigate from articles list to edit page", async ({ page }) => {
      // Create a test article
      const testArticle = await prisma.article.create({
        data: {
          title: "Test Article for Navigation",
          content: "<p>Content</p>",
          slug: "test-article-for-navigation",
          status: "PUBLISHED",
          authorId: testAdminId,
          publishedAt: new Date(),
        },
      });

      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Test Article for Navigation", { timeout: 5000 });

      // Click "Edit" button for the article
      const row = page.locator("tr").filter({ hasText: "Test Article for Navigation" });
      await row.locator('a:has-text("编辑")').click();

      // Should navigate to edit page
      await expect(page).toHaveURL(`/admin/articles/${testArticle.id}/edit`);
      await expect(page.getByText("编辑文章")).toBeVisible();

      // Clean up
      await prisma.article.delete({ where: { id: testArticle.id } });
    });
  });

  test.describe("AC-6.3.5: Back to Articles List Navigation", () => {
    test("should navigate back to articles list from create page", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles/new");

      await page.waitForSelector("text=创建文章", { timeout: 5000 });

      // Click "Back to Articles List" link
      await page.click('a:has-text("返回文章列表")');

      // Should navigate to articles list
      await expect(page).toHaveURL("/admin/articles");
      await expect(page.getByText("文章管理")).toBeVisible();
    });

    test("should navigate back to articles list from edit page", async ({ page }) => {
      // Create a test article
      const testArticle = await prisma.article.create({
        data: {
          title: "Test Article for Back Navigation",
          content: "<p>Content</p>",
          slug: "test-article-for-back-navigation",
          status: "DRAFT",
          authorId: testAdminId,
        },
      });

      await loginAsAdmin(page);
      await page.goto(`/admin/articles/${testArticle.id}/edit`);

      await page.waitForSelector("text=编辑文章", { timeout: 5000 });

      // Click "Back to Articles List" link
      await page.click('a:has-text("返回文章列表")');

      // Should navigate to articles list
      await expect(page).toHaveURL("/admin/articles");
      await expect(page.getByText("文章管理")).toBeVisible();

      // Clean up
      await prisma.article.delete({ where: { id: testArticle.id } });
    });
  });
});

