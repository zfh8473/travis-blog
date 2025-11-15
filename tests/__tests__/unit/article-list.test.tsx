/**
 * Unit tests for ArticleList component.
 * 
 * Tests article list display and empty state handling.
 */

import { render, screen } from "@testing-library/react";
import ArticleList from "@/components/article/ArticleList";
import { ArticleCardProps } from "@/components/article/ArticleCard";

// Mock ArticleCard component
jest.mock("@/components/article/ArticleCard", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe("ArticleList Component", () => {
  const mockArticles: ArticleCardProps[] = [
    {
      id: "article-1",
      title: "第一篇文章",
      excerpt: "摘要1",
      slug: "article-1",
      publishedAt: "2025-11-14T10:00:00Z",
      category: { id: "cat-1", name: "技术", slug: "tech" },
      tags: [{ id: "tag-1", name: "React", slug: "react" }],
      author: { id: "user-1", name: "Travis", image: null },
    },
    {
      id: "article-2",
      title: "第二篇文章",
      excerpt: "摘要2",
      slug: "article-2",
      publishedAt: "2025-11-13T10:00:00Z",
      category: null,
      tags: [],
      author: { id: "user-1", name: "Travis", image: null },
    },
  ];

  describe("AC-4.1.1: Display article list", () => {
    it("should render list of article cards", () => {
      render(<ArticleList articles={mockArticles} />);
      expect(screen.getByText("第一篇文章")).toBeInTheDocument();
      expect(screen.getByText("第二篇文章")).toBeInTheDocument();
    });

    it("should render articles in grid layout", () => {
      const { container } = render(<ArticleList articles={mockArticles} />);
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3");
    });
  });

  describe("AC-4.1.7: Handle empty state", () => {
    it("should display empty state when no articles", () => {
      render(<ArticleList articles={[]} />);
      expect(screen.getByText("暂无文章")).toBeInTheDocument();
      expect(screen.getByText("请稍后再来查看新文章")).toBeInTheDocument();
    });

    it("should not display article cards when empty", () => {
      render(<ArticleList articles={[]} />);
      expect(screen.queryByText("第一篇文章")).not.toBeInTheDocument();
    });
  });
});

