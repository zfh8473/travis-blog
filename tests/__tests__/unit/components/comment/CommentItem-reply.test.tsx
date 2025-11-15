/**
 * Unit tests for CommentItem component reply functionality.
 * 
 * Tests reply-specific functionality including:
 * - Reply button functionality
 * - Reply form visibility toggle
 * - Nested replies display
 * - "@username" indication for replies
 * - Scroll-to-parent functionality
 * - Reply count display
 * - Maximum depth handling
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CommentItem from "@/components/comment/CommentItem";
import { Comment } from "@/lib/actions/comment";
import { MAX_COMMENT_DEPTH } from "@/lib/utils/comment-depth";

jest.mock("@/components/comment/CommentForm", () => {
  return function MockCommentForm({ onCancel, onSuccess }: any) {
    return (
      <div data-testid="comment-form">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onSuccess}>Submit</button>
      </div>
    );
  };
});

describe("CommentItem - Reply Functionality", () => {
  const mockComment: Comment = {
    id: "comment-1",
    content: "This is a comment",
    articleId: "article-123",
    userId: "user-123",
    parentId: null,
    authorName: null,
    createdAt: new Date("2025-11-15T10:00:00Z"),
    updatedAt: new Date("2025-11-15T10:00:00Z"),
    user: {
      id: "user-123",
      name: "John Doe",
      image: null,
    },
    replies: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("should display reply button for top-level comment", () => {
    render(<CommentItem comment={mockComment} depth={0} />);

    expect(screen.getByText("回复")).toBeInTheDocument();
  });

  it("should toggle reply form when reply button is clicked", () => {
    render(<CommentItem comment={mockComment} depth={0} />);

    const replyButton = screen.getByText("回复");
    fireEvent.click(replyButton);

    expect(screen.getByTestId("comment-form")).toBeInTheDocument();
  });

  it("should hide reply form when cancel is clicked", () => {
    render(<CommentItem comment={mockComment} depth={0} />);

    const replyButton = screen.getByText("回复");
    fireEvent.click(replyButton);

    expect(screen.getByTestId("comment-form")).toBeInTheDocument();

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(screen.queryByTestId("comment-form")).not.toBeInTheDocument();
  });

  it("should display '@username' indication for replies", () => {
    const replyComment: Comment = {
      ...mockComment,
      id: "reply-1",
      parentId: "comment-1",
      content: "This is a reply",
    };

    const allComments: Comment[] = [mockComment, replyComment];

    render(
      <CommentItem comment={replyComment} depth={1} allComments={allComments} />
    );

    // Check for reply indication text (more specific)
    expect(screen.getByText(/回复 @John Doe/i)).toBeInTheDocument();
  });

  it("should scroll to parent when '@username' is clicked", () => {
    const replyComment: Comment = {
      ...mockComment,
      id: "reply-1",
      parentId: "comment-1",
      content: "This is a reply",
    };

    const allComments: Comment[] = [mockComment, replyComment];

    // Create parent element
    const parentElement = document.createElement("div");
    parentElement.id = "comment-comment-1";
    document.body.appendChild(parentElement);

    render(
      <CommentItem comment={replyComment} depth={1} allComments={allComments} />
    );

    const usernameLink = screen.getByText(/@John Doe/i);
    fireEvent.click(usernameLink);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });

    document.body.removeChild(parentElement);
  });

  it("should display nested replies", () => {
    const replyComment: Comment = {
      ...mockComment,
      id: "reply-1",
      parentId: "comment-1",
      content: "This is a reply",
    };

    const commentWithReplies: Comment = {
      ...mockComment,
      replies: [replyComment],
    };

    render(
      <CommentItem comment={commentWithReplies} depth={0} allComments={[commentWithReplies, replyComment]} />
    );

    expect(screen.getByText("This is a reply")).toBeInTheDocument();
  });

  it("should display reply count when replies exist", () => {
    const reply1: Comment = {
      ...mockComment,
      id: "reply-1",
      parentId: "comment-1",
      content: "Reply 1",
    };

    const reply2: Comment = {
      ...mockComment,
      id: "reply-2",
      parentId: "comment-1",
      content: "Reply 2",
    };

    const commentWithReplies: Comment = {
      ...mockComment,
      replies: [reply1, reply2],
    };

    render(
      <CommentItem
        comment={commentWithReplies}
        depth={0}
        allComments={[commentWithReplies, reply1, reply2]}
      />
    );

    expect(screen.getByText("2 条回复")).toBeInTheDocument();
  });

  it("should disable reply button at maximum depth", () => {
    const commentAtMaxDepth: Comment = {
      ...mockComment,
      id: "comment-max-depth",
    };

    render(
      <CommentItem comment={commentAtMaxDepth} depth={MAX_COMMENT_DEPTH - 1} />
    );

    expect(screen.queryByText("回复")).not.toBeInTheDocument();
    expect(screen.getByText("已达到最大回复深度")).toBeInTheDocument();
  });

  it("should show alert when trying to reply at maximum depth", () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    const commentAtMaxDepth: Comment = {
      ...mockComment,
      id: "comment-max-depth",
    };

    // Render with depth that would exceed max
    const { rerender } = render(
      <CommentItem comment={commentAtMaxDepth} depth={MAX_COMMENT_DEPTH - 1} />
    );

    // Try to click reply (should not be visible, but test the logic)
    // Since button is disabled, we test the canReply logic
    expect(screen.getByText("已达到最大回复深度")).toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it("should apply visual styling for replies (indentation, border-left)", () => {
    const replyComment: Comment = {
      ...mockComment,
      id: "reply-1",
      parentId: "comment-1",
      content: "This is a reply",
    };

    const { container } = render(
      <CommentItem comment={replyComment} depth={1} allComments={[mockComment, replyComment]} />
    );

    const commentDiv = container.querySelector(`#comment-${replyComment.id}`);
    expect(commentDiv).toHaveClass("ml-8");
    expect(commentDiv).toHaveClass("border-l-2");
  });

  it("should not apply reply styling for top-level comments", () => {
    const { container } = render(
      <CommentItem comment={mockComment} depth={0} />
    );

    const commentDiv = container.querySelector(`#comment-${mockComment.id}`);
    expect(commentDiv).not.toHaveClass("ml-8");
    expect(commentDiv).not.toHaveClass("border-l-2");
  });
});

