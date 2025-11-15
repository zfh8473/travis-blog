/**
 * Unit tests for ArticleDetail component.
 *
 * Tests article detail display, including title, content, date, category, tags,
 * author, and excerpt rendering.
 */

import { render, screen } from "@testing-library/react";
import ArticleDetail from "@/components/article/ArticleDetail";

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

describe("ArticleDetail Component", () => {
  const mockArticle = {
    id: "article-1",
    title: "测试文章标题",
    content: "<p>这是文章内容</p><h2>二级标题</h2><p>更多内容</p>",
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

  describe("AC-4.2.2: Display article content", () => {
    it("should render article title", () => {
      render(<ArticleDetail {...mockArticle} />);
      expect(screen.getByText("测试文章标题")).toBeInTheDocument();
    });

    it("should render article content", () => {
      render(<ArticleDetail {...mockArticle} />);
      const article = screen.getByRole("article");
      expect(article).toBeInTheDocument();
      expect(article).toHaveClass("prose");
    });
  });

  describe("AC-4.2.3: Display article metadata", () => {
    it("should display article title", () => {
      render(<ArticleDetail {...mockArticle} />);
      expect(screen.getByText("测试文章标题")).toBeInTheDocument();
    });

    it("should display publish date", () => {
      render(<ArticleDetail {...mockArticle} />);
      expect(screen.getByText("2025年11月14日")).toBeInTheDocument();
    });

    it("should display category", () => {
      render(<ArticleDetail {...mockArticle} />);
      expect(screen.getByText("技术")).toBeInTheDocument();
    });

    it("should display tags", () => {
      render(<ArticleDetail {...mockArticle} />);
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("Next.js")).toBeInTheDocument();
    });

    it("should display author name", () => {
      render(<ArticleDetail {...mockArticle} />);
      expect(screen.getByText("Travis")).toBeInTheDocument();
    });

    it("should display excerpt when available", () => {
      render(<ArticleDetail {...mockArticle} />);
      expect(screen.getByText("这是文章的摘要内容")).toBeInTheDocument();
    });
  });

  describe("AC-4.2.3: Handle optional fields", () => {
    it("should handle missing category", () => {
      const articleWithoutCategory = {
        ...mockArticle,
        category: null,
      };
      render(<ArticleDetail {...articleWithoutCategory} />);
      expect(screen.getByText("未分类")).toBeInTheDocument();
    });

    it("should handle missing tags", () => {
      const articleWithoutTags = {
        ...mockArticle,
        tags: [],
      };
      render(<ArticleDetail {...articleWithoutTags} />);
      expect(screen.queryByText("React")).not.toBeInTheDocument();
    });

    it("should handle missing excerpt", () => {
      const articleWithoutExcerpt = {
        ...mockArticle,
        excerpt: null,
      };
      render(<ArticleDetail {...articleWithoutExcerpt} />);
      expect(screen.queryByText("这是文章的摘要内容")).not.toBeInTheDocument();
    });

    it("should handle missing publish date", () => {
      const articleWithoutDate = {
        ...mockArticle,
        publishedAt: null,
      };
      render(<ArticleDetail {...articleWithoutDate} />);
      expect(screen.queryByText("2025年11月14日")).not.toBeInTheDocument();
    });
  });

  describe("AC-4.2.4: Content formatting", () => {
    it("should use prose classes for content styling", () => {
      render(<ArticleDetail {...mockArticle} />);
      const article = screen.getByRole("article");
      expect(article).toHaveClass("prose");
      expect(article).toHaveClass("prose-lg");
    });
  });

  describe("AC-4.2.5: Responsive design", () => {
    it("should have responsive container classes", () => {
      render(<ArticleDetail {...mockArticle} />);
      const container = screen.getByText("测试文章标题").closest("div");
      expect(container).toHaveClass("container");
      expect(container).toHaveClass("max-w-4xl");
    });
  });

  describe("Navigation links", () => {
    it("should link category to category page", () => {
      render(<ArticleDetail {...mockArticle} />);
      const categoryLink = screen.getByRole("link", { name: "技术" });
      expect(categoryLink).toHaveAttribute("href", "/articles/category/tech");
    });

    it("should link tags to tag pages", () => {
      render(<ArticleDetail {...mockArticle} />);
      const reactTagLink = screen.getByRole("link", { name: "React" });
      expect(reactTagLink).toHaveAttribute("href", "/articles/tag/react");
    });
  });
});

