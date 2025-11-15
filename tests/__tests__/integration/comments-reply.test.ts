/**
 * Integration tests for comment reply Server Actions.
 * 
 * Tests the reply functionality including:
 * - createCommentAction - Create reply as logged-in user
 * - createCommentAction - Create reply as anonymous user
 * - createCommentAction - Validation errors (parent comment not found, wrong article)
 * - createCommentAction - Nesting depth validation
 * - getCommentsAction - Nested replies display (multi-level)
 * 
 * Note: These tests mock Prisma and NextAuth to test Server Action logic
 * without requiring a database connection.
 */

import { createCommentAction, getCommentsAction } from "@/lib/actions/comment";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { MAX_COMMENT_DEPTH } from "@/lib/utils/comment-depth";

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
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
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

describe("Comment Reply Server Actions Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCommentAction - Reply Functionality", () => {
    it("should create reply as logged-in user", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      };

      const mockArticle = {
        id: "article-123",
      };

      const mockParentComment = {
        id: "comment-456",
        articleId: "article-123",
        parentId: null,
      };

      const mockReply = {
        id: "reply-789",
        content: "Great comment!",
        articleId: "article-123",
        userId: "user-123",
        parentId: "comment-456",
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
      (prisma.comment.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockParentComment) // First call for parent
        .mockResolvedValueOnce(null); // Second call for depth check (parent has no parent)
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockReply);

      const result = await createCommentAction({
        content: "Great comment!",
        articleId: "article-123",
        parentId: "comment-456",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Great comment!");
        expect(result.data.parentId).toBe("comment-456");
        expect(result.data.userId).toBe("user-123");
      }

      expect(prisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: "comment-456" },
        select: {
          id: true,
          articleId: true,
          parentId: true,
        },
      });
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: "Great comment!",
          articleId: "article-123",
          userId: "user-123",
          parentId: "comment-456",
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

    it("should create reply as anonymous user", async () => {
      const mockArticle = {
        id: "article-123",
      };

      const mockParentComment = {
        id: "comment-456",
        articleId: "article-123",
        parentId: null,
      };

      const mockReply = {
        id: "reply-789",
        content: "I agree!",
        articleId: "article-123",
        userId: null,
        parentId: "comment-456",
        authorName: "Anonymous Reply",
        createdAt: new Date("2025-11-15T10:00:00Z"),
        updatedAt: new Date("2025-11-15T10:00:00Z"),
        user: null,
      };

      (getServerSession as jest.Mock).mockResolvedValue(null);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockParentComment)
        .mockResolvedValueOnce(null);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockReply);

      const result = await createCommentAction({
        content: "I agree!",
        articleId: "article-123",
        parentId: "comment-456",
        userId: null,
        authorName: "Anonymous Reply",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("I agree!");
        expect(result.data.parentId).toBe("comment-456");
        expect(result.data.userId).toBeNull();
        expect(result.data.authorName).toBe("Anonymous Reply");
      }
    });

    it("should return error when parent comment not found", async () => {
      const mockArticle = {
        id: "article-123",
      };

      (getServerSession as jest.Mock).mockResolvedValue(null);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await createCommentAction({
        content: "Reply to non-existent comment",
        articleId: "article-123",
        parentId: "non-existent-comment",
        userId: null,
        authorName: "Anonymous",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("PARENT_COMMENT_NOT_FOUND");
        expect(result.error.message).toBe("Parent comment not found");
      }

      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should return error when parent comment belongs to different article", async () => {
      const mockArticle = {
        id: "article-123",
      };

      const mockParentComment = {
        id: "comment-456",
        articleId: "article-999", // Different article
        parentId: null,
      };

      (getServerSession as jest.Mock).mockResolvedValue(null);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(mockParentComment);

      const result = await createCommentAction({
        content: "Reply to comment from different article",
        articleId: "article-123",
        parentId: "comment-456",
        userId: null,
        authorName: "Anonymous",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_PARENT_COMMENT");
        expect(result.error.message).toBe("Parent comment does not belong to this article");
      }

      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should return error when maximum nesting depth is exceeded", async () => {
      const mockArticle = {
        id: "article-123",
      };

      // Create a chain of parent comments at max depth
      const depth2Parent = {
        id: "comment-depth-2",
        articleId: "article-123",
        parentId: "comment-depth-1",
      };

      const depth1Parent = {
        id: "comment-depth-1",
        articleId: "article-123",
        parentId: "comment-depth-0",
      };

      const depth0Parent = {
        id: "comment-depth-0",
        articleId: "article-123",
        parentId: null,
      };

      (getServerSession as jest.Mock).mockResolvedValue(null);
      (prisma.article.findUnique as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.comment.findUnique as jest.Mock)
        .mockResolvedValueOnce(depth2Parent) // First call: get parent comment
        .mockResolvedValueOnce(depth1Parent) // Second call: get depth-1 parent
        .mockResolvedValueOnce(depth0Parent) // Third call: get depth-0 parent
        .mockResolvedValueOnce(null); // Fourth call: depth-0 has no parent

      const result = await createCommentAction({
        content: "Reply at max depth",
        articleId: "article-123",
        parentId: "comment-depth-2",
        userId: null,
        authorName: "Anonymous",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("MAX_DEPTH_EXCEEDED");
        expect(result.error.message).toContain("最大回复深度");
        expect(result.error.message).toContain(MAX_COMMENT_DEPTH.toString());
      }

      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it("should allow reply at depth less than maximum", async () => {
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
      };

      const mockArticle = {
        id: "article-123",
      };

      // Parent at depth 1 (one level deep)
      const mockParentComment = {
        id: "comment-depth-1",
        articleId: "article-123",
        parentId: "comment-depth-0",
      };

      const depth0Parent = {
        id: "comment-depth-0",
        articleId: "article-123",
        parentId: null,
      };

      const mockReply = {
        id: "reply-789",
        content: "Reply at depth 2",
        articleId: "article-123",
        userId: "user-123",
        parentId: "comment-depth-1",
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
      (prisma.comment.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockParentComment)
        .mockResolvedValueOnce(depth0Parent)
        .mockResolvedValueOnce(null);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockReply);

      const result = await createCommentAction({
        content: "Reply at depth 2",
        articleId: "article-123",
        parentId: "comment-depth-1",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      expect(prisma.comment.create).toHaveBeenCalled();
    });
  });

  describe("getCommentsAction - Nested Replies", () => {
    it("should return comments with multi-level nested replies", async () => {
      const mockComments = [
        {
          id: "comment-1",
          content: "Top-level comment",
          articleId: "article-123",
          userId: "user-123",
          parentId: null,
          authorName: null,
          createdAt: new Date("2025-11-15T10:00:00Z"),
          updatedAt: new Date("2025-11-15T10:00:00Z"),
          user: {
            id: "user-123",
            name: "User 1",
            image: null,
          },
        },
        {
          id: "reply-1",
          content: "First-level reply",
          articleId: "article-123",
          userId: "user-456",
          parentId: "comment-1",
          authorName: null,
          createdAt: new Date("2025-11-15T10:15:00Z"),
          updatedAt: new Date("2025-11-15T10:15:00Z"),
          user: {
            id: "user-456",
            name: "User 2",
            image: null,
          },
        },
        {
          id: "reply-2",
          content: "Second-level reply",
          articleId: "article-123",
          userId: null,
          parentId: "reply-1",
          authorName: "Anonymous",
          createdAt: new Date("2025-11-15T10:30:00Z"),
          updatedAt: new Date("2025-11-15T10:30:00Z"),
          user: null,
        },
      ];

      (prisma.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

      const result = await getCommentsAction("article-123");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("comment-1");
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies![0].id).toBe("reply-1");
      expect(result[0].replies![0].replies).toHaveLength(1);
      expect(result[0].replies![0].replies![0].id).toBe("reply-2");
    });

    it("should sort top-level comments by creation time (newest first)", async () => {
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
            name: "User 1",
            image: null,
          },
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
            name: "User 1",
            image: null,
          },
        },
      ];

      (prisma.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

      const result = await getCommentsAction("article-123");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("comment-2"); // Newer first
      expect(result[1].id).toBe("comment-1"); // Older second
    });

    it("should sort replies by creation time (oldest first)", async () => {
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
            name: "User 1",
            image: null,
          },
        },
        {
          id: "reply-2",
          content: "Newer reply",
          articleId: "article-123",
          userId: "user-456",
          parentId: "comment-1",
          authorName: null,
          createdAt: new Date("2025-11-15T10:30:00Z"),
          updatedAt: new Date("2025-11-15T10:30:00Z"),
          user: {
            id: "user-456",
            name: "User 2",
            image: null,
          },
        },
        {
          id: "reply-1",
          content: "Older reply",
          articleId: "article-123",
          userId: "user-456",
          parentId: "comment-1",
          authorName: null,
          createdAt: new Date("2025-11-15T10:15:00Z"),
          updatedAt: new Date("2025-11-15T10:15:00Z"),
          user: {
            id: "user-456",
            name: "User 2",
            image: null,
          },
        },
      ];

      (prisma.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

      const result = await getCommentsAction("article-123");

      expect(result).toHaveLength(1);
      expect(result[0].replies).toHaveLength(2);
      // Replies should be sorted oldest first
      expect(result[0].replies![0].id).toBe("reply-1");
      expect(result[0].replies![1].id).toBe("reply-2");
    });
  });
});

