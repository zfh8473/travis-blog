"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
 * Article list page.
 * 
 * Displays a list of published articles with optional category filtering.
 * 
 * @component
 * @route /articles
 * @requires Public access
 * 
 * @example
 * User navigates to /articles or /articles?categoryId=xxx, sees list of published articles
 */
function ArticlesListPageContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  // Data state
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load articles and categories on component mount.
   */
  useEffect(() => {
    loadData();
  }, [categoryId]);

  /**
   * Load articles and categories.
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const categoriesResponse = await fetch("/api/categories");

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }
      }

      // Build API URL with filters using public API
      let apiUrl = `/api/articles/public?limit=1000`;
      if (categoryId) {
        apiUrl += `&categoryId=${categoryId}`;
      }

      // Fetch articles using public API
      const articlesResponse = await fetch(apiUrl);

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
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Get current category name
  const currentCategory = categoryId
    ? categories.find((c) => c.id === categoryId)
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {currentCategory ? `分类：${currentCategory.name}` : "所有文章"}
        </h1>
        <p className="text-gray-600">
          {articles.length > 0
            ? `共找到 ${articles.length} 篇文章`
            : "暂无文章"}
        </p>
      </header>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/articles"
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !categoryId
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              全部
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/articles/category/${category.slug}`}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  categoryId === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {currentCategory
              ? "该分类下暂无文章"
              : "暂无文章"}
          </p>
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
                  {article.category && (
                    <Link
                      href={`/articles/category/${article.category.slug}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {article.category.name}
                    </Link>
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
                      <Link
                        key={tag.id}
                        href={`/articles/tag/${tag.slug}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {tag.name}
                      </Link>
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

/**
 * Articles list page.
 * 
 * Displays a list of published articles with optional category filtering.
 * 
 * @component
 * @route /articles
 * @requires Public access
 * 
 * @example
 * User navigates to /articles or /articles?categoryId=xxx, sees list of published articles
 */
export default function ArticlesListPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      }
    >
      <ArticlesListPageContent />
    </Suspense>
  );
}

