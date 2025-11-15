/**
 * Integration tests for comment Server Actions.
 * 
 * Tests the comment creation and retrieval Server Actions including:
 * - createCommentAction - Create comment as logged-in user
 * - createCommentAction - Create comment as anonymous user
 * - createCommentAction - Validation errors (empty content, too long)
 * - getCommentsAction - Get comments for article
 * - getCommentsAction - Comment sorting
 * 
 * Note: These tests mock Prisma and NextAuth to test Server Action logic
 * without requiring a database connection.
 */

import { createCommentAction, getCommentsAction } from "@/lib/actions/comment";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";

// Mock NextAuth route to avoid environment variable requirement
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

// Mock Prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    article: {
      findUnique: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock DOMPurify
jest.mock("isomorphic-dompurify", () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((content: string) => content),
  },
}));

describe("Comment Server Actions Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCommentAction", () => {
    it("should create comment as logged-in user", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      const mockArticle = {
        id: "article-123",
      };

      const mockComment = {
        id: "comment-123",
        content: "Great article!",
        articleId: "article-123",
        userId: "user-123",
        parentId: null,
        authorName: null,
        createdAt: new Date("2025-11-15T10:00:00Z"),
        updatedAt: new Date("2025-11-15T10:00:00Z"),
        user: {
          id: "user-123",
          name: "Test User",
          image: "https://example.com/avatar.jpg",
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: mockUser,
      });
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const result = await createCommentAction({
        content: "Great article!",
        articleId: "article-123",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Great article!");
        expect(result.data.userId).toBe("user-123");
        expect(result.data.user?.name).toBe("Test User");
        expect(result.data.authorName).toBeNull();
      }

      expect(prisma.article.findUnique).toHaveBeenCalledWith({
        where: { id: "article-123" },
        select: { id: true },
      });
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: "Great article!",
          articleId: "article-123",
          userId: "user-123",
          parentId: null,
          authorName: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    });

    it("should create comment as anonymous user", async () => {
      const mockArticle = {
        id: "article-123",
      };

      const mockComment = {
        id: "comment-456",
        content: "Nice post!",
        articleId: "article-123",
        userId: null,
        parentId: null,
        authorName: "Anonymous User",
        createdAt: new Date("2025-11-15T10:00:00Z"),
        updatedAt: new Date("2025-11-15T10:00:00Z"),
        user: null,
      };

      (getServerSession as jest.Mock).mockResolvedValue(null);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const result = await createCommentAction({
        content: "Nice post!",
        articleId: "article-123",
        userId: null,
        authorName: "Anonymous User",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Nice post!");
        expect(result.data.userId).toBeNull();
        expect(result.data.authorName).toBe("Anonymous User");
        expect(result.data.user).toBeNull();
      }

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: "Nice post!",
          articleId: "article-123",
          userId: null,
          parentId: null,
          authorName: "Anonymous User",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });
    });

    it("should return validation error for empty content", async () => {
      const result = await createCommentAction({
        content: "",
        articleId: "article-123",
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("required");
      }

      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should return validation error for content exceeding 5000 characters", async () => {
      const longContent = "a".repeat(5001);

      const result = await createCommentAction({
        content: longContent,
        articleId: "article-123",
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("5000");
      }

      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should return validation error for anonymous comment without authorName", async () => {
      const result = await createCommentAction({
        content: "Comment without name",
        articleId: "article-123",
        userId: null,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("姓名");
      }

      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should return error when article not found", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user-123" },
      });
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await createCommentAction({
        content: "Great article!",
        articleId: "non-existent-article",
        userId: "user-123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("ARTICLE_NOT_FOUND");
        expect(result.error.message).toBe("Article not found");
      }

      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should sanitize HTML content to prevent XSS", async () => {
      const DOMPurify = require("isomorphic-dompurify");
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      };

      const mockArticle = {
        id: "article-123",
      };

      const mockComment = {
        id: "comment-123",
        content: "<script>alert('xss')</script>",
        articleId: "article-123",
        userId: "user-123",
        parentId: null,
        authorName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user-123",
          name: "Test User",
          image: null,
        },
      };

      (getServerSession as jest.Mock).mockResolvedValue({
        user: mockUser,
      });
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);
      DOMPurify.default.sanitize.mockReturnValue(""); // DOMPurify removes script tags

      await createCommentAction({
        content: "<script>alert('xss')</script>",
        articleId: "article-123",
        userId: "user-123",
      });

      expect(DOMPurify.default.sanitize).toHaveBeenCalledWith(
        "<script>alert('xss')</script>",
        {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
        }
      );
    });
  });

  describe("getCommentsAction", () => {
    it("should get comments for article", async () => {
      const mockComments = [
        {
          id: "comment-1",
          content: "First comment",
          articleId: "article-123",
          userId: "user-123",
          parentId: null,
          authorName: null,
          createdAt: new Date("2025-11-15T10:00:00Z"),
          updatedAt: new Date("2025-11-15T10:00:00Z"),
          user: {
            id: "user-123",
            name: "Test User",
            image: null,
          },
          replies: [],
        },
        {
          id: "comment-2",
          content: "Second comment",
          articleId: "article-123",
          userId: null,
          parentId: null,
          authorName: "Anonymous User",
          createdAt: new Date("2025-11-15T09:00:00Z"),
          updatedAt: new Date("2025-11-15T09:00:00Z"),
          user: null,
          replies: [],
        },
      ];

      (prisma.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

      const result = await getCommentsAction("article-123");

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("First comment");
      expect(result[0].user?.name).toBe("Test User");
      expect(result[1].content).toBe("Second comment");
      expect(result[1].authorName).toBe("Anonymous User");
      expect(result[1].user).toBeNull();

      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: {
          articleId: "article-123",
          parentId: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return empty array when article has no comments", async () => {
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getCommentsAction("article-123");

      expect(result).toHaveLength(0);
    });

    it("should sort comments by creation time (newest first)", async () => {
      const mockComments = [
        {
          id: "comment-2",
          content: "Newer comment",
          articleId: "article-123",
          userId: "user-123",
          parentId: null,
          authorName: null,
          createdAt: new Date("2025-11-15T10:00:00Z"),
          updatedAt: new Date("2025-11-15T10:00:00Z"),
          user: {
            id: "user-123",
            name: "Test User",
            image: null,
          },
          replies: [],
        },
        {
          id: "comment-1",
          content: "Older comment",
          articleId: "article-123",
          userId: "user-123",
          parentId: null,
          authorName: null,
          createdAt: new Date("2025-11-15T09:00:00Z"),
          updatedAt: new Date("2025-11-15T09:00:00Z"),
          user: {
            id: "user-123",
            name: "Test User",
            image: null,
          },
          replies: [],
        },
      ];

      (prisma.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

      const result = await getCommentsAction("article-123");

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Newer comment");
      expect(result[1].content).toBe("Older comment");

      // Verify sorting order
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        })
      );
    });

    it("should include nested replies sorted by creation time (oldest first)", async () => {
      const mockComments = [
        {
          id: "comment-1",
          content: "Parent comment",
          articleId: "article-123",
          userId: "user-123",
          parentId: null,
          authorName: null,
          createdAt: new Date("2025-11-15T10:00:00Z"),
          updatedAt: new Date("2025-11-15T10:00:00Z"),
          user: {
            id: "user-123",
            name: "Test User",
            image: null,
          },
          replies: [
            {
              id: "reply-1",
              content: "First reply (older)",
              articleId: "article-123",
              userId: "user-456",
              parentId: "comment-1",
              authorName: null,
              createdAt: new Date("2025-11-15T10:15:00Z"), // Older
              updatedAt: new Date("2025-11-15T10:15:00Z"),
              user: {
                id: "user-456",
                name: "Reply User",
                image: null,
              },
            },
            {
              id: "reply-2",
              content: "Second reply (newer)",
              articleId: "article-123",
              userId: null,
              parentId: "comment-1",
              authorName: "Anonymous Reply",
              createdAt: new Date("2025-11-15T10:30:00Z"), // Newer
              updatedAt: new Date("2025-11-15T10:30:00Z"),
              user: null,
            },
          ],
        },
      ];

      (prisma.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

      const result = await getCommentsAction("article-123");

      expect(result).toHaveLength(1);
      expect(result[0].replies).toHaveLength(2);
      // Replies should be sorted oldest first (asc) - so older reply comes first
      expect(result[0].replies![0].content).toBe("First reply (older)");
      expect(result[0].replies![1].content).toBe("Second reply (newer)");
    });

    it("should return empty array for invalid articleId", async () => {
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getCommentsAction("");

      expect(result).toHaveLength(0);
    });

    it("should handle database errors gracefully", async () => {
      (prisma.comment.findMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getCommentsAction("article-123");

      expect(result).toHaveLength(0);
    });
  });
});

