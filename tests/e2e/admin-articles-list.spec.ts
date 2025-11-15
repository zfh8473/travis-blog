import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

/**
 * E2E tests for admin articles list page.
 * 
 * Tests complete user flows including:
 * - Admin user viewing articles list (AC-6.2.1)
 * - Status filter functionality (AC-6.2.2)
 * - Search functionality (AC-6.2.3)
 * - Navigation to create/edit pages (AC-6.2.4, AC-6.2.5)
 * - Delete functionality with confirmation (AC-6.2.6)
 * - Article statistics display (AC-6.2.7)
 */

test.describe("Admin Articles List E2E Tests", () => {
  const testAdminEmail = "e2e-admin-articles@example.com";
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

    // Create test articles
    const publishedArticle = await prisma.article.create({
      data: {
        title: "Published Test Article",
        content: "<p>Published content</p>",
        slug: "published-test-article",
        status: "PUBLISHED",
        authorId: testAdminId,
        publishedAt: new Date(),
      },
    });
    testArticleId = publishedArticle.id;

    await prisma.article.create({
      data: {
        title: "Draft Test Article",
        content: "<p>Draft content</p>",
        slug: "draft-test-article",
        status: "DRAFT",
        authorId: testAdminId,
      },
    });
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

  test.describe("AC-6.2.1: Display articles list", () => {
    test("should display all articles with required fields", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      // Wait for articles to load
      await page.waitForSelector("text=Published Test Article", { timeout: 5000 });

      // Check article fields are displayed
      await expect(page.getByText("Published Test Article")).toBeVisible();
      await expect(page.getByText("已发布")).toBeVisible();
      await expect(page.getByText("Test Admin")).toBeVisible();
    });

    test("should display both published and draft articles", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Published Test Article", { timeout: 5000 });

      await expect(page.getByText("Published Test Article")).toBeVisible();
      await expect(page.getByText("Draft Test Article")).toBeVisible();
    });
  });

  test.describe("AC-6.2.2: Status filter", () => {
    test("should filter articles by published status", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Published Test Article", { timeout: 5000 });

      // Select published filter
      await page.selectOption('select[id="status-filter"]', "published");

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Check only published articles are shown
      await expect(page.getByText("Published Test Article")).toBeVisible();
      await expect(page.getByText("Draft Test Article")).not.toBeVisible();

      // Check URL is updated
      expect(page.url()).toContain("status=published");
    });

    test("should filter articles by draft status", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Draft Test Article", { timeout: 5000 });

      // Select drafts filter
      await page.selectOption('select[id="status-filter"]', "drafts");

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Check only draft articles are shown
      await expect(page.getByText("Draft Test Article")).toBeVisible();
      await expect(page.getByText("Published Test Article")).not.toBeVisible();

      // Check URL is updated
      expect(page.url()).toContain("status=drafts");
    });

    test("should show all articles when filter is 'all'", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles?status=published");

      await page.waitForSelector("text=Published Test Article", { timeout: 5000 });

      // Select all filter
      await page.selectOption('select[id="status-filter"]', "all");

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Check all articles are shown
      await expect(page.getByText("Published Test Article")).toBeVisible();
      await expect(page.getByText("Draft Test Article")).toBeVisible();
    });

    test("should persist filter in URL on page refresh", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Published Test Article", { timeout: 5000 });

      // Set filter
      await page.selectOption('select[id="status-filter"]', "published");

      // Refresh page
      await page.reload();

      // Check filter is still applied
      const filterValue = await page.inputValue('select[id="status-filter"]');
      expect(filterValue).toBe("published");
    });
  });

  test.describe("AC-6.2.3: Search functionality", () => {
    test("should filter articles by search query", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Published Test Article", { timeout: 5000 });

      // Enter search query
      await page.fill('input[id="search-input"]', "Published");

      // Wait for debounce and filter to apply
      await page.waitForTimeout(500);

      // Check only matching articles are shown
      await expect(page.getByText("Published Test Article")).toBeVisible();
      await expect(page.getByText("Draft Test Article")).not.toBeVisible();

      // Check URL is updated (after debounce)
      await page.waitForTimeout(300);
      expect(page.url()).toContain("search=Published");
    });

    test("should show no results when search doesn't match", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Published Test Article", { timeout: 5000 });

      // Enter search query that doesn't match
      await page.fill('input[id="search-input"]', "NonExistent");

      // Wait for debounce and filter to apply
      await page.waitForTimeout(500);

      // Check no results message
      await expect(page.getByText("没有找到匹配的文章")).toBeVisible();
    });

    test("should persist search in URL on page refresh", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles?search=Published");

      await page.waitForSelector("text=Published Test Article", { timeout: 5000 });

      // Check search input has value
      const searchValue = await page.inputValue('input[id="search-input"]');
      expect(searchValue).toBe("Published");
    });
  });

  test.describe("AC-6.2.4 & AC-6.2.5: Navigation", () => {
    test("should navigate to create article page when clicking 'New Article'", async ({
      page,
    }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=新建文章", { timeout: 5000 });

      // Click New Article button
      await page.click("text=新建文章");

      // Check navigation
      await expect(page).toHaveURL("/admin/articles/new");
    });

    test("should navigate to edit article page when clicking 'Edit'", async ({
      page,
    }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Published Test Article", { timeout: 5000 });

      // Click Edit button for the article
      const editLink = page.locator('a:has-text("编辑")').first();
      await editLink.click();

      // Check navigation
      await expect(page).toHaveURL(new RegExp("/admin/articles/.*/edit"));
    });
  });

  test.describe("AC-6.2.6: Delete functionality", () => {
    test("should show confirmation dialog when delete is clicked", async ({
      page,
    }) => {
      // Create article to delete
      const articleToDelete = await prisma.article.create({
        data: {
          title: "Article to Delete",
          content: "<p>Content</p>",
          slug: "article-to-delete-e2e",
          status: "PUBLISHED",
          authorId: testAdminId,
          publishedAt: new Date(),
        },
      });

      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Article to Delete", { timeout: 5000 });

      // Set up dialog handler
      page.on("dialog", async (dialog) => {
        expect(dialog.message()).toContain("确定要删除文章《Article to Delete》吗？");
        await dialog.dismiss(); // Cancel deletion
      });

      // Click delete button
      const deleteButtons = page.locator('button:has-text("删除")');
      const deleteButton = deleteButtons.filter({
        has: page.locator(`text=Article to Delete`).locator(".."),
      });
      await deleteButton.first().click();

      // Clean up
      await prisma.article.delete({ where: { id: articleToDelete.id } });
    });

    test("should delete article when confirmed", async ({ page }) => {
      // Create article to delete
      const articleToDelete = await prisma.article.create({
        data: {
          title: "Article to Delete Confirmed",
          content: "<p>Content</p>",
          slug: "article-to-delete-confirmed",
          status: "PUBLISHED",
          authorId: testAdminId,
          publishedAt: new Date(),
        },
      });

      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=Article to Delete Confirmed", { timeout: 5000 });

      // Set up dialog handler to accept
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      // Click delete button
      const deleteButton = page
        .locator("tr")
        .filter({ hasText: "Article to Delete Confirmed" })
        .locator('button:has-text("删除")');
      await deleteButton.click();

      // Wait for deletion and success message
      await page.waitForSelector("text=文章删除成功！", { timeout: 5000 });

      // Check article is removed from list
      await expect(page.getByText("Article to Delete Confirmed")).not.toBeVisible();
    });
  });

  test.describe("AC-6.2.7: Article statistics", () => {
    test("should display article statistics", async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto("/admin/articles");

      await page.waitForSelector("text=总文章数", { timeout: 5000 });

      // Check statistics are displayed
      await expect(page.getByText("总文章数")).toBeVisible();
      await expect(page.getByText("已发布")).toBeVisible();
      await expect(page.getByText("草稿")).toBeVisible();

      // Check statistics show numbers
      const totalText = await page.locator("text=总文章数").locator("..").textContent();
      expect(totalText).toMatch(/\d+/);
    });
  });
});

