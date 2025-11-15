import { render, screen } from "@testing-library/react";
import CommentItem from "@/components/comment/CommentItem";

describe("CommentItem", () => {
  it("should render comment with logged-in user information", () => {
    const comment = {
      id: "comment-1",
      content: "Great article!",
      articleId: "article-123",
      userId: "user-456",
      parentId: null,
      authorName: null,
      createdAt: new Date("2025-11-14T10:00:00Z"),
      updatedAt: new Date("2025-11-14T10:00:00Z"),
      user: {
        id: "user-456",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
      },
    };

    render(<CommentItem comment={comment} />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Great article!")).toBeInTheDocument();
    expect(screen.getByText(/回复/i)).toBeInTheDocument();
    expect(screen.getByAltText("Test User")).toBeInTheDocument();
  });

  it("should render comment with anonymous user information", () => {
    const comment = {
      id: "comment-2",
      content: "Nice post!",
      articleId: "article-123",
      userId: null,
      parentId: null,
      authorName: "Anonymous User",
      createdAt: new Date("2025-11-14T10:00:00Z"),
      updatedAt: new Date("2025-11-14T10:00:00Z"),
      user: null,
    };

    render(<CommentItem comment={comment} />);

    expect(screen.getByText("Anonymous User")).toBeInTheDocument();
    expect(screen.getByText("Nice post!")).toBeInTheDocument();
    expect(screen.getByText(/回复/i)).toBeInTheDocument();
    // Should show initial letter avatar for anonymous users
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("should render comment without avatar for anonymous user", () => {
    const comment = {
      id: "comment-3",
      content: "Another comment",
      articleId: "article-123",
      userId: null,
      parentId: null,
      authorName: "Guest",
      createdAt: new Date("2025-11-14T10:00:00Z"),
      updatedAt: new Date("2025-11-14T10:00:00Z"),
      user: null,
    };

    render(<CommentItem comment={comment} />);

    expect(screen.getByText("Guest")).toBeInTheDocument();
    // Should show initial letter "G" in avatar
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("should format timestamp correctly", () => {
    const comment = {
      id: "comment-4",
      content: "Test comment",
      articleId: "article-123",
      userId: "user-456",
      parentId: null,
      authorName: null,
      createdAt: new Date("2025-11-14T10:30:00Z"),
      updatedAt: new Date("2025-11-14T10:30:00Z"),
      user: {
        id: "user-456",
        name: "Test User",
        image: null,
      },
    };

    render(<CommentItem comment={comment} />);

    // Should display formatted date
    expect(screen.getByText(/2025年11月14日/i)).toBeInTheDocument();
  });

  it("should handle long comment content with word wrap", () => {
    const longContent = "a".repeat(500);
    const comment = {
      id: "comment-5",
      content: longContent,
      articleId: "article-123",
      userId: "user-456",
      parentId: null,
      authorName: null,
      createdAt: new Date("2025-11-14T10:00:00Z"),
      updatedAt: new Date("2025-11-14T10:00:00Z"),
      user: {
        id: "user-456",
        name: "Test User",
        image: null,
      },
    };

    render(<CommentItem comment={comment} />);

    expect(screen.getByText(longContent)).toBeInTheDocument();
  });
});

