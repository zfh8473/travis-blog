"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * Tag interface.
 */
interface Tag {
  id: string;
  name: string;
  slug: string;
}

/**
 * Category interface.
 */
interface Category {
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
 * Pagination interface.
 */
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Tag filter page.
 * 
 * Displays all articles with a specific tag.
 * 
 * @component
 * @route /articles/tag/[slug]
 * @requires Public access
 * 
 * @example
 * User navigates to /articles/tag/react, sees all articles with "React" tag
 */
/**
 * Tag filter page content component.
 * 
 * This component is wrapped in Suspense to handle useSearchParams.
 */
function TagFilterPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagSlug = Array.isArray(params?.slug)
    ? params.slug[0]
    : (params?.slug as string);

  // Get page and limit from URL query params
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const articlesPerPage = Math.max(
    10,
    Math.min(50, parseInt(searchParams.get("limit") || "20", 10))
  );

  // Data state
  const [tag, setTag] = useState<Tag | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load tag and filtered articles.
   */
  const loadData = useCallback(async () => {
    if (!tagSlug) {
      setError("标签 slug 无效");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch tag by slug using new endpoint
      const tagResponse = await fetch(`/api/tags/${tagSlug}`);

      if (!tagResponse.ok) {
        if (tagResponse.status === 404) {
          setError("标签不存在");
        } else {
          setError("加载标签失败，请刷新页面重试");
        }
        return;
      }

      const tagData = await tagResponse.json();

      if (!tagData.success || !tagData.data) {
        setError("加载标签失败，请刷新页面重试");
        return;
      }

      setTag(tagData.data);

      // Fetch articles filtered by tag using public API with pagination
      const articlesResponse = await fetch(
        `/api/articles/public?tagSlug=${tagSlug}&page=${currentPage}&limit=${articlesPerPage}`
      );

      if (!articlesResponse.ok) {
        setError("加载文章失败，请刷新页面重试");
        return;
      }

      const articlesData = await articlesResponse.json();

      if (!articlesData.success || !articlesData.data) {
        setError("加载文章失败，请刷新页面重试");
        return;
      }

      setArticles(articlesData.data.articles);
      setPagination(articlesData.data.pagination);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }, [tagSlug, currentPage, articlesPerPage]);

  /**
   * Load tag and articles on component mount or when page changes.
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

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
  if (error || !tag) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{error || "标签不存在"}</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">标签：{tag.name}</h1>
            <p className="text-gray-600">
              {pagination && pagination.total > 0
                ? `共找到 ${pagination.total} 篇文章`
                : "该标签下暂无文章"}
            </p>
          </div>
          
          {/* Items per page selector */}
          {pagination && pagination.total > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                每页显示：
              </label>
              <select
                id="itemsPerPage"
                value={articlesPerPage}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10);
                  // Reset to page 1 when changing limit
                  router.push(`/articles/tag/${tagSlug}?page=1&limit=${newLimit}`);
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          )}
        </div>
      </header>

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">该标签下暂无文章</p>
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
                    {article.tags.map((articleTag) => (
                      <Link
                        key={articleTag.id}
                        href={`/articles/tag/${articleTag.slug}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {articleTag.name}
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          {/* Previous page */}
          {pagination.page > 1 ? (
            <Link
              href={`/articles/tag/${tagSlug}?page=${pagination.page - 1}&limit=${articlesPerPage}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              上一页
            </Link>
          ) : (
            <span className="px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed">
              上一页
            </span>
          )}

          {/* Page numbers */}
          <div className="flex gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (pageNum) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= pagination.page - 1 &&
                    pageNum <= pagination.page + 1);

                if (!showPage) {
                  // Show ellipsis
                  if (
                    pageNum === pagination.page - 2 ||
                    pageNum === pagination.page + 2
                  ) {
                    return (
                      <span
                        key={pageNum}
                        className="px-2 py-2 text-gray-400"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <Link
                    key={pageNum}
                    href={`/articles/tag/${tagSlug}?page=${pageNum}&limit=${articlesPerPage}`}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      pageNum === pagination.page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              }
            )}
          </div>

          {/* Next page */}
          {pagination.page < pagination.totalPages ? (
            <Link
              href={`/articles/tag/${tagSlug}?page=${pagination.page + 1}&limit=${articlesPerPage}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              下一页
            </Link>
          ) : (
            <span className="px-4 py-2 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed">
              下一页
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Tag filter page.
 * 
 * Wrapped in Suspense to handle useSearchParams.
 */
export default function TagFilterPage() {
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
      <TagFilterPageContent />
    </Suspense>
  );
}

