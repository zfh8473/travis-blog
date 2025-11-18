"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { createCommentSchema } from "@/lib/validations/comment";

interface CommentFormProps {
  articleId: string;
  slug: string;
  parentId?: string;
  onSuccess: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({
  articleId,
  slug,
  parentId,
  onSuccess,
  onCancel,
  placeholder = "写下你的评论...",
}: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate input
    const validationResult = createCommentSchema.safeParse({
      content,
      articleId,
      userId: session?.user?.id,
      parentId,
      authorName: session?.user ? undefined : authorName,
    });

    if (!validationResult.success) {
      setError(validationResult.error.issues[0]?.message || "验证失败");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/articles/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          articleId,
          parentId,
          authorName: session?.user ? undefined : authorName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "提交失败");
      }

      setContent("");
      setAuthorName("");
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "发生未知错误";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!session?.user && (
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-gray-700">
            昵称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="authorName"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            placeholder="请输入您的昵称"
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="content" className="sr-only">
          评论内容
        </label>
        <textarea
          id="content"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          placeholder={placeholder}
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            取消
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? "提交中..." : "发表评论"}
        </button>
      </div>
    </form>
  );
}
