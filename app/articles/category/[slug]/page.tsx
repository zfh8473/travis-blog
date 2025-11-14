"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * Category interface.
 */
interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Tag interface.
 */
interface Tag {
  id: string;
  name: string;
  slug: string;
}

/**
 * Author interface.
 */
interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

/**
 * Article interface for list display.
 */
interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  category: Category | null;
  publishedAt: string | null;
  createdAt: string;
  author: Author;
  tags: Tag[];
}

/**
 * Category filter page.
 * 
 * Displays all articles in a specific category.
 * 
 * @component
 * @route /articles/category/[slug]
 * @requires Public access
 * 
 * @example
 * User navigates to /articles/category/tech, sees all articles in "技术" category
 */
export default function CategoryFilterPage() {
  const params = useParams();
  const categorySlug = Array.isArray(params?.slug)
    ? params.slug[0]
    : (params?.slug as string);

  // Data state
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load category and articles on component mount.
   */
  useEffect(() => {
    if (!categorySlug) {
      setError("分类 slug 无效");
      setLoading(false);
      return;
    }

    loadData();
  }, [categorySlug]);

  /**
   * Load category and filtered articles.
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all categories to find category by slug
      const categoriesResponse = await fetch("/api/categories");

      if (!categoriesResponse.ok) {
        setError("加载分类失败，请刷新页面重试");
        return;
      }

      const categoriesData = await categoriesResponse.json();

      if (!categoriesData.success || !categoriesData.data) {
        setError("加载分类失败，请刷新页面重试");
        return;
      }

      // Find category by slug
      const foundCategory = categoriesData.data.find(
        (c: Category) => c.slug === categorySlug
      );

      if (!foundCategory) {
        setError("分类不存在");
        return;
      }

      setCategory(foundCategory);

      // Fetch articles filtered by category using public API
      const articlesResponse = await fetch(
        `/api/articles/public?categorySlug=${categorySlug}&limit=1000`
      );

      if (!articlesResponse.ok) {
        setError("加载文章失败，请刷新页面重试");
        return;
      }

      const articlesData = await articlesResponse.json();

      if (!articlesData.success || !articlesData.data?.articles) {
        setError("加载文章失败，请刷新页面重试");
        return;
      }

      setArticles(articlesData.data.articles);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{error || "分类不存在"}</p>
          <Link
            href="/articles"
            className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            返回文章列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">分类：{category.name}</h1>
        <p className="text-gray-600">
          {articles.length > 0
            ? `共找到 ${articles.length} 篇文章`
            : "该分类下暂无文章"}
        </p>
      </header>

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">该分类下暂无文章</p>
          <Link
            href="/articles"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            查看所有文章
          </Link>
        </div>
      )}

      {/* Article list */}
      {articles.length > 0 && (
        <div className="space-y-6">
          {articles.map((article) => {
            const publishDate = article.publishedAt
              ? format(new Date(article.publishedAt), "yyyy年MM月dd日", {
                  locale: zhCN,
                })
              : null;

            return (
              <article
                key={article.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <h2 className="text-2xl font-bold mb-2">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {article.title}
                  </Link>
                </h2>

                {/* Article metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                  {publishDate && <span>{publishDate}</span>}
                  {article.author && (
                    <span>{article.author.name || "匿名"}</span>
                  )}
                </div>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-gray-700 mb-3">{article.excerpt}</p>
                )}

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {article.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Read more link */}
                <Link
                  href={`/articles/${article.slug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  阅读全文 →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

