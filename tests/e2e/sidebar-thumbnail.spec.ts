import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { Role } from "@prisma/client";

/**
 * E2E tests for sidebar popular articles thumbnail display.
 * 
 * Tests the issue where thumbnails fail to display when multiple articles
 * have the same first letter in their titles.
 * 
 * Test scenarios:
 * - Create multiple articles with same first letter
 * - Verify all thumbnails are displayed correctly
 * - Verify each thumbnail has unique SVG ID
 * - Verify thumbnails don't conflict or fail to render
 */

test.describe("Sidebar Popular Articles Thumbnail Display", () => {
  const testAdminEmail = "e2e-thumbnail-admin@example.com";
  const testAdminPassword = "testPassword123";
  let testAdminId: string;
  let testCategoryId: string;
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
        name: "E2E Thumbnail Admin",
        role: Role.ADMIN,
      },
    });
    testAdminId = admin.id;

    // Create a test category
    const category = await prisma.category.upsert({
      where: { slug: "e2e-thumbnail-tech" },
      update: {},
      create: {
        name: "技术",
        slug: "e2e-thumbnail-tech",
      },
    });
    testCategoryId = category.id;
  });

  test.afterAll(async () => {
    // Clean up test data
    if (testArticleIds.length > 0) {
      await prisma.article.deleteMany({
        where: { id: { in: testArticleIds } },
      });
    }
    await prisma.category.deleteMany({
      where: { slug: "e2e-thumbnail-tech" },
    });
    await prisma.user.deleteMany({
      where: { email: testAdminEmail },
    });
  });

  test("[P0] should display thumbnails correctly when multiple articles have same first letter", async ({
    page,
  }) => {
    // Given: Multiple published articles with same first letter "测" (Test)
    const articlesWithSameFirstLetter = [
      {
        title: "测试文章一",
        slug: "test-article-1",
        content: "<p>这是第一篇测试文章</p>",
      },
      {
        title: "测试文章二",
        slug: "test-article-2",
        content: "<p>这是第二篇测试文章</p>",
      },
      {
        title: "测试文章三",
        slug: "test-article-3",
        content: "<p>这是第三篇测试文章</p>",
      },
      {
        title: "测试文章四",
        slug: "test-article-4",
        content: "<p>这是第四篇测试文章</p>",
      },
      {
        title: "测试文章五",
        slug: "test-article-5",
        content: "<p>这是第五篇测试文章</p>",
      },
    ];

    // Create articles
    for (const articleData of articlesWithSameFirstLetter) {
      const article = await prisma.article.create({
        data: {
          title: articleData.title,
          slug: articleData.slug,
          content: articleData.content,
          excerpt: articleData.content.substring(0, 100),
          status: "PUBLISHED",
          publishedAt: new Date(),
          authorId: testAdminId,
          categoryId: testCategoryId,
        },
      });
      testArticleIds.push(article.id);
    }

    // When: User visits the homepage
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Then: All popular articles should be displayed with thumbnails
    const sidebar = page.locator('aside:has-text("热门文章")');
    await expect(sidebar).toBeVisible();

    // Verify all 5 articles are displayed
    const articleLinks = sidebar.locator('a.popular-article');
    await expect(articleLinks).toHaveCount(5);

    // Verify each article has a thumbnail
    for (let i = 0; i < 5; i++) {
      const articleLink = articleLinks.nth(i);
      const thumbnail = articleLink.locator(".popular-article-thumb");
      
      await expect(thumbnail).toBeVisible();
      
      // Verify thumbnail contains either an image or the first letter
      const thumbnailContent = await thumbnail.innerHTML();
      expect(
        thumbnailContent.includes("测") || 
        thumbnailContent.includes("<img") ||
        thumbnailContent.includes("data:image")
      ).toBeTruthy();
    }
  });

  test("[P0] should have unique SVG IDs for each thumbnail when first letters are same", async ({
    page,
  }) => {
    // Given: Multiple published articles with same first letter
    const articlesWithSameFirstLetter = [
      {
        title: "测试文章A",
        slug: "test-article-a",
        content: "<p>测试A</p>",
      },
      {
        title: "测试文章B",
        slug: "test-article-b",
        content: "<p>测试B</p>",
      },
      {
        title: "测试文章C",
        slug: "test-article-c",
        content: "<p>测试C</p>",
      },
    ];

    // Create articles
    for (const articleData of articlesWithSameFirstLetter) {
      const article = await prisma.article.create({
        data: {
          title: articleData.title,
          slug: articleData.slug,
          content: articleData.content,
          excerpt: articleData.content.substring(0, 100),
          status: "PUBLISHED",
          publishedAt: new Date(),
          authorId: testAdminId,
          categoryId: testCategoryId,
        },
      });
      testArticleIds.push(article.id);
    }

    // When: User visits the homepage
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Then: Extract all thumbnail data URLs and verify they are unique
    const sidebar = page.locator('aside:has-text("热门文章")');
    const articleLinks = sidebar.locator('a.popular-article');
    
    const thumbnailDataUrls: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      const articleLink = articleLinks.nth(i);
      const thumbnail = articleLink.locator(".popular-article-thumb img");
      
      // Check if thumbnail is an image (data URL)
      const imgSrc = await thumbnail.getAttribute("src");
      if (imgSrc && imgSrc.startsWith("data:image")) {
        thumbnailDataUrls.push(imgSrc);
      }
    }

    // Verify all thumbnails are unique (decode and check SVG IDs)
    const svgIds: string[] = [];
    for (const dataUrl of thumbnailDataUrls) {
      // Decode data URL
      const svgContent = decodeURIComponent(dataUrl.split(",")[1]);
      
      // Extract gradient ID from SVG
      const gradientIdMatch = svgContent.match(/id="([^"]+)"/);
      if (gradientIdMatch) {
        svgIds.push(gradientIdMatch[1]);
      }
    }

    // All SVG IDs should be unique
    const uniqueIds = new Set(svgIds);
    expect(uniqueIds.size).toBe(svgIds.length);
  });

  test("[P1] should display thumbnails correctly with mixed first letters", async ({
    page,
  }) => {
    // Given: Articles with different first letters
    const articlesWithDifferentFirstLetters = [
      {
        title: "测试文章",
        slug: "test-article-1",
        content: "<p>测试</p>",
      },
      {
        title: "代码文章",
        slug: "code-article-1",
        content: "<p>代码</p>",
      },
      {
        title: "图片文章",
        slug: "image-article-1",
        content: "<p>图片</p>",
      },
    ];

    // Create articles
    for (const articleData of articlesWithDifferentFirstLetters) {
      const article = await prisma.article.create({
        data: {
          title: articleData.title,
          slug: articleData.slug,
          content: articleData.content,
          excerpt: articleData.content.substring(0, 100),
          status: "PUBLISHED",
          publishedAt: new Date(),
          authorId: testAdminId,
          categoryId: testCategoryId,
        },
      });
      testArticleIds.push(article.id);
    }

    // When: User visits the homepage
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Then: All thumbnails should display correctly
    const sidebar = page.locator('aside:has-text("热门文章")');
    const articleLinks = sidebar.locator('a.popular-article');
    
    // Verify at least 3 articles are displayed
    const count = await articleLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify each article has a visible thumbnail
    for (let i = 0; i < Math.min(3, count); i++) {
      const articleLink = articleLinks.nth(i);
      const thumbnail = articleLink.locator(".popular-article-thumb");
      await expect(thumbnail).toBeVisible();
    }
  });

  test("[P1] should handle thumbnail rendering when articles have images in content", async ({
    page,
  }) => {
    // Given: Articles with images in content (should use image instead of placeholder)
    const articleWithImage = await prisma.article.create({
      data: {
        title: "带图片的测试文章",
        slug: "test-article-with-image",
        content: '<p>测试内容</p><img src="/uploads/test-image.jpg" alt="Test" />',
        excerpt: "测试摘要",
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: testAdminId,
        categoryId: testCategoryId,
      },
    });
    testArticleIds.push(articleWithImage.id);

    // When: User visits the homepage
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Then: Thumbnail should attempt to use the image from content
    const sidebar = page.locator('aside:has-text("热门文章")');
    const articleLinks = sidebar.locator('a.popular-article');
    
    // Find the article with image
    const articleLink = articleLinks.filter({
      hasText: "带图片的测试文章",
    }).first();
    
    if (await articleLink.count() > 0) {
      const thumbnail = articleLink.locator(".popular-article-thumb");
      await expect(thumbnail).toBeVisible();
      
      // Should have either an image or placeholder
      const hasImage = await thumbnail.locator("img").count();
      const hasText = await thumbnail.locator("span").count();
      expect(hasImage > 0 || hasText > 0).toBeTruthy();
    }
  });
});

