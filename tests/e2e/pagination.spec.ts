import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { Role } from "@prisma/client";

/**
 * E2E tests for pagination functionality.
 *
 * Tests complete user flows including:
 * - Pagination navigation on homepage, category page, and tag page
 * - URL parameter updates
 * - Edge cases (first page, last page)
 * - Responsive behavior
 */

test.describe("Pagination E2E Tests", () => {
  const testAdminEmail = "e2e-pagination-admin@example.com";
  const testAdminPassword = "testPassword123";
  let testAdminId: string;
  let testCategoryId: string;
  let testTagId: string;
  let testArticleIds: string[] = [];

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
        name: "E2E Pagination Admin",
        role: Role.ADMIN,
      },
    });
    testAdminId = admin.id;

    // Create test category
    const category = await prisma.category.upsert({
      where: { slug: "e2e-pagination-tech" },
      update: {},
      create: {
        name: "技术",
        slug: "e2e-pagination-tech",
      },
    });
    testCategoryId = category.id;

    // Create test tag
    const tag = await prisma.tag.upsert({
      where: { slug: "e2e-pagination-react" },
      update: {},
      create: {
        name: "React",
        slug: "e2e-pagination-react",
      },
    });
    testTagId = tag.id;

    // Create 25 test published articles (more than one page with default limit of 20)
    const articles = [];
    for (let i = 1; i <= 25; i++) {
      const article = await prisma.article.create({
        data: {
          title: `E2E Pagination Article ${i}`,
          content: `<p>This is article ${i} for pagination testing</p>`,
          excerpt: `Article ${i} excerpt`,
          slug: `e2e-pagination-article-${i}`,
          status: "PUBLISHED",
          authorId: testAdminId,
          categoryId: testCategoryId,
          publishedAt: new Date(`2025-11-${String(14 + i).padStart(2, "0")}T10:00:00Z`),
          tags: {
            create: {
              tagId: testTagId,
            },
          },
        },
      });
      articles.push(article);
      testArticleIds.push(article.id);
    }
  });

  test.afterAll(async () => {
    // Cleanup test data
    await prisma.article.deleteMany({
      where: {
        id: { in: testArticleIds },
      },
    });
    await prisma.tag.deleteMany({
      where: { slug: "e2e-pagination-react" },
    });
    await prisma.category.deleteMany({
      where: { slug: "e2e-pagination-tech" },
    });
    await prisma.user.deleteMany({
      where: { email: testAdminEmail },
    });
  });

  test("AC-4.5.1: Pagination is displayed on homepage when articles exceed one page", async ({
    page,
  }) => {
    await page.goto("/");

    // Should see pagination controls
    await expect(page.getByText("上一页")).toBeVisible();
    await expect(page.getByText("下一页")).toBeVisible();
    await expect(page.getByText(/第 \d+ 页，共 \d+ 页/)).toBeVisible();
  });

  test("AC-4.5.2: Current page number and total pages are displayed", async ({
    page,
  }) => {
    await page.goto("/");

    // Should see page info
    const pageInfo = page.getByText(/第 \d+ 页，共 \d+ 页/);
    await expect(pageInfo).toBeVisible();
    const text = await pageInfo.textContent();
    expect(text).toMatch(/第 \d+ 页，共 \d+ 页/);
  });

  test("AC-4.5.3: Clicking 'Next' button navigates to next page on homepage", async ({
    page,
  }) => {
    await page.goto("/");

    // Click next button
    await page.getByText("下一页").click();

    // Should navigate to page 2
    await expect(page).toHaveURL(/\?page=2/);
    await expect(page.getByText("E2E Pagination Article 5")).toBeVisible(); // Articles 21-25 on page 2
  });

  test("AC-4.5.4: Clicking 'Previous' button navigates to previous page on homepage", async ({
    page,
  }) => {
    await page.goto("/?page=2");

    // Click previous button
    await page.getByText("上一页").click();

    // Should navigate back to page 1
    await expect(page).toHaveURL(/\?page=1|^\/$/);
    await expect(page.getByText("E2E Pagination Article 25")).toBeVisible(); // First page articles
  });

  test("AC-4.5.5: Clicking a specific page number navigates to that page on homepage", async ({
    page,
  }) => {
    await page.goto("/");

    // Click page 2
    await page.getByRole("link", { name: "2" }).click();

    // Should navigate to page 2
    await expect(page).toHaveURL(/\?page=2/);
    await expect(page.getByText("E2E Pagination Article 5")).toBeVisible();
  });

  test("AC-4.5.6: URL reflects current page when navigating on homepage", async ({
    page,
  }) => {
    await page.goto("/");

    // Navigate to page 2
    await page.getByRole("link", { name: "2" }).click();
    await expect(page).toHaveURL(/\?page=2/);

    // Navigate to page 1
    await page.getByRole("link", { name: "1" }).click();
    await expect(page).toHaveURL(/\?page=1|^\/$/);
  });

  test("AC-4.5.7: 'Previous' button is disabled on first page", async ({ page }) => {
    await page.goto("/");

    // Previous button should be disabled (not clickable)
    const prevButton = page.getByText("上一页");
    await expect(prevButton).toBeVisible();
    // Check if it's a span (disabled) or link (enabled)
    const tagName = await prevButton.evaluate((el) => el.tagName);
    expect(tagName).toBe("SPAN"); // Disabled state uses span
  });

  test("AC-4.5.8: 'Next' button is disabled on last page", async ({ page }) => {
    await page.goto("/?page=2"); // Assuming 2 pages with 25 articles

    // Next button should be disabled (not clickable)
    const nextButton = page.getByText("下一页");
    await expect(nextButton).toBeVisible();
    // Check if it's a span (disabled) or link (enabled)
    const tagName = await nextButton.evaluate((el) => el.tagName);
    expect(tagName).toBe("SPAN"); // Disabled state uses span
  });

  test("AC-4.5.9: Page numbers are shown with ellipsis for many pages", async ({
    page,
  }) => {
    // Create more articles to have many pages
    const moreArticles = [];
    for (let i = 26; i <= 50; i++) {
      const article = await prisma.article.create({
        data: {
          title: `E2E Pagination Article ${i}`,
          content: `<p>This is article ${i}</p>`,
          excerpt: `Article ${i} excerpt`,
          slug: `e2e-pagination-article-${i}`,
          status: "PUBLISHED",
          authorId: testAdminId,
          categoryId: testCategoryId,
          publishedAt: new Date(`2025-11-${String(14 + i).padStart(2, "0")}T10:00:00Z`),
        },
      });
      moreArticles.push(article);
      testArticleIds.push(article.id);
    }

    await page.goto("/?page=5");

    // Should see ellipsis when on page 5 of many pages
    const ellipsis = page.getByText("...");
    await expect(ellipsis).toBeVisible();

    // Cleanup
    await prisma.article.deleteMany({
      where: {
        id: { in: moreArticles.map((a) => a.id) },
      },
    });
  });

  test("AC-4.5.10: Pagination controls are responsive on mobile devices", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Pagination should still be visible and usable
    await expect(page.getByText("上一页")).toBeVisible();
    await expect(page.getByText("下一页")).toBeVisible();
    await expect(page.getByText(/第 \d+ 页，共 \d+ 页/)).toBeVisible();

    // Layout should adapt (flex-col on mobile)
    const pagination = page.locator('div:has-text("上一页")').locator("..");
    const classes = await pagination.evaluate((el) => el.className);
    expect(classes).toContain("flex-col");
  });

  test("AC-4.5.1, AC-4.5.6: Pagination on category page maintains filter in URL", async ({
    page,
  }) => {
    await page.goto("/articles/category/e2e-pagination-tech");

    // Should see pagination
    await expect(page.getByText("上一页")).toBeVisible();

    // Navigate to page 2
    await page.getByRole("link", { name: "2" }).click();

    // URL should maintain category filter
    await expect(page).toHaveURL(/\/articles\/category\/e2e-pagination-tech\?page=2/);
  });

  test("AC-4.5.1, AC-4.5.6: Pagination on tag page maintains filter in URL", async ({
    page,
  }) => {
    await page.goto("/articles/tag/e2e-pagination-react");

    // Should see pagination
    await expect(page.getByText("上一页")).toBeVisible();

    // Navigate to page 2
    await page.getByRole("link", { name: "2" }).click();

    // URL should maintain tag filter
    await expect(page).toHaveURL(/\/articles\/tag\/e2e-pagination-react\?page=2/);
  });

  test("AC-4.5.3: Clicking 'Next' button works on category page", async ({ page }) => {
    await page.goto("/articles/category/e2e-pagination-tech");

    await page.getByText("下一页").click();

    await expect(page).toHaveURL(/\/articles\/category\/e2e-pagination-tech\?page=2/);
  });

  test("AC-4.5.3: Clicking 'Next' button works on tag page", async ({ page }) => {
    await page.goto("/articles/tag/e2e-pagination-react");

    await page.getByText("下一页").click();

    await expect(page).toHaveURL(/\/articles\/tag\/e2e-pagination-react\?page=2/);
  });

  test("AC-4.5.5: Clicking page number works on category page", async ({ page }) => {
    await page.goto("/articles/category/e2e-pagination-tech");

    await page.getByRole("link", { name: "2" }).click();

    await expect(page).toHaveURL(/\/articles\/category\/e2e-pagination-tech\?page=2/);
  });

  test("AC-4.5.5: Clicking page number works on tag page", async ({ page }) => {
    await page.goto("/articles/tag/e2e-pagination-react");

    await page.getByRole("link", { name: "2" }).click();

    await expect(page).toHaveURL(/\/articles\/tag\/e2e-pagination-react\?page=2/);
  });
});

