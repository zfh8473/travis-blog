import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { Role } from "@prisma/client";

/**
 * E2E tests for category filtering functionality.
 *
 * Tests complete user flows including:
 * - Navigate from homepage/article card to category page
 * - Display filtered articles by category
 * - Display category information and article count
 * - "All" link navigation
 * - Empty state display
 * - 404 error handling
 */

test.describe("Category Filtering E2E Tests", () => {
  const testAdminEmail = "e2e-category-admin@example.com";
  const testAdminPassword = "testPassword123";
  let testAdminId: string;
  let testCategoryId: string;
  let testCategory2Id: string;
  let testTagId: string;
  let testArticle1Id: string;
  let testArticle2Id: string;
  let testArticle3Id: string;

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
        name: "E2E Category Admin",
        role: Role.ADMIN,
      },
    });
    testAdminId = admin.id;

    // Create test categories
    const category1 = await prisma.category.upsert({
      where: { slug: "e2e-category-tech" },
      update: {},
      create: {
        name: "技术",
        slug: "e2e-category-tech",
      },
    });
    testCategoryId = category1.id;

    const category2 = await prisma.category.upsert({
      where: { slug: "e2e-category-life" },
      update: {},
      create: {
        name: "生活",
        slug: "e2e-category-life",
      },
    });
    testCategory2Id = category2.id;

    // Create a test tag
    const tag = await prisma.tag.upsert({
      where: { slug: "e2e-category-react" },
      update: {},
      create: {
        name: "React",
        slug: "e2e-category-react",
      },
    });
    testTagId = tag.id;

    // Create test published articles in category 1
    const article1 = await prisma.article.create({
      data: {
        title: "E2E Category Tech Article 1",
        content: "<p>This is a tech article</p>",
        excerpt: "Tech article excerpt 1",
        slug: "e2e-category-tech-article-1",
        status: "PUBLISHED",
        authorId: testAdminId,
        categoryId: testCategoryId,
        publishedAt: new Date("2025-11-14T10:00:00Z"),
        tags: {
          create: {
            tagId: testTagId,
          },
        },
      },
    });
    testArticle1Id = article1.id;

    const article2 = await prisma.article.create({
      data: {
        title: "E2E Category Tech Article 2",
        content: "<p>This is another tech article</p>",
        excerpt: "Tech article excerpt 2",
        slug: "e2e-category-tech-article-2",
        status: "PUBLISHED",
        authorId: testAdminId,
        categoryId: testCategoryId,
        publishedAt: new Date("2025-11-13T10:00:00Z"),
        tags: {
          create: {
            tagId: testTagId,
          },
        },
      },
    });
    testArticle2Id = article2.id;

    // Create test published article in category 2
    const article3 = await prisma.article.create({
      data: {
        title: "E2E Category Life Article",
        content: "<p>This is a life article</p>",
        excerpt: "Life article excerpt",
        slug: "e2e-category-life-article",
        status: "PUBLISHED",
        authorId: testAdminId,
        categoryId: testCategory2Id,
        publishedAt: new Date("2025-11-12T10:00:00Z"),
        tags: {
          create: {
            tagId: testTagId,
          },
        },
      },
    });
    testArticle3Id = article3.id;
  });

  test.afterAll(async () => {
    // Clean up test data
    await prisma.article.deleteMany({
      where: {
        id: {
          in: [testArticle1Id, testArticle2Id, testArticle3Id],
        },
      },
    });
    await prisma.tag.deleteMany({
      where: { id: testTagId },
    });
    await prisma.category.deleteMany({
      where: {
        id: {
          in: [testCategoryId, testCategory2Id],
        },
      },
    });
    await prisma.user.deleteMany({
      where: { id: testAdminId },
    });
  });

  test("AC-4.3.1: Navigate from homepage article card to category page", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByText("E2E Category Tech Article 1")
    ).toBeVisible();

    // Click category link in article card
    await page
      .getByRole("link", { name: "技术" })
      .first()
      .click();

    // Should navigate to category page
    await expect(page).toHaveURL(/\/articles\/category\/e2e-category-tech/);
    await expect(page.getByText("技术分类")).toBeVisible();
  });

  test("AC-4.3.1: Display only articles in selected category", async ({
    page,
  }) => {
    await page.goto("/articles/category/e2e-category-tech");

    // Should see tech articles
    await expect(
      page.getByText("E2E Category Tech Article 1")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Category Tech Article 2")
    ).toBeVisible();

    // Should NOT see life article
    await expect(
      page.getByText("E2E Category Life Article")
    ).not.toBeVisible();
  });

  test("AC-4.3.2: URL reflects category filter", async ({ page }) => {
    await page.goto("/articles/category/e2e-category-tech");
    await expect(page).toHaveURL(/\/articles\/category\/e2e-category-tech/);
  });

  test("AC-4.3.3: Display article count for category", async ({ page }) => {
    await page.goto("/articles/category/e2e-category-tech");
    await expect(page.getByText(/共找到 \d+ 篇文章/)).toBeVisible();
    await expect(page.getByText("共找到 2 篇文章")).toBeVisible();
  });

  test("AC-4.3.4: 'All' link navigates to homepage", async ({ page }) => {
    await page.goto("/articles/category/e2e-category-tech");
    await expect(page.getByText("查看全部文章")).toBeVisible();

    // Click "All" link
    await page.getByRole("link", { name: "查看全部文章" }).click();

    // Should navigate to homepage
    await expect(page).toHaveURL("/");
    // Should see all articles
    await expect(
      page.getByText("E2E Category Tech Article 1")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Category Life Article")
    ).toBeVisible();
  });

  test("AC-4.3.5: Display category name", async ({ page }) => {
    await page.goto("/articles/category/e2e-category-tech");
    await expect(page.getByRole("heading", { name: "技术分类" })).toBeVisible();
  });

  test("AC-4.3.6: Display empty state when category has no articles", async ({
    page,
  }) => {
    // Create an empty category
    const emptyCategory = await prisma.category.upsert({
      where: { slug: "e2e-category-empty" },
      update: {},
      create: {
        name: "空分类",
        slug: "e2e-category-empty",
      },
    });

    await page.goto("/articles/category/e2e-category-empty");
    await expect(page.getByText("暂无文章")).toBeVisible();

    // Clean up
    await prisma.category.delete({
      where: { id: emptyCategory.id },
    });
  });

  test("AC-4.3.7: Display 404 error page for non-existent category", async ({
    page,
  }) => {
    await page.goto("/articles/category/non-existent-category");
    await expect(page.getByText("分类不存在")).toBeVisible();
    await expect(page.getByText("您访问的分类不存在或已被删除")).toBeVisible();
    await expect(page.getByRole("link", { name: "返回首页" })).toBeVisible();
  });

  test("AC-4.3.1: Complete user flow - click category → see filtered articles → click All → see all articles", async ({
    page,
  }) => {
    // Start at homepage
    await page.goto("/");
    await expect(
      page.getByText("E2E Category Tech Article 1")
    ).toBeVisible();

    // Click category link
    await page
      .getByRole("link", { name: "技术" })
      .first()
      .click();

    // Should see filtered articles
    await expect(page).toHaveURL(/\/articles\/category\/e2e-category-tech/);
    await expect(
      page.getByText("E2E Category Tech Article 1")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Category Tech Article 2")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Category Life Article")
    ).not.toBeVisible();

    // Click "All" link
    await page.getByRole("link", { name: "查看全部文章" }).click();

    // Should see all articles
    await expect(page).toHaveURL("/");
    await expect(
      page.getByText("E2E Category Tech Article 1")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Category Life Article")
    ).toBeVisible();
  });

  test("AC-4.3.2: Pagination works with category filter", async ({ page }) => {
    // Create more articles in tech category to test pagination
    const articles = [];
    for (let i = 3; i <= 25; i++) {
      const article = await prisma.article.create({
        data: {
          title: `E2E Category Tech Article ${i}`,
          content: `<p>Tech article ${i}</p>`,
          excerpt: `Tech article excerpt ${i}`,
          slug: `e2e-category-tech-article-${i}`,
          status: "PUBLISHED",
          authorId: testAdminId,
          categoryId: testCategoryId,
          publishedAt: new Date(`2025-11-${14 - i}T10:00:00Z`),
        },
      });
      articles.push(article);
    }

    await page.goto("/articles/category/e2e-category-tech");
    await expect(page.getByText(/共找到 \d+ 篇文章/)).toBeVisible();

    // Check pagination controls
    const pagination = page.locator("text=下一页");
    if (await pagination.isVisible()) {
      await pagination.click();
      await expect(page).toHaveURL(/\/articles\/category\/e2e-category-tech\?page=2/);
    }

    // Clean up
    await prisma.article.deleteMany({
      where: {
        id: {
          in: articles.map((a) => a.id),
        },
      },
    });
  });
});

