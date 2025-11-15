/**
 * Unit tests for deleteCommentAction Server Action.
 * 
 * Tests the delete comment functionality including:
 * - Successful deletion (admin user)
 * - Permission denied (regular user)
 * - Unauthorized (not logged in)
 * - Comment not found
 * - Cascade delete (parent comment with replies)
 * 
 * Note: These tests mock Prisma and NextAuth to test Server Action logic
 * without requiring a database connection.
 */

import { deleteCommentAction } from "@/lib/actions/comment";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";

// Mock NextAuth route to avoid environment variable requirement
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

// Mock Prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    comment: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

describe("deleteCommentAction", () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Successful deletion (admin user)", () => {
    it("should delete comment successfully when user is admin", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      // Mock comment exists
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: "comment-1",
      } as any);

      // Mock successful deletion
      mockPrisma.comment.delete.mockResolvedValue({
        id: "comment-1",
      } as any);

      const result = await deleteCommentAction("comment-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("comment-1");
      }
      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: "comment-1" },
        select: { id: true },
      });
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: "comment-1" },
      });
    });
  });

  describe("Permission denied (regular user)", () => {
    it("should return FORBIDDEN error when user is not admin", async () => {
      // Mock regular user session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "user-2",
          email: "user@example.com",
          name: "Regular User",
          role: "USER",
        },
      } as any);

      const result = await deleteCommentAction("comment-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("FORBIDDEN");
        expect(result.error.message).toBe("您没有权限执行此操作");
      }
      expect(mockPrisma.comment.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.comment.delete).not.toHaveBeenCalled();
    });
  });

  describe("Unauthorized (not logged in)", () => {
    it("should return UNAUTHORIZED error when user is not logged in", async () => {
      // Mock no session
      mockGetServerSession.mockResolvedValue(null);

      const result = await deleteCommentAction("comment-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("UNAUTHORIZED");
        expect(result.error.message).toBe("请先登录");
      }
      expect(mockPrisma.comment.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.comment.delete).not.toHaveBeenCalled();
    });
  });

  describe("Comment not found", () => {
    it("should return COMMENT_NOT_FOUND error when comment does not exist", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      // Mock comment does not exist
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      const result = await deleteCommentAction("comment-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("COMMENT_NOT_FOUND");
        expect(result.error.message).toBe("Comment not found");
      }
      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: "comment-1" },
        select: { id: true },
      });
      expect(mockPrisma.comment.delete).not.toHaveBeenCalled();
    });
  });

  describe("Cascade delete (parent comment with replies)", () => {
    it("should delete parent comment (cascade delete handled by Prisma)", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      // Mock parent comment exists
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: "comment-1",
      } as any);

      // Mock successful deletion (cascade handled by Prisma)
      mockPrisma.comment.delete.mockResolvedValue({
        id: "comment-1",
      } as any);

      const result = await deleteCommentAction("comment-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("comment-1");
      }
      // Note: Cascade delete is handled by Prisma schema (onDelete: Cascade)
      // We only need to delete the parent comment, and Prisma will automatically
      // delete all replies due to the schema configuration
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: "comment-1" },
      });
    });
  });

  describe("Input validation", () => {
    it("should return INVALID_INPUT error when commentId is empty", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      const result = await deleteCommentAction("");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_INPUT");
        expect(result.error.message).toBe("Comment ID is required");
      }
      expect(mockPrisma.comment.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.comment.delete).not.toHaveBeenCalled();
    });

    it("should return INVALID_INPUT error when commentId is not a string", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      // @ts-expect-error - Testing invalid input
      const result = await deleteCommentAction(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_INPUT");
      }
      expect(mockPrisma.comment.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.comment.delete).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "user-1",
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      // Mock comment exists
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: "comment-1",
      } as any);

      // Mock database error
      mockPrisma.comment.delete.mockRejectedValue(new Error("Database connection failed"));

      const result = await deleteCommentAction("comment-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INTERNAL_ERROR");
        expect(result.error.message).toBe("Database connection failed");
      }
    });
  });
});

