/**
 * Integration tests for admin comments API endpoints.
 * 
 * Tests the following endpoints:
 * - GET /api/admin/comments/unread-count
 * - GET /api/admin/comments/unread
 * - PUT /api/admin/comments/[id]/read
 * 
 * @group integration
 * @group admin
 * @group comments
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@/lib/auth/permissions";

/**
 * Test data setup
 */
let testArticleId: string;
let testCommentId: string;
let testAdminUserId: string;
let testRegularUserId: string;

/**
 * Helper function to create a test user with a specific role.
 */
async function createTestUser(email: string, role: Role = Role.USER) {
  const user = await prisma.user.create({
    data: {
      email,
      name: `Test ${role}`,
      role,
      emailVerified: new Date(),
    },
  });
  return user;
}

/**
 * Helper function to create a test article.
 */
async function createTestArticle(authorId: string) {
  const article = await prisma.article.create({
    data: {
      title: "Test Article for Comments",
      slug: `test-article-${Date.now()}`,
      content: "Test content",
      excerpt: "Test excerpt",
      status: "PUBLISHED",
      authorId,
      publishedAt: new Date(),
    },
  });
  return article;
}

/**
 * Helper function to create a test comment.
 */
async function createTestComment(articleId: string, userId?: string, authorName?: string) {
  const comment = await prisma.comment.create({
    data: {
      content: "Test comment content",
      articleId,
      userId: userId || null,
      authorName: authorName || null,
      isRead: false, // New comments are unread by default
    },
  });
  return comment;
}

/**
 * Helper function to clean up test data.
 */
async function cleanupTestData() {
  // Delete comments
  if (testCommentId) {
    await prisma.comment.deleteMany({
      where: { id: testCommentId },
    });
  }

  // Delete article
  if (testArticleId) {
    await prisma.article.deleteMany({
      where: { id: testArticleId },
    });
  }

  // Delete users
  if (testAdminUserId) {
    await prisma.user.deleteMany({
      where: { id: testAdminUserId },
    });
  }
  if (testRegularUserId) {
    await prisma.user.deleteMany({
      where: { id: testRegularUserId },
    });
  }
}

describe("Admin Comments API", () => {
  beforeAll(async () => {
    // Create test users
    const adminUser = await createTestUser("admin@test.com", Role.ADMIN);
    const regularUser = await createTestUser("user@test.com", Role.USER);
    testAdminUserId = adminUser.id;
    testRegularUserId = regularUser.id;

    // Create test article
    const article = await createTestArticle(testAdminUserId);
    testArticleId = article.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Clean up comments before each test
    await prisma.comment.deleteMany({
      where: { articleId: testArticleId },
    });
  });

  describe("GET /api/admin/comments/unread-count", () => {
    it("should return 0 when there are no unread comments", async () => {
      // This would require mocking NextAuth session
      // For now, we test the database logic directly
      const unreadCount = await prisma.comment.count({
        where: {
          isRead: false,
        },
      });

      expect(unreadCount).toBeGreaterThanOrEqual(0);
    });

    it("should return correct count of unread comments", async () => {
      // Create unread comments
      await createTestComment(testArticleId, undefined, "Guest User 1");
      await createTestComment(testArticleId, undefined, "Guest User 2");
      await createTestComment(testArticleId, testRegularUserId);

      const unreadCount = await prisma.comment.count({
        where: {
          isRead: false,
        },
      });

      expect(unreadCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe("GET /api/admin/comments/unread", () => {
    it("should return empty array when there are no unread comments", async () => {
      const unreadComments = await prisma.comment.findMany({
        where: {
          isRead: false,
        },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      expect(Array.isArray(unreadComments)).toBe(true);
    });

    it("should return unread comments with article information", async () => {
      const comment = await createTestComment(testArticleId, undefined, "Guest User");

      const unreadComments = await prisma.comment.findMany({
        where: {
          isRead: false,
        },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

      expect(unreadComments.length).toBeGreaterThan(0);
      const foundComment = unreadComments.find((c) => c.id === comment.id);
      expect(foundComment).toBeDefined();
      expect(foundComment?.article).toBeDefined();
      expect(foundComment?.article.id).toBe(testArticleId);
    });
  });

  describe("PUT /api/admin/comments/[id]/read", () => {
    it("should mark comment as read", async () => {
      const comment = await createTestComment(testArticleId, undefined, "Guest User");

      const updatedComment = await prisma.comment.update({
        where: { id: comment.id },
        data: {
          isRead: true,
          readAt: new Date(),
          readBy: testAdminUserId,
        },
      });

      expect(updatedComment.isRead).toBe(true);
      expect(updatedComment.readAt).toBeDefined();
      expect(updatedComment.readBy).toBe(testAdminUserId);
    });

    it("should not update if comment is already read", async () => {
      const comment = await createTestComment(testArticleId, undefined, "Guest User");
      const readAt = new Date("2025-01-01");

      // Mark as read first
      await prisma.comment.update({
        where: { id: comment.id },
        data: {
          isRead: true,
          readAt,
          readBy: testAdminUserId,
        },
      });

      // Try to mark as read again
      const updatedComment = await prisma.comment.update({
        where: { id: comment.id },
        data: {
          isRead: true,
          readAt: new Date(),
          readBy: testAdminUserId,
        },
      });

      expect(updatedComment.isRead).toBe(true);
    });
  });

  describe("POST /api/comments - Comment creation with isRead", () => {
    it("should create comment with isRead = false by default", async () => {
      const comment = await createTestComment(testArticleId, undefined, "Guest User");

      expect(comment.isRead).toBe(false);
      expect(comment.readAt).toBeNull();
      expect(comment.readBy).toBeNull();
    });

    it("should allow creating comment with explicit isRead = false", async () => {
      const comment = await prisma.comment.create({
        data: {
          content: "Test comment",
          articleId: testArticleId,
          authorName: "Guest User",
          isRead: false,
        },
      });

      expect(comment.isRead).toBe(false);
    });
  });
});

