"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { deleteArticleAction } from "@/lib/actions/article";

/**
 * Article interface for list display.
 */
export interface Article {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Pagination interface.
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Status filter type.
 */
type StatusFilter = "all" | "published" | "drafts";

/**
 * Client component for articles list with filtering and search.
 * 
 * Handles client-side interactions: filtering, searching, deleting.
 * Data is passed from Server Component as props.
 * 
 * @component
 */
export default function ArticlesListClient({
  initialArticles,
}: {
  initialArticles: Article[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data state
  const [allArticles, setAllArticles] = useState<Article[]>(initialArticles);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Initialize state from URL parameters on component mount.
   */
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search");

    if (statusParam === "published" || statusParam === "drafts") {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter("all");
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  /**
   * Update URL parameters when filter or search changes.
   */
  const updateURLParams = useCallback(
    (status: StatusFilter, search: string) => {
      const params = new URLSearchParams();
      if (status !== "all") {
        params.set("status", status);
      }
      if (search) {
        params.set("search", search);
      }
      const queryString = params.toString();
      const newUrl = queryString ? `/admin/articles?${queryString}` : "/admin/articles";
      router.replace(newUrl);
    },
    [router]
  );

  /**
   * Apply filters and search to articles.
   */
  useEffect(() => {
    let filtered = [...allArticles];

    // Apply status filter
    if (statusFilter === "published") {
      filtered = filtered.filter((article) => article.status === "PUBLISHED");
    } else if (statusFilter === "drafts") {
      filtered = filtered.filter((article) => article.status === "DRAFT");
    }

    // Apply search filter (client-side)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((article) =>
        article.title.toLowerCase().includes(query)
      );
    }

    setFilteredArticles(filtered);
  }, [allArticles, statusFilter, searchQuery]);

  /**
   * Debounced search handler.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURLParams(statusFilter, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, updateURLParams]);

  /**
   * Handle status filter change.
   * 
   * @param status - The status filter to apply
   */
  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    updateURLParams(status, searchQuery);
  };

  /**
   * Handle search query change.
   * 
   * @param query - The search query
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // URL update is handled by debounced effect
  };

  /**
   * Handle article deletion.
   * 
   * Uses Server Action instead of API route to avoid session issues.
   * 
   * @param articleId - The ID of the article to delete
   * @param articleTitle - The title of the article (for confirmation message)
   */
  const handleDelete = async (articleId: string, articleTitle: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `确定要删除文章《${articleTitle}》吗？此操作无法撤销。`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(articleId);
      setDeleteError(null);
      setSuccessMessage(null);

      // Use Server Action instead of API route
      const result = await deleteArticleAction(articleId);

      if (!result.success) {
        // Handle errors
        if (result.error.code === "UNAUTHORIZED") {
          setDeleteError("请先登录");
        } else if (result.error.code === "FORBIDDEN") {
          setDeleteError("权限不足，需要管理员权限");
        } else if (result.error.code === "ARTICLE_NOT_FOUND") {
          setDeleteError("文章不存在");
        } else {
          setDeleteError(result.error.message || "删除文章失败，请重试");
        }
        setDeletingId(null);
        return;
      }

      // Show success message
      setSuccessMessage("文章删除成功！");
      setDeleteError(null);

      // Remove article from list (optimistic update)
      setAllArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== articleId)
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error deleting article:", err);
      setDeleteError("删除文章失败，请刷新页面重试");
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Format date for display.
   * 
   * @param dateString - The date string to format
   * @returns Formatted date string
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "未发布";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  /**
   * Calculate article statistics.
   * 
   * @returns Object with total, published, and draft counts
   */
  const calculateStatistics = () => {
    const total = allArticles.length;
    const published = allArticles.filter((a) => a.status === "PUBLISHED").length;
    const drafts = allArticles.filter((a) => a.status === "DRAFT").length;
    return { total, published, drafts };
  };

  const statistics = calculateStatistics();

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Page Header - 移动端优化 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">文章管理</h1>
        <Link
          href="/admin/articles/new"
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[44px] flex items-center justify-center text-sm sm:text-base"
        >
          新建文章
        </Link>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Delete error message */}
      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{deleteError}</p>
        </div>
      )}

      {/* Article Statistics - 移动端优化 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">总文章数</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">已发布</div>
          <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{statistics.published}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">草稿</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{statistics.drafts}</div>
        </div>
      </div>

      {/* Filter and Search Controls - 移动端优化 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label htmlFor="status-filter" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              状态筛选
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as StatusFilter)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="all">全部</option>
              <option value="published">已发布</option>
              <option value="drafts">草稿</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1">
            <label htmlFor="search-input" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              搜索文章
            </label>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="输入文章标题搜索..."
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Articles table - 移动端使用卡片布局，桌面端使用表格 */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">暂无文章</p>
          <Link
            href="/admin/articles/new"
            className="mt-4 inline-block px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors min-h-[44px] flex items-center justify-center"
          >
            创建第一篇文章
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table View - 桌面端表格视图 */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    作者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    发布日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {article.title}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {article.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {article.category.name}
                          </span>
                        )}
                        {article.tags && article.tags.length > 0 && (
                          <>
                            {article.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.status === "PUBLISHED"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {article.status === "PUBLISHED" ? "已发布" : "草稿"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {article.author.name || article.author.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(article.publishedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id, article.title)}
                          disabled={deletingId === article.id}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`删除文章《${article.title}》`}
                        >
                          {deletingId === article.id ? "删除中..." : "删除"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Results info */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {filteredArticles.length === 0 ? (
                  <span>没有找到匹配的文章</span>
                ) : (
                  <span>
                    显示 {filteredArticles.length} 篇文章
                    {searchQuery && `（搜索: "${searchQuery}"）`}
                    {statusFilter !== "all" && `（筛选: ${statusFilter === "published" ? "已发布" : "草稿"}）`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Card View - 移动端卡片视图 */}
          <div className="md:hidden space-y-3">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex-1">
                    {article.title}
                  </h3>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full flex-shrink-0 ${
                      article.status === "PUBLISHED"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {article.status === "PUBLISHED" ? "已发布" : "草稿"}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {article.category.name}
                    </span>
                  )}
                  {article.tags && article.tags.length > 0 && (
                    <>
                      {article.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>作者: {article.author.name || article.author.id}</div>
                    <div>发布日期: {formatDate(article.publishedAt)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id, article.title)}
                      disabled={deletingId === article.id}
                      className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                      aria-label={`删除文章《${article.title}》`}
                    >
                      {deletingId === article.id ? "删除中..." : "删除"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Results info - Mobile */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                {filteredArticles.length === 0 ? (
                  <span>没有找到匹配的文章</span>
                ) : (
                  <span>
                    显示 {filteredArticles.length} 篇文章
                    {searchQuery && `（搜索: "${searchQuery}"）`}
                    {statusFilter !== "all" && `（筛选: ${statusFilter === "published" ? "已发布" : "草稿"}）`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


