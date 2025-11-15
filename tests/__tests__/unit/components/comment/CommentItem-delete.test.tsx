/**
 * Unit tests for CommentItem delete button functionality.
 * 
 * Tests the delete button visibility and interaction:
 * - Delete button visibility (admin vs regular user)
 * - Confirmation dialog
 * - Deletion flow
 * - Error handling
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import CommentItem from "@/components/comment/CommentItem";
import { deleteCommentAction } from "@/lib/actions/comment";
import "@testing-library/jest-dom";

// Mock NextAuth route to avoid environment variable requirement
jest.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock deleteCommentAction
jest.mock("@/lib/actions/comment", () => ({
  ...jest.requireActual("@/lib/actions/comment"),
  deleteCommentAction: jest.fn(),
}));

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

// Mock window.location.reload
delete (window as any).location;
(window as any).location = { reload: jest.fn() };

describe("CommentItem Delete Button", () => {
  const mockComment = {
    id: "comment-1",
    content: "Test comment",
    articleId: "article-1",
    userId: "user-1",
    parentId: null,
    authorName: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    user: {
      id: "user-1",
      name: "Test User",
      image: null,
    },
    replies: [],
  };

  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
  const mockDeleteCommentAction = deleteCommentAction as jest.MockedFunction<typeof deleteCommentAction>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true); // Default to confirming deletion
  });

  afterAll(() => {
    // Restore original location
    (window as any).location = window.location;
  });

  describe("Delete button visibility (AC-5.3.1)", () => {
    it("should show delete button when user is admin", () => {
      // Mock admin session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "admin-1",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      } as any);

      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.getByRole("button", { name: /删除/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it("should not show delete button when user is not admin", () => {
      // Mock regular user session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "user-1",
            email: "user@example.com",
            name: "Regular User",
            role: "USER",
          },
        },
        status: "authenticated",
      } as any);

      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.queryByRole("button", { name: /删除/i });
      expect(deleteButton).not.toBeInTheDocument();
    });

    it("should not show delete button when user is not logged in", () => {
      // Mock no session
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      } as any);

      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.queryByRole("button", { name: /删除/i });
      expect(deleteButton).not.toBeInTheDocument();
    });
  });

  describe("Confirmation dialog (AC-5.3.2)", () => {
    it("should show confirmation dialog when delete button is clicked", () => {
      // Mock admin session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "admin-1",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      } as any);

      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.getByRole("button", { name: /删除/i });
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        "确定要删除这条留言吗？删除后无法恢复。"
      );
    });

    it("should show cascade warning when comment has replies", () => {
      // Mock admin session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "admin-1",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      } as any);

      const commentWithReplies = {
        ...mockComment,
        replies: [
          {
            id: "reply-1",
            content: "Reply 1",
            articleId: "article-1",
            userId: "user-2",
            parentId: "comment-1",
            authorName: null,
            createdAt: new Date("2024-01-01T01:00:00Z"),
            updatedAt: new Date("2024-01-01T01:00:00Z"),
            user: {
              id: "user-2",
              name: "Reply User",
              image: null,
            },
            replies: [],
          },
        ],
      };

      render(<CommentItem comment={commentWithReplies} />);

      const deleteButton = screen.getByRole("button", { name: /删除/i });
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining("此留言有 1 条回复，删除后所有回复也将被删除")
      );
    });

    it("should not delete comment if user cancels confirmation", async () => {
      // Mock admin session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "admin-1",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      } as any);

      // Mock user cancels
      mockConfirm.mockReturnValue(false);

      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.getByRole("button", { name: /删除/i });
      fireEvent.click(deleteButton);

      expect(mockDeleteCommentAction).not.toHaveBeenCalled();
    });
  });

  describe("Deletion flow (AC-5.3.2)", () => {
    it("should delete comment successfully when confirmed", async () => {
      // Mock admin session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "admin-1",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      } as any);

      // Mock successful deletion
      mockDeleteCommentAction.mockResolvedValue({
        success: true,
        data: { id: "comment-1" },
      });

      // Mock alert
      const mockAlert = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.getByRole("button", { name: /删除/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteCommentAction).toHaveBeenCalledWith("comment-1");
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("留言删除成功！");
      });

      expect(window.location.reload).toHaveBeenCalled();

      mockAlert.mockRestore();
    });

    it("should show loading state while deleting", async () => {
      // Mock admin session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "admin-1",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      } as any);

      // Mock slow deletion
      mockDeleteCommentAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: { id: "comment-1" } }), 100))
      );

      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.getByRole("button", { name: /删除/i });
      fireEvent.click(deleteButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /删除中/i })).toBeInTheDocument();
      });
    });
  });

  describe("Error handling (AC-5.3.4, AC-5.3.5)", () => {
    it("should show error message when deletion fails", async () => {
      // Mock admin session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "admin-1",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      } as any);

      // Mock deletion failure
      mockDeleteCommentAction.mockResolvedValue({
        success: false,
        error: {
          message: "您没有权限执行此操作",
          code: "FORBIDDEN",
        },
      });

      // Mock alert
      const mockAlert = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.getByRole("button", { name: /删除/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteCommentAction).toHaveBeenCalledWith("comment-1");
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("您没有权限执行此操作");
      });

      expect(window.location.reload).not.toHaveBeenCalled();

      mockAlert.mockRestore();
    });

    it("should show error message when network error occurs", async () => {
      // Mock admin session
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "admin-1",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      } as any);

      // Mock network error
      mockDeleteCommentAction.mockRejectedValue(new Error("Network error"));

      // Mock alert
      const mockAlert = jest.spyOn(window, "alert").mockImplementation(() => {});

      render(<CommentItem comment={mockComment} />);

      const deleteButton = screen.getByRole("button", { name: /删除/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteCommentAction).toHaveBeenCalledWith("comment-1");
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("删除留言失败，请重试。");
      });

      mockAlert.mockRestore();
    });
  });
});

