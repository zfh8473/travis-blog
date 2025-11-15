/**
 * Unit tests for ArticleCard component.
 * 
 * Tests article card display, including title, excerpt, date, category, tags,
 * and navigation functionality.
 */

import { render, screen } from "@testing-library/react";
import ArticleCard from "@/components/article/ArticleCard";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock date-fns
jest.mock("date-fns", () => ({
  format: jest.fn((date: Date, formatStr: string, options?: any) => {
    return "2025年11月14日";
  }),
}));

jest.mock("date-fns/locale", () => ({
  zhCN: {},
}));

describe("ArticleCard Component", () => {
  const mockArticle = {
    id: "article-1",
    title: "测试文章标题",
    excerpt: "这是文章的摘要内容",
    slug: "test-article",
    publishedAt: "2025-11-14T10:00:00Z",
    category: {
      id: "cat-1",
      name: "技术",
      slug: "tech",
    },
    tags: [
      { id: "tag-1", name: "React", slug: "react" },
      { id: "tag-2", name: "Next.js", slug: "nextjs" },
    ],
    author: {
      id: "user-1",
      name: "Travis",
      image: null,
    },
  };

  describe("AC-4.1.2: Display article information", () => {
    it("should display article title", () => {
      render(<ArticleCard {...mockArticle} />);
      expect(screen.getByText("测试文章标题")).toBeInTheDocument();
    });

    it("should display article excerpt", () => {
      render(<ArticleCard {...mockArticle} />);
      expect(screen.getByText("这是文章的摘要内容")).toBeInTheDocument();
    });

    it("should display formatted publish date", () => {
      render(<ArticleCard {...mockArticle} />);
      expect(screen.getByText("2025年11月14日")).toBeInTheDocument();
    });

    it("should display category if available", () => {
      render(<ArticleCard {...mockArticle} />);
      expect(screen.getByText("技术")).toBeInTheDocument();
    });

    it("should display tags if available", () => {
      render(<ArticleCard {...mockArticle} />);
      expect(screen.getByText("#React")).toBeInTheDocument();
      expect(screen.getByText("#Next.js")).toBeInTheDocument();
    });

    it("should display author name if available", () => {
      render(<ArticleCard {...mockArticle} />);
      expect(screen.getByText("Travis")).toBeInTheDocument();
    });
  });

  describe("AC-4.1.2: Handle missing optional fields", () => {
    it("should handle missing excerpt", () => {
      const articleWithoutExcerpt = {
        ...mockArticle,
        excerpt: null,
      };
      render(<ArticleCard {...articleWithoutExcerpt} />);
      expect(screen.getByText("暂无摘要")).toBeInTheDocument();
    });

    it("should handle missing category", () => {
      const articleWithoutCategory = {
        ...mockArticle,
        category: null,
      };
      render(<ArticleCard {...articleWithoutCategory} />);
      expect(screen.queryByText("技术")).not.toBeInTheDocument();
    });

    it("should handle empty tags array", () => {
      const articleWithoutTags = {
        ...mockArticle,
        tags: [],
      };
      render(<ArticleCard {...articleWithoutTags} />);
      expect(screen.queryByText("#React")).not.toBeInTheDocument();
    });

    it("should handle missing publish date", () => {
      const articleWithoutDate = {
        ...mockArticle,
        publishedAt: null,
      };
      render(<ArticleCard {...articleWithoutDate} />);
      expect(screen.queryByText("2025年11月14日")).not.toBeInTheDocument();
    });
  });

  describe("AC-4.1.2: Navigation to article detail", () => {
    it("should make card clickable with correct link", () => {
      render(<ArticleCard {...mockArticle} />);
      const link = screen.getByRole("link", { name: /测试文章标题/ });
      expect(link).toHaveAttribute("href", "/articles/test-article");
    });

    it("should navigate to article detail page when clicked", () => {
      render(<ArticleCard {...mockArticle} />);
      const titleLink = screen.getByRole("link", { name: /测试文章标题/ });
      expect(titleLink).toHaveAttribute("href", "/articles/test-article");
    });
  });
});

