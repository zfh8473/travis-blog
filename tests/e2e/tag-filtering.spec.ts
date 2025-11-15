import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { Role } from "@prisma/client";

/**
 * E2E tests for tag filtering functionality.
 *
 * Tests complete user flows including:
 * - Navigate from homepage/article detail to tag page
 * - Display filtered articles by tag
 * - Display tag information and article count
 * - "All" link navigation
 * - Empty state display
 * - 404 error handling
 */

test.describe("Tag Filtering E2E Tests", () => {
  const testAdminEmail = "e2e-tag-admin@example.com";
  const testAdminPassword = "testPassword123";
  let testAdminId: string;
  let testCategoryId: string;
  let testTagId: string;
  let testTag2Id: string;
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
        name: "E2E Tag Admin",
        role: Role.ADMIN,
      },
    });
    testAdminId = admin.id;

    // Create test category
    const category = await prisma.category.upsert({
      where: { slug: "e2e-tag-tech" },
      update: {},
      create: {
        name: "技术",
        slug: "e2e-tag-tech",
      },
    });
    testCategoryId = category.id;

    // Create test tags
    const tag1 = await prisma.tag.upsert({
      where: { slug: "e2e-tag-react" },
      update: {},
      create: {
        name: "React",
        slug: "e2e-tag-react",
      },
    });
    testTagId = tag1.id;

    const tag2 = await prisma.tag.upsert({
      where: { slug: "e2e-tag-vue" },
      update: {},
      create: {
        name: "Vue",
        slug: "e2e-tag-vue",
      },
    });
    testTag2Id = tag2.id;

    // Create test published articles with tag 1
    const article1 = await prisma.article.create({
      data: {
        title: "E2E Tag React Article 1",
        content: "<p>This is a React article</p>",
        excerpt: "React article excerpt 1",
        slug: "e2e-tag-react-article-1",
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
        title: "E2E Tag React Article 2",
        content: "<p>This is another React article</p>",
        excerpt: "React article excerpt 2",
        slug: "e2e-tag-react-article-2",
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

    // Create test published article with tag 2
    const article3 = await prisma.article.create({
      data: {
        title: "E2E Tag Vue Article",
        content: "<p>This is a Vue article</p>",
        excerpt: "Vue article excerpt",
        slug: "e2e-tag-vue-article",
        status: "PUBLISHED",
        authorId: testAdminId,
        categoryId: testCategoryId,
        publishedAt: new Date("2025-11-12T10:00:00Z"),
        tags: {
          create: {
            tagId: testTag2Id,
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
      where: {
        id: {
          in: [testTagId, testTag2Id],
        },
      },
    });
    await prisma.category.deleteMany({
      where: { id: testCategoryId },
    });
    await prisma.user.deleteMany({
      where: { id: testAdminId },
    });
  });

  test("AC-4.4.1: Navigate from homepage article card to tag page", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByText("E2E Tag React Article 1")
    ).toBeVisible();

    // Click tag link in article card
    await page
      .getByRole("link", { name: "React" })
      .first()
      .click();

    // Should navigate to tag page
    await expect(page).toHaveURL(/\/articles\/tag\/e2e-tag-react/);
    await expect(page.getByText("React标签")).toBeVisible();
  });

  test("AC-4.4.1: Navigate from article detail to tag page", async ({
    page,
  }) => {
    await page.goto("/articles/e2e-tag-react-article-1");
    await expect(
      page.getByText("E2E Tag React Article 1")
    ).toBeVisible();

    // Click tag link in article detail
    await page
      .getByRole("link", { name: "React" })
      .first()
      .click();

    // Should navigate to tag page
    await expect(page).toHaveURL(/\/articles\/tag\/e2e-tag-react/);
    await expect(page.getByText("React标签")).toBeVisible();
  });

  test("AC-4.4.1: Display only articles with selected tag", async ({
    page,
  }) => {
    await page.goto("/articles/tag/e2e-tag-react");

    // Should see React articles
    await expect(
      page.getByText("E2E Tag React Article 1")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Tag React Article 2")
    ).toBeVisible();

    // Should NOT see Vue article
    await expect(
      page.getByText("E2E Tag Vue Article")
    ).not.toBeVisible();
  });

  test("AC-4.4.2: URL reflects tag filter", async ({ page }) => {
    await page.goto("/articles/tag/e2e-tag-react");
    await expect(page).toHaveURL(/\/articles\/tag\/e2e-tag-react/);
  });

  test("AC-4.4.3: Display article count for tag", async ({ page }) => {
    await page.goto("/articles/tag/e2e-tag-react");
    await expect(page.getByText(/共找到 \d+ 篇文章/)).toBeVisible();
    await expect(page.getByText("共找到 2 篇文章")).toBeVisible();
  });

  test("AC-4.4.4: 'All' link navigates to homepage", async ({ page }) => {
    await page.goto("/articles/tag/e2e-tag-react");
    await expect(page.getByText("查看全部文章")).toBeVisible();

    // Click "All" link
    await page.getByRole("link", { name: "查看全部文章" }).click();

    // Should navigate to homepage
    await expect(page).toHaveURL("/");
    // Should see all articles
    await expect(
      page.getByText("E2E Tag React Article 1")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Tag Vue Article")
    ).toBeVisible();
  });

  test("AC-4.4.5: Display tag name", async ({ page }) => {
    await page.goto("/articles/tag/e2e-tag-react");
    await expect(page.getByRole("heading", { name: "React标签" })).toBeVisible();
  });

  test("AC-4.4.6: Display empty state when tag has no articles", async ({
    page,
  }) => {
    // Create an empty tag
    const emptyTag = await prisma.tag.upsert({
      where: { slug: "e2e-tag-empty" },
      update: {},
      create: {
        name: "空标签",
        slug: "e2e-tag-empty",
      },
    });

    await page.goto("/articles/tag/e2e-tag-empty");
    await expect(page.getByText("暂无文章")).toBeVisible();

    // Clean up
    await prisma.tag.delete({
      where: { id: emptyTag.id },
    });
  });

  test("AC-4.4.7: Display 404 error page for non-existent tag", async ({
    page,
  }) => {
    await page.goto("/articles/tag/non-existent-tag");
    await expect(page.getByText("标签不存在")).toBeVisible();
    await expect(page.getByText("您访问的标签不存在或已被删除")).toBeVisible();
    await expect(page.getByRole("link", { name: "返回首页" })).toBeVisible();
  });

  test("AC-4.4.1: Complete user flow - click tag from ArticleCard → see filtered articles → click All → see all articles", async ({
    page,
  }) => {
    // Start at homepage
    await page.goto("/");
    await expect(
      page.getByText("E2E Tag React Article 1")
    ).toBeVisible();

    // Click tag link
    await page
      .getByRole("link", { name: "React" })
      .first()
      .click();

    // Should see filtered articles
    await expect(page).toHaveURL(/\/articles\/tag\/e2e-tag-react/);
    await expect(
      page.getByText("E2E Tag React Article 1")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Tag React Article 2")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Tag Vue Article")
    ).not.toBeVisible();

    // Click "All" link
    await page.getByRole("link", { name: "查看全部文章" }).click();

    // Should see all articles
    await expect(page).toHaveURL("/");
    await expect(
      page.getByText("E2E Tag React Article 1")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Tag Vue Article")
    ).toBeVisible();
  });

  test("AC-4.4.1: Complete user flow - click tag from ArticleDetail → see filtered articles → click All → see all articles", async ({
    page,
  }) => {
    // Start at article detail
    await page.goto("/articles/e2e-tag-react-article-1");
    await expect(
      page.getByText("E2E Tag React Article 1")
    ).toBeVisible();

    // Click tag link
    await page
      .getByRole("link", { name: "React" })
      .first()
      .click();

    // Should see filtered articles
    await expect(page).toHaveURL(/\/articles\/tag\/e2e-tag-react/);
    await expect(
      page.getByText("E2E Tag React Article 1")
    ).toBeVisible();
    await expect(
      page.getByText("E2E Tag React Article 2")
    ).toBeVisible();

    // Click "All" link
    await page.getByRole("link", { name: "查看全部文章" }).click();

    // Should see all articles
    await expect(page).toHaveURL("/");
  });

  test("AC-4.4.2: Pagination works with tag filter", async ({ page }) => {
    // Create more articles with React tag to test pagination
    const articles = [];
    for (let i = 3; i <= 25; i++) {
      const article = await prisma.article.create({
        data: {
          title: `E2E Tag React Article ${i}`,
          content: `<p>React article ${i}</p>`,
          excerpt: `React article excerpt ${i}`,
          slug: `e2e-tag-react-article-${i}`,
          status: "PUBLISHED",
          authorId: testAdminId,
          categoryId: testCategoryId,
          publishedAt: new Date(`2025-11-${14 - i}T10:00:00Z`),
          tags: {
            create: {
              tagId: testTagId,
            },
          },
        },
      });
      articles.push(article);
    }

    await page.goto("/articles/tag/e2e-tag-react");
    await expect(page.getByText(/共找到 \d+ 篇文章/)).toBeVisible();

    // Check pagination controls
    const pagination = page.locator("text=下一页");
    if (await pagination.isVisible()) {
      await pagination.click();
      await expect(page).toHaveURL(/\/articles\/tag\/e2e-tag-react\?page=2/);
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

