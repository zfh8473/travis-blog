"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import MarkdownEditor from "@/components/editor/MarkdownEditor";

/**
 * Category interface for form state.
 */
interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Tag interface for form state.
 */
interface Tag {
  id: string;
  name: string;
  slug: string;
}

/**
 * Article interface for loaded article data.
 */
interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  categoryId: string | null;
  tags: Tag[];
  status: "DRAFT" | "PUBLISHED";
}

/**
 * Form validation errors interface.
 */
interface FormErrors {
  title?: string;
  content?: string;
  excerpt?: string;
  categoryId?: string;
  tagIds?: string;
  status?: string;
  general?: string;
}

/**
 * Article edit page.
 * 
 * Allows admin users to edit existing articles with title, content (via Tiptap editor),
 * excerpt, category, tags, and status (DRAFT or PUBLISHED).
 * 
 * @component
 * @route /admin/articles/[id]/edit
 * @requires Authentication (ADMIN role)
 * 
 * @example
 * User navigates to /admin/articles/article-id/edit, sees pre-filled form, makes changes, and clicks "Save as Draft" or "Publish"
 */
export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();

  // Get article ID from route params
  // Handle both string and string[] (Next.js can return either)
  const articleId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");

  // Data loading state
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Tag input state
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Error state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Success state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete state
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Load article data, categories, and tags on component mount.
   */
  useEffect(() => {
    const loadData = async () => {
      if (!articleId) {
        setLoadError("文章 ID 无效");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);

        // Fetch article, categories, and tags in parallel
        const [articleResponse, categoriesResponse, tagsResponse] = await Promise.all([
          fetch(`/api/articles/${articleId}`),
          fetch("/api/categories"),
          fetch("/api/tags"),
        ]);

        // Handle article response
        if (!articleResponse.ok) {
          if (articleResponse.status === 404) {
            setLoadError("文章不存在");
          } else if (articleResponse.status === 401) {
            setLoadError("请先登录");
          } else if (articleResponse.status === 403) {
            setLoadError("权限不足，需要管理员权限");
          } else {
            setLoadError("加载文章失败，请刷新页面重试");
          }
          setLoading(false);
          return;
        }

        const articleData = await articleResponse.json();

        if (!articleData.success || !articleData.data) {
          setLoadError("加载文章失败，请刷新页面重试");
          setLoading(false);
          return;
        }

        // Set article data
        const loadedArticle = articleData.data;
        setArticle(loadedArticle);

        // Pre-fill form fields with article data
        setTitle(loadedArticle.title || "");
        setContent(loadedArticle.content || "");
        setExcerpt(loadedArticle.excerpt || "");
        setCategoryId(loadedArticle.categoryId || "");
        setTagIds(loadedArticle.tags?.map((tag: Tag) => tag.id) || []);
        setStatus(loadedArticle.status || "DRAFT");

        // Handle categories response
        if (!categoriesResponse.ok) {
          throw new Error("Failed to load categories");
        }

        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }

        // Handle tags response
        if (!tagsResponse.ok) {
          throw new Error("Failed to load tags");
        }

        const tagsData = await tagsResponse.json();
        if (tagsData.success) {
          setTags(tagsData.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (!loadError) {
          setLoadError("加载数据失败，请刷新页面重试");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [articleId]);

  /**
   * Handle article deletion.
   */
  const handleDelete = async () => {
    if (!article) {
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `确定要删除文章《${article.title}》吗？此操作无法撤销。`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);

      const response = await fetch(`/api/articles/${articleId}`, {
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
        setDeleting(false);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        setDeleteError(data.error?.message || "删除文章失败，请重试");
        setDeleting(false);
        return;
      }

      // Redirect to article list page after successful deletion
      router.push("/admin/articles");
    } catch (err) {
      console.error("Error deleting article:", err);
      setDeleteError("删除文章失败，请刷新页面重试");
      setDeleting(false);
    }
  };

  /**
   * UUID validation regex pattern.
   * Matches standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   */
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Validate UUID format.
   * 
   * @param value - String to validate
   * @returns true if valid UUID, false otherwise
   */
  const isValidUUID = (value: string): boolean => {
    return UUID_REGEX.test(value);
  };

  /**
   * Validate form data before submission.
   * 
   * @returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate title (required if provided)
    if (title.trim() && title.length > 200) {
      newErrors.title = "标题不能超过 200 个字符";
    }

    // Validate content (required if provided)
    if (content.trim()) {
      // Remove HTML tags and check if there's actual content
      const textContent = content.replace(/<[^>]*>/g, "").trim();
      if (!textContent || content === "<p></p>" || content === "<p><br></p>") {
        newErrors.content = "内容不能为空";
      }
    }

    // Validate excerpt
    if (excerpt && excerpt.length > 500) {
      newErrors.excerpt = "摘要不能超过 500 个字符";
    }

    // Validate categoryId UUID format if provided
    if (categoryId && !isValidUUID(categoryId)) {
      newErrors.categoryId = "分类 ID 格式无效";
    }

    // Validate tagIds UUID format if provided
    if (tagIds.length > 0) {
      const invalidTagIds = tagIds.filter((tagId) => !isValidUUID(tagId));
      if (invalidTagIds.length > 0) {
        newErrors.tagIds = "标签 ID 格式无效";
      }
    }

    // Validate status if provided
    if (status && status !== "DRAFT" && status !== "PUBLISHED") {
      newErrors.status = "状态必须是草稿或已发布";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission.
   * 
   * @param e - Form event
   * @param submitStatus - Status to submit (DRAFT or PUBLISHED)
   */
  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
    submitStatus: "DRAFT" | "PUBLISHED"
  ) => {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});
    setSuccessMessage(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Prepare request body (all fields optional for partial updates)
      const requestBody: {
        title?: string;
        content?: string;
        excerpt?: string;
        categoryId?: string;
        tagIds?: string[];
        status?: "DRAFT" | "PUBLISHED";
      } = {};

      // Only include fields that have changed or are being set
      if (title.trim()) {
        requestBody.title = title.trim();
      }

      if (content.trim()) {
        requestBody.content = content.trim();
      }

      if (excerpt.trim()) {
        requestBody.excerpt = excerpt.trim();
      } else if (excerpt === "") {
        // Explicitly set to empty string to clear excerpt
        requestBody.excerpt = "";
      }

      if (categoryId) {
        requestBody.categoryId = categoryId;
      } else if (categoryId === "") {
        // Explicitly set to empty string to clear category
        requestBody.categoryId = "";
      }

      if (tagIds.length > 0) {
        requestBody.tagIds = tagIds;
      } else {
        // Explicitly set to empty array to clear tags
        requestBody.tagIds = [];
      }

      requestBody.status = submitStatus;

      // Submit to API
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        if (response.status === 401) {
          // Unauthorized - user not authenticated
          setSubmitError("请先登录");
          return;
        }

        if (response.status === 403) {
          // Forbidden - user doesn't have permission
          setSubmitError("权限不足，需要管理员权限");
          return;
        }

        if (response.status === 404) {
          // Article not found
          setSubmitError("文章不存在");
          return;
        }

        if (response.status === 400 && data.error?.details) {
          // Validation errors from API
          const apiErrors: FormErrors = {};
          data.error.details.forEach((issue: { path: string[]; message: string }) => {
            const field = issue.path[0];
            // Map field names to FormErrors interface
            if (field === "title") {
              apiErrors.title = issue.message;
            } else if (field === "content") {
              apiErrors.content = issue.message;
            } else if (field === "excerpt") {
              apiErrors.excerpt = issue.message;
            } else if (field === "categoryId") {
              apiErrors.categoryId = issue.message;
            } else if (field === "tagIds") {
              apiErrors.tagIds = issue.message;
            } else if (field === "status") {
              apiErrors.status = issue.message;
            }
          });
          setErrors(apiErrors);
        } else {
          setSubmitError(
            data.error?.message || "更新文章失败，请重试"
          );
        }
        return;
      }

      if (data.success && data.data) {
        // Success - show success message
        setSuccessMessage("文章更新成功！");
        
        // Redirect to articles list after a brief delay to show success message
        // This allows users to immediately see the updated article in the list
        setTimeout(() => {
          router.push("/admin/articles");
        }, 1000);
      } else {
        setSubmitError("更新文章失败，请重试");
      }
    } catch (error) {
      console.error("Error updating article:", error);
      setSubmitError("网络错误，请检查连接后重试");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Toggle tag selection.
   * 
   * @param tagId - Tag ID to toggle
   */
  const handleTagToggle = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  /**
   * Handle tag input change for autocomplete.
   * 
   * @param value - Input value
   */
  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    if (value.trim().length > 0) {
      // Filter tags by name (case-insensitive)
      const filtered = tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(value.toLowerCase()) &&
          !tagIds.includes(tag.id)
      );
      setTagSuggestions(filtered);
      setShowTagSuggestions(true);
    } else {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
    }
  };

  /**
   * Select a tag from suggestions or create a new tag.
   * 
   * @param tagId - Optional tag ID to select (if null, creates new tag)
   */
  const handleTagSelect = async (tagId?: string) => {
    if (tagId) {
      // Select existing tag
      if (!tagIds.includes(tagId)) {
        setTagIds((prev) => [...prev, tagId]);
      }
      setTagInput("");
      setShowTagSuggestions(false);
    } else if (tagInput.trim().length > 0) {
      // Create new tag
      try {
        const response = await fetch("/api/tags", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: tagInput.trim() }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "创建标签失败");
        }

        const data = await response.json();
        if (data.success && data.data) {
          // Add new tag to tags list and select it
          setTags((prev) => [...prev, data.data]);
          setTagIds((prev) => [...prev, data.data.id]);
          setTagInput("");
          setShowTagSuggestions(false);
        }
      } catch (error) {
        console.error("Error creating tag:", error);
        setSubmitError(
          error instanceof Error ? error.message : "创建标签失败，请重试"
        );
      }
    }
  };

  /**
   * Remove a tag from selection.
   * 
   * @param tagId - Tag ID to remove
   */
  const handleTagRemove = (tagId: string) => {
    setTagIds((prev) => prev.filter((id) => id !== tagId));
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

  // Error state (article not found or permission denied)
  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{loadError}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/articles"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ← 返回文章列表
          </Link>
        <h1 className="text-3xl font-bold">编辑文章</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting || submitting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="删除文章"
        >
          {deleting ? "删除中..." : "删除文章"}
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Delete error message */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <p>{deleteError}</p>
        </div>
      )}

      {/* General error message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          <p>{submitError}</p>
        </div>
      )}

      <form
        onSubmit={(e) => handleSubmit(e, status)}
        className="space-y-6"
      >
        {/* Title field */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="输入文章标题"
            maxLength={200}
            disabled={submitting}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Content field (MarkdownEditor) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            内容 <span className="text-red-500">*</span>
          </label>
          <MarkdownEditor
            initialContent={content}
            onChange={(html) => setContent(html)}
            placeholder="开始写作..."
            readOnly={submitting}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        {/* Excerpt field */}
        <div>
          <label
            htmlFor="excerpt"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            摘要（可选）
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.excerpt ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="输入文章摘要（最多 500 个字符）"
            rows={3}
            maxLength={500}
            disabled={submitting}
          />
          {errors.excerpt && (
            <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>
          )}
        </div>

        {/* Category field */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            分类（可选）
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.categoryId ? "border-red-500" : "border-gray-300"
            }`}
            disabled={submitting}
          >
            <option value="">选择分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
          )}
        </div>

        {/* Tags field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标签（可选）
          </label>
          
          {/* Selected tags display */}
          {tagIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tagIds.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tagId}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tagId)}
                      className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                      disabled={submitting}
                      aria-label={`移除标签 ${tag.name}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Tag input with autocomplete */}
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => handleTagInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (tagSuggestions.length > 0) {
                    handleTagSelect(tagSuggestions[0].id);
                  } else {
                    handleTagSelect();
                  }
                } else if (e.key === "Escape") {
                  setShowTagSuggestions(false);
                }
              }}
              onFocus={() => {
                if (tagInput.trim().length > 0) {
                  setShowTagSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay to allow click on suggestion
                setTimeout(() => setShowTagSuggestions(false), 200);
              }}
              placeholder="输入标签名称（按 Enter 创建新标签）"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />

            {/* Tag suggestions dropdown */}
            {showTagSuggestions && tagSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagSelect(tag.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}

            {/* Create new tag hint */}
            {showTagSuggestions &&
              tagInput.trim().length > 0 &&
              tagSuggestions.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  <button
                    type="button"
                    onClick={() => handleTagSelect()}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-blue-600"
                  >
                    创建新标签: "{tagInput.trim()}"
                  </button>
                </div>
              )}
          </div>

          {/* All tags checkbox list (fallback) */}
          {tags.length > 0 && (
            <details className="mt-3">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                查看所有标签
              </summary>
              <div className="mt-2 border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={tagIds.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </details>
          )}

          {errors.tagIds && (
            <p className="mt-1 text-sm text-red-600">{errors.tagIds}</p>
          )}
        </div>

        {/* Status field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            状态 <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="DRAFT"
                checked={status === "DRAFT"}
                onChange={(e) =>
                  setStatus(e.target.value as "DRAFT" | "PUBLISHED")
                }
                className="text-blue-600 focus:ring-blue-500"
                disabled={submitting}
              />
              <span>草稿</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="PUBLISHED"
                checked={status === "PUBLISHED"}
                onChange={(e) =>
                  setStatus(e.target.value as "DRAFT" | "PUBLISHED")
                }
                className="text-blue-600 focus:ring-blue-500"
                disabled={submitting}
              />
              <span>已发布</span>
            </label>
          </div>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status}</p>
          )}
        </div>

        {/* Submit buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              setStatus("DRAFT");
              handleSubmit(e as any, "DRAFT");
            }}
            disabled={submitting}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "保存中..." : "保存为草稿"}
          </button>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              setStatus("PUBLISHED");
              handleSubmit(e as any, "PUBLISHED");
            }}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "发布中..." : "发布"}
          </button>
        </div>
      </form>
    </div>
  );
}

