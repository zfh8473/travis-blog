"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import { updateArticleAction } from "@/lib/actions/article";

/**
 * Category interface for form state.
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Tag interface for form state.
 */
export interface Tag {
  id: string;
  name: string;
  slug: string;
}

/**
 * Article interface for loaded article data.
 */
export interface Article {
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
 * Props for EditArticleClient component.
 */
interface EditArticleClientProps {
  article: Article;
  categories: Category[];
  tags: Tag[];
}

/**
 * Article edit client component.
 * 
 * Handles form interactions and submission for editing articles.
 * 
 * @component
 */
export default function EditArticleClient({
  article: initialArticle,
  categories: initialCategories,
  tags: initialTags,
}: EditArticleClientProps) {
  const router = useRouter();

  // Form state - initialized from props
  const [title, setTitle] = useState(initialArticle.title || "");
  const [content, setContent] = useState(initialArticle.content || "");
  const [excerpt, setExcerpt] = useState(initialArticle.excerpt || "");
  const [categoryId, setCategoryId] = useState(initialArticle.categoryId || "");
  const [tagIds, setTagIds] = useState<string[]>(
    initialArticle.tags?.map((tag) => tag.id) || []
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    initialArticle.status || "DRAFT"
  );

  // Data state
  const [categories] = useState<Category[]>(initialCategories);
  const [tags] = useState<Tag[]>(initialTags);

  // Tag input state
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Error state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete state
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * UUID validation regex pattern.
   */
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Validate UUID format.
   */
  const isValidUUID = (value: string): boolean => {
    return UUID_REGEX.test(value);
  };

  /**
   * Validate form data before submission.
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate title (required)
    if (!title.trim()) {
      newErrors.title = "标题不能为空";
    } else if (title.length > 200) {
      newErrors.title = "标题不能超过 200 个字符";
    }

    // Validate content (required)
    if (!content.trim()) {
      newErrors.content = "内容不能为空";
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
      const invalidTagIds = tagIds.filter((id) => !isValidUUID(id));
      if (invalidTagIds.length > 0) {
        newErrors.tagIds = "标签 ID 格式无效";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>, newStatus: "DRAFT" | "PUBLISHED") => {
    e.preventDefault();

    // Clear previous errors and success message
    setErrors({});
    setSubmitError(null);
    setSuccessMessage(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Prepare request body
      const requestBody = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || undefined,
        categoryId: categoryId || undefined,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
        status: newStatus,
      };

      // Call Server Action
      const result = await updateArticleAction(initialArticle.id, requestBody);

      if (!result.success) {
        setSubmitError(result.error.message || "更新文章失败，请重试");
        setSubmitting(false);
        return;
      }

      // Success - redirect to article list
      setSuccessMessage("文章更新成功！");
      setTimeout(() => {
        router.push("/admin/articles");
      }, 1000);
    } catch (error) {
      console.error("Error updating article:", error);
      setSubmitError("更新文章失败，请刷新页面重试");
      setSubmitting(false);
    }
  };

  /**
   * Handle tag input change and show suggestions.
   */
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);

    if (value.trim()) {
      // Filter tags that match input and are not already selected
      const filtered = tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(value.toLowerCase()) &&
          !tagIds.includes(tag.id)
      );
      setTagSuggestions(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
    }
  };

  /**
   * Add tag to selected tags.
   */
  const handleAddTag = (tagId: string) => {
    if (!tagIds.includes(tagId)) {
      setTagIds([...tagIds, tagId]);
    }
    setTagInput("");
    setTagSuggestions([]);
    setShowTagSuggestions(false);
  };

  /**
   * Remove tag from selected tags.
   */
  const handleRemoveTag = (tagId: string) => {
    setTagIds(tagIds.filter((id) => id !== tagId));
  };

  /**
   * Get selected tag names for display.
   */
  const selectedTags = tags.filter((tag) => tagIds.includes(tag.id));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">编辑文章</h1>
        <Link
          href="/admin/articles"
          className="text-blue-600 hover:text-blue-800"
        >
          ← 返回文章列表
        </Link>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {submitError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {submitError}
        </div>
      )}

      {/* Delete error message */}
      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {deleteError}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, status)}>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              标题 *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.title
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              disabled={submitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              内容 *
            </label>
            <MarkdownEditor
              initialContent={content}
              onChange={(html) => setContent(html)}
              placeholder="开始写作..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any, "DRAFT");
              }}
              disabled={submitting}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "保存中..." : "保存为草稿"}
            </button>
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e as any, "PUBLISHED");
              }}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "发布中..." : "发布"}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
              摘要（可选）
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="输入文章摘要（最多 500 个字符）"
              rows={3}
              maxLength={500}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.excerpt
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              disabled={submitting}
            />
            {errors.excerpt && (
              <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              分类（可选）
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.categoryId
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
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

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">
              标签（可选）
            </label>
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={handleTagInputChange}
              placeholder="输入标签并按 Enter 创建"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
            {showTagSuggestions && tagSuggestions.length > 0 && (
              <ul className="mt-2 border border-gray-300 rounded-lg bg-white max-h-48 overflow-y-auto">
                {tagSuggestions.map((tag) => (
                  <li
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            )}
            {selectedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="text-blue-600 hover:text-blue-800"
                      disabled={submitting}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.tagIds && (
              <p className="mt-1 text-sm text-red-600">{errors.tagIds}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">状态 *</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={status === "DRAFT"}
                  onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                  className="mr-2"
                  disabled={submitting}
                />
                草稿
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="PUBLISHED"
                  checked={status === "PUBLISHED"}
                  onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                  className="mr-2"
                  disabled={submitting}
                />
                已发布
              </label>
            </div>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

