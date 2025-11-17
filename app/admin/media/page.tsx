"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { formatFileSize, isImage } from "@/lib/utils/media";

/**
 * Media file interface.
 */
interface MediaFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  url: string;
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
 * Media library page.
 * 
 * Displays all uploaded media files in a grid layout with thumbnails (for images),
 * filename, upload date, and file size. Allows previewing images and deleting files.
 * Only accessible to ADMIN users.
 * 
 * @component
 * @route /admin/media
 * @requires Authentication (ADMIN role)
 * 
 * @example
 * User navigates to /admin/media, sees list of all media files with actions
 */
export default function MediaLibraryPage() {
  // Data state
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Delete state
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFileInUseWarning, setShowFileInUseWarning] = useState<{
    path: string;
    articleIds: string[];
  } | null>(null);

  /**
   * Load media files from API.
   */
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/media?page=${currentPage}&limit=20`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("请先登录");
        } else if (response.status === 403) {
          setError("权限不足，需要管理员权限");
        } else {
          setError("加载媒体文件失败，请刷新页面重试");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        setError("加载媒体文件失败，请刷新页面重试");
        setLoading(false);
        return;
      }

      setFiles(data.data.files);
      setPagination(data.data.pagination);
      setLoading(false);
    } catch (err) {
      console.error("Error loading media files:", err);
      setError("加载媒体文件失败，请刷新页面重试");
      setLoading(false);
    }
  }, [currentPage]);

  /**
   * Load media files on component mount and when page changes.
   */
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  /**
   * Handle delete button click.
   */
  const handleDeleteClick = (filePath: string) => {
    setShowDeleteConfirm(filePath);
    setDeleteError(null);
  };

  /**
   * Handle delete confirmation.
   */
  const handleDeleteConfirm = async (filePath: string) => {
    setShowDeleteConfirm(null);
    setDeletingPath(filePath);
    setDeleteError(null);
    setSuccessMessage(null);

    try {
      const encodedPath = encodeURIComponent(filePath);
      const response = await fetch(`/api/media/${encodedPath}`, {
        credentials: "include",
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if file is in use
        if (data.error?.code === "FILE_IN_USE") {
          setShowFileInUseWarning({
            path: filePath,
            articleIds: data.error.articleIds || [],
          });
          setDeletingPath(null);
          return;
        }

        setDeleteError(data.error?.message || "删除文件失败");
        setDeletingPath(null);
        return;
      }

      // Remove file from UI
      setFiles((prevFiles) => prevFiles.filter((file) => file.path !== filePath));
      setSuccessMessage("文件删除成功");
      setDeletingPath(null);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error deleting file:", err);
      setDeleteError("删除文件失败，请重试");
      setDeletingPath(null);
    }
  };

  /**
   * Handle force delete (delete even if file is in use).
   */
  const handleForceDelete = async (filePath: string) => {
    setShowFileInUseWarning(null);
    setDeletingPath(filePath);
    setDeleteError(null);
    setSuccessMessage(null);

    try {
      const encodedPath = encodeURIComponent(filePath);
      const response = await fetch(`/api/media/${encodedPath}?force=true`, {
        credentials: "include",
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error?.message || "删除文件失败");
        setDeletingPath(null);
        return;
      }

      // Remove file from UI
      setFiles((prevFiles) => prevFiles.filter((file) => file.path !== filePath));
      setSuccessMessage("文件已强制删除");
      setDeletingPath(null);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error force deleting file:", err);
      setDeleteError("删除文件失败，请重试");
      setDeletingPath(null);
    }
  };

  /**
   * Format date for display.
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Handle image preview.
   */
  const handleImagePreview = (url: string) => {
    setPreviewImage(url);
  };

  /**
   * Close image preview.
   */
  const closePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  /**
   * Handle ESC key to close image preview.
   */
  useEffect(() => {
    if (!previewImage) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePreview();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [previewImage, closePreview]);

  // Loading state
  if (loading && files.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">媒体库</h1>
        <div className="flex justify-center items-center py-12">
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && files.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">媒体库</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">媒体库</h1>

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

      {/* Files grid */}
      {files.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">暂无媒体文件</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {files.map((file) => (
              <div
                key={file.path}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail or icon */}
                <div className="aspect-square bg-gray-100 relative">
                  {isImage(file.mimeType) ? (
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover cursor-pointer"
                      onClick={() => handleImagePreview(file.url)}
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-900 truncate mb-1" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 mb-1">{formatFileSize(file.size)}</p>
                  <p className="text-xs text-gray-500">{formatDate(file.createdAt)}</p>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteClick(file.path)}
                    disabled={deletingPath === file.path}
                    className="mt-2 w-full px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingPath === file.path ? "删除中..." : "删除"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-gray-700">
                第 {pagination.page} 页，共 {pagination.totalPages} 页（共 {pagination.total} 个文件）
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* Image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={closePreview}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="关闭预览"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <Image
              src={previewImage}
              alt="预览"
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">确认删除</h2>
            <p className="text-gray-700 mb-6">确定要删除此文件吗？此操作无法撤销。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File in use warning dialog */}
      {showFileInUseWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-yellow-600">警告</h2>
            <p className="text-gray-700 mb-4">
              此文件正在被文章使用。确定要删除吗？删除后，文章中的图片将无法显示。
            </p>
            {showFileInUseWarning.articleIds.length > 0 && (
              <p className="text-sm text-gray-600 mb-4">
                使用此文件的文章数量: {showFileInUseWarning.articleIds.length}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFileInUseWarning(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                onClick={() => handleForceDelete(showFileInUseWarning.path)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                强制删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

