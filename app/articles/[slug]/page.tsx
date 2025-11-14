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
 * Article interface for detail page.
 */
interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  categoryId: string | null;
  category: Category | null;
  publishedAt: string | null;
  createdAt: string;
  author: Author;
  tags: Tag[];
}

/**
 * Article detail page.
 * 
 * Displays a single article with full content, category, tags, and metadata.
 * Only published articles are accessible to public users.
 * 
 * @component
 * @route /articles/[slug]
 * @requires Authentication (ADMIN role for draft articles, public for published)
 * 
 * @example
 * User navigates to /articles/article-slug, sees full article content with category and tags
 */
export default function ArticleDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string);

  // Data state
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load article data on component mount.
   */
  useEffect(() => {
    if (!slug) {
      setError("文章 slug 无效");
      setLoading(false);
      return;
    }

    loadArticle();
  }, [slug]);

  /**
   * Load article by slug from API.
   * 
   * First tries to find article by slug, then fetches full details by ID.
   */
  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch article by slug using public API
      const response = await fetch(`/api/articles/public/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("文章不存在");
          return;
        }
        setError("加载文章失败，请刷新页面重试");
        return;
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        setError("加载文章失败，请刷新页面重试");
        return;
      }

      setArticle(data.data);
    } catch (err) {
      console.error("Error loading article:", err);
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
  if (error || !article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{error || "文章不存在"}</p>
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

  // Format publish date
  const publishDate = article.publishedAt
    ? format(new Date(article.publishedAt), "yyyy年MM月dd日", { locale: zhCN })
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Article header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        {/* Article metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          {publishDate && (
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {publishDate}
            </span>
          )}
          {article.author && (
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {article.author.name || "匿名"}
            </span>
          )}
        </div>

        {/* Category and tags */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category badge */}
          {article.category ? (
            <Link
              href={`/articles/category/${article.category.slug}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
            >
              {article.category.name}
            </Link>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              未分类
            </span>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <>
              {article.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/articles/tag/${tag.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </>
          )}
        </div>
      </header>

      {/* Article excerpt */}
      {article.excerpt && (
        <div className="mb-6 p-4 bg-gray-50 border-l-4 border-blue-500 rounded">
          <p className="text-gray-700 italic">{article.excerpt}</p>
        </div>
      )}

      {/* Article content */}
      <article
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
}

