/**
 * Integration tests for deleteCommentAction Server Action.
 * 
 * Tests the delete comment functionality including:
 * - deleteCommentAction - Delete as admin
 * - deleteCommentAction - Delete as regular user (should fail)
 * - deleteCommentAction - Delete when not logged in (should fail)
 * - deleteCommentAction - Cascade delete behavior
 * - deleteCommentAction - Error handling
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

describe("deleteCommentAction Integration Tests", () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Delete as admin (AC-5.3.2)", () => {
    it("should successfully delete comment when user is admin", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "admin-1",
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

  describe("Delete as regular user (AC-5.3.4)", () => {
    it("should return FORBIDDEN error when regular user attempts to delete", async () => {
      // Mock regular user session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "user-1",
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

  describe("Delete when not logged in (AC-5.3.5)", () => {
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

  describe("Cascade delete (AC-5.3.3)", () => {
    it("should delete parent comment (cascade handled by Prisma schema)", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "admin-1",
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      // Mock parent comment exists
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: "comment-1",
      } as any);

      // Mock successful deletion
      // Note: Cascade delete is handled by Prisma schema (onDelete: Cascade)
      // When we delete the parent comment, Prisma automatically deletes all replies
      mockPrisma.comment.delete.mockResolvedValue({
        id: "comment-1",
      } as any);

      const result = await deleteCommentAction("comment-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("comment-1");
      }
      // We only need to delete the parent comment
      // Prisma will automatically delete all replies due to onDelete: Cascade
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: "comment-1" },
      });
    });
  });

  describe("Error handling", () => {
    it("should handle comment not found error", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "admin-1",
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
      expect(mockPrisma.comment.delete).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "admin-1",
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

