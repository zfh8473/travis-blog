"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

      const response = await fetch(`/api/articles/${articleId}`, {
        credentials: "include",
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 404) {
          setDeleteError("文章不存在");
        } else if (response.status === 401) {
          setDeleteError("请先登录");
        } else if (response.status === 403) {
          setDeleteError("权限不足，需要管理员权限");
        } else {
          setDeleteError(
            errorData.error?.message || "删除文章失败，请重试"
          );
        }
        setDeletingId(null);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        setDeleteError(data.error?.message || "删除文章失败，请重试");
        setDeletingId(null);
        setSuccessMessage(null);
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Article Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">总文章数</div>
          <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">已发布</div>
          <div className="text-2xl font-bold text-green-600">{statistics.published}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">草稿</div>
          <div className="text-2xl font-bold text-gray-600">{statistics.drafts}</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              状态筛选
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部</option>
              <option value="published">已发布</option>
              <option value="drafts">草稿</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1">
            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2">
              搜索文章
            </label>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="输入文章标题搜索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Articles table */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">暂无文章</p>
          <Link
            href="/admin/articles/new"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            创建第一篇文章
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  发布日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {article.title}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {article.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {article.category.name}
                        </span>
                      )}
                      {article.tags && article.tags.length > 0 && (
                        <>
                          {article.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
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
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {article.status === "PUBLISHED" ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.author.name || article.author.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(article.publishedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id, article.title)}
                        disabled={deletingId === article.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
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
      )}
    </div>
  );
}

