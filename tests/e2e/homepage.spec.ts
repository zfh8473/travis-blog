import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { Role } from "@prisma/client";

/**
 * E2E tests for homepage article list functionality.
 * 
 * Tests complete user flows including:
 * - Visit homepage and see article list
 * - Display article information (title, excerpt, date, category, tags)
 * - Navigate to article detail page
 * - Pagination navigation
 * - Empty state display
 * - Responsive design
 */

test.describe("Homepage Article List E2E Tests", () => {
  const testAdminEmail = "e2e-homepage-admin@example.com";
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
        name: "E2E Homepage Admin",
        role: Role.ADMIN,
      },
    });
    testAdminId = admin.id;

    // Create a test category
    const category = await prisma.category.upsert({
      where: { slug: "e2e-tech" },
      update: {},
      create: {
        name: "技术",
        slug: "e2e-tech",
      },
    });
    testCategoryId = category.id;

    // Create a test tag
    const tag = await prisma.tag.upsert({
      where: { slug: "e2e-react" },
      update: {},
      create: {
        name: "React",
        slug: "e2e-react",
      },
    });
    testTagId = tag.id;

    // Create test published articles
    const articles = await Promise.all([
      prisma.article.create({
        data: {
          title: "E2E Test Article 1",
          content: "<p>Article 1 content</p>",
          excerpt: "Article 1 excerpt",
          slug: "e2e-test-article-1",
          status: "PUBLISHED",
          authorId: testAdminId,
          categoryId: testCategoryId,
          publishedAt: new Date("2025-11-15T10:00:00Z"),
          tags: {
            create: {
              tagId: testTagId,
            },
          },
        },
      }),
      prisma.article.create({
        data: {
          title: "E2E Test Article 2",
          content: "<p>Article 2 content</p>",
          excerpt: "Article 2 excerpt",
          slug: "e2e-test-article-2",
          status: "PUBLISHED",
          authorId: testAdminId,
          publishedAt: new Date("2025-11-14T10:00:00Z"),
        },
      }),
      prisma.article.create({
        data: {
          title: "E2E Test Article 3",
          content: "<p>Article 3 content</p>",
          excerpt: null,
          slug: "e2e-test-article-3",
          status: "PUBLISHED",
          authorId: testAdminId,
          publishedAt: new Date("2025-11-13T10:00:00Z"),
        },
      }),
    ]);

    testArticleIds = articles.map((a) => a.id);
  });

  test.afterAll(async () => {
    try {
      // Delete test articles
      await prisma.article.deleteMany({
        where: { id: { in: testArticleIds } },
      });

      // Delete test category
      await prisma.category.deleteMany({
        where: { id: testCategoryId },
      });

      // Delete test tag
      await prisma.tag.deleteMany({
        where: { id: testTagId },
      });

      // Delete test user
      await prisma.user.deleteMany({
        where: { email: testAdminEmail },
      });
    } catch (error) {
      console.warn("Error during test cleanup:", error);
    }
  });

  test("AC-4.1.1: Should display list of published articles on homepage", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for articles to load
    await page.waitForSelector("article", { timeout: 5000 });

    // Check if articles are displayed
    const articles = page.locator("article");
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);

    // Check if test articles are visible
    await expect(page.getByText("E2E Test Article 1")).toBeVisible();
    await expect(page.getByText("E2E Test Article 2")).toBeVisible();
  });

  test("AC-4.1.2: Should display article information (title, excerpt, date, category, tags)", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for articles to load
    await page.waitForSelector("article", { timeout: 5000 });

    // Check article 1 has all required fields
    const article1 = page.locator("article").first();
    await expect(article1.getByText("E2E Test Article 1")).toBeVisible();
    await expect(article1.getByText("Article 1 excerpt")).toBeVisible();
    await expect(article1.getByText("技术")).toBeVisible();
    await expect(article1.getByText("#React")).toBeVisible();
    // Date should be formatted
    await expect(article1.getByText(/2025年11月/)).toBeVisible();
  });

  test("AC-4.1.2: Should navigate to article detail page when clicked", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for articles to load
    await page.waitForSelector("article", { timeout: 5000 });

    // Click on first article
    await page.getByText("E2E Test Article 1").click();

    // Should navigate to article detail page
    await expect(page).toHaveURL(/\/articles\/e2e-test-article-1/);
  });

  test("AC-4.1.3: Should sort articles by publish date (newest first)", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for articles to load
    await page.waitForSelector("article", { timeout: 5000 });

    // Get all article titles
    const articleTitles = await page
      .locator("article h2")
      .allTextContents();

    // First article should be the newest (Article 1, published on 2025-11-15)
    expect(articleTitles[0]).toContain("E2E Test Article 1");
  });

  test("AC-4.1.4: Should display pagination when more than one page", async ({
    page,
  }) => {
    // Create more articles to trigger pagination
    const moreArticles = [];
    for (let i = 4; i <= 25; i++) {
      moreArticles.push(
        prisma.article.create({
          data: {
            title: `E2E Test Article ${i}`,
            content: `<p>Article ${i} content</p>`,
            excerpt: `Article ${i} excerpt`,
            slug: `e2e-test-article-${i}`,
            status: "PUBLISHED",
            authorId: testAdminId,
            publishedAt: new Date(`2025-11-${10 + i}T10:00:00Z`),
          },
        })
      );
    }
    const createdArticles = await Promise.all(moreArticles);
    const moreArticleIds = createdArticles.map((a) => a.id);

    try {
      await page.goto("/");

      // Wait for articles to load
      await page.waitForSelector("article", { timeout: 5000 });

      // Check if pagination is displayed
      const pagination = page.locator('text="上一页"').or(page.locator('text="下一页"'));
      await expect(pagination.first()).toBeVisible();

      // Check page info
      await expect(page.getByText(/第.*页，共.*页/)).toBeVisible();
    } finally {
      // Cleanup
      await prisma.article.deleteMany({
        where: { id: { in: moreArticleIds } },
      });
    }
  });

  test("AC-4.1.4: Should navigate to next page when clicking Next", async ({
    page,
  }) => {
    // Create enough articles for pagination
    const moreArticles = [];
    for (let i = 4; i <= 25; i++) {
      moreArticles.push(
        prisma.article.create({
          data: {
            title: `E2E Pagination Article ${i}`,
            content: `<p>Article ${i} content</p>`,
            slug: `e2e-pagination-article-${i}`,
            status: "PUBLISHED",
            authorId: testAdminId,
            publishedAt: new Date(`2025-11-${10 + i}T10:00:00Z`),
          },
        })
      );
    }
    const createdArticles = await Promise.all(moreArticles);
    const moreArticleIds = createdArticles.map((a) => a.id);

    try {
      await page.goto("/");

      // Wait for articles to load
      await page.waitForSelector("article", { timeout: 5000 });

      // Click Next button
      const nextButton = page.getByText("下一页");
      if (await nextButton.isVisible()) {
        await nextButton.click();

        // Should navigate to page 2
        await expect(page).toHaveURL(/\?page=2/);

        // Should still show articles
        await expect(page.locator("article").first()).toBeVisible();
      }
    } finally {
      // Cleanup
      await prisma.article.deleteMany({
        where: { id: { in: moreArticleIds } },
      });
    }
  });

  test("AC-4.1.5: Should be responsive on mobile viewport", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Wait for articles to load
    await page.waitForSelector("article", { timeout: 5000 });

    // Check if articles stack vertically on mobile
    const articles = page.locator("article");
    const firstArticle = articles.first();
    const secondArticle = articles.nth(1);

    // On mobile, articles should stack (check computed styles if needed)
    const firstArticleBox = await firstArticle.boundingBox();
    const secondArticleBox = await secondArticle.boundingBox();

    if (firstArticleBox && secondArticleBox) {
      // Second article should be below first article
      expect(secondArticleBox.y).toBeGreaterThan(firstArticleBox.y);
    }
  });

  test("AC-4.1.7: Should display empty state when no articles", async ({
    page,
  }) => {
    // Temporarily delete all published articles
    const allPublishedArticles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true },
    });
    const allPublishedIds = allPublishedArticles.map((a) => a.id);

    await prisma.article.deleteMany({
      where: { id: { in: allPublishedIds } },
    });

    try {
      await page.goto("/");

      // Wait for empty state
      await expect(page.getByText("暂无文章")).toBeVisible();
      await expect(page.getByText("请稍后再来查看新文章")).toBeVisible();
    } finally {
      // Restore articles (recreate test articles)
      await Promise.all([
        prisma.article.create({
          data: {
            title: "E2E Test Article 1",
            content: "<p>Article 1 content</p>",
            excerpt: "Article 1 excerpt",
            slug: "e2e-test-article-1-restored",
            status: "PUBLISHED",
            authorId: testAdminId,
            categoryId: testCategoryId,
            publishedAt: new Date("2025-11-15T10:00:00Z"),
          },
        }),
      ]);
    }
  });
});

