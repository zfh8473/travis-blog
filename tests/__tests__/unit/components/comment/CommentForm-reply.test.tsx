/**
 * Unit tests for CommentForm component in reply mode.
 * 
 * Tests reply-specific functionality including:
 * - Visual indication for reply mode
 * - Cancel button functionality
 * - Inline form styling
 * - Reply submission
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession } from "next-auth/react";
import CommentForm from "@/components/comment/CommentForm";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("@/lib/actions/comment", () => ({
  createCommentAction: jest.fn(),
}));

jest.mock("@/lib/validations/comment", () => ({
  createCommentSchema: {
    safeParse: jest.fn(),
  },
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const { createCommentAction } = require("@/lib/actions/comment");
const { createCommentSchema } = require("@/lib/validations/comment");

describe("CommentForm - Reply Mode", () => {
  const originalLocation = window.location;

  beforeAll(() => {
    delete (window as any).location;
    (window as any).location = { reload: jest.fn() };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display reply mode indication when isReply is true", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    } as any);

    render(
      <CommentForm
        articleId="article-123"
        parentId="comment-456"
        parentAuthorName="John Doe"
        isReply={true}
        onCancel={() => {}}
      />
    );

    // Check for reply indication text (more specific to avoid multiple matches)
    expect(screen.getByText(/回复 @John Doe/i)).toBeInTheDocument();
  });

  it("should display cancel button in reply mode", () => {
    const onCancel = jest.fn();

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    } as any);

    render(
      <CommentForm
        articleId="article-123"
        parentId="comment-456"
        parentAuthorName="John Doe"
        isReply={true}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByText("取消");
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should not display cancel button when onCancel is not provided", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    } as any);

    render(
      <CommentForm
        articleId="article-123"
        parentId="comment-456"
        parentAuthorName="John Doe"
        isReply={true}
      />
    );

    expect(screen.queryByText("取消")).not.toBeInTheDocument();
  });

  it("should apply inline styling in reply mode", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    } as any);

    const { container } = render(
      <CommentForm
        articleId="article-123"
        parentId="comment-456"
        parentAuthorName="John Doe"
        isReply={true}
        onCancel={() => {}}
      />
    );

    const form = container.querySelector("form");
    expect(form).toHaveClass("ml-8");
    expect(form).toHaveClass("border-l-2");
  });

  it("should submit reply successfully", async () => {
    const onSuccess = jest.fn();

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    } as any);

    createCommentSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        content: "This is a reply",
        articleId: "article-123",
        parentId: "comment-456",
        userId: "user-123",
      },
    });

    createCommentAction.mockResolvedValue({
      success: true,
      data: {
        id: "reply-789",
        content: "This is a reply",
        articleId: "article-123",
        parentId: "comment-456",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    render(
      <CommentForm
        articleId="article-123"
        parentId="comment-456"
        parentAuthorName="John Doe"
        isReply={true}
        onSuccess={onSuccess}
        onCancel={() => {}}
      />
    );

    const textarea = screen.getByLabelText(/留言内容/i);
    fireEvent.change(textarea, { target: { value: "This is a reply" } });

    const submitButton = screen.getByText("提交回复");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createCommentAction).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: "comment-456",
        })
      );
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("should show '提交回复' button text in reply mode", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    } as any);

    render(
      <CommentForm
        articleId="article-123"
        parentId="comment-456"
        parentAuthorName="John Doe"
        isReply={true}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText("提交回复")).toBeInTheDocument();
    expect(screen.queryByText("提交留言")).not.toBeInTheDocument();
  });

  it("should show '提交留言' button text in non-reply mode", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    } as any);

    render(<CommentForm articleId="article-123" />);

    expect(screen.getByText("提交留言")).toBeInTheDocument();
    expect(screen.queryByText("提交回复")).not.toBeInTheDocument();
  });
});

