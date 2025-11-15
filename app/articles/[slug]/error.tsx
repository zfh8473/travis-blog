"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary component for article detail page.
 *
 * Displays user-friendly error message when article loading fails.
 *
 * @component
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error("Article detail page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">加载文章失败</h2>
        <p className="text-lg mb-6">
          无法加载文章内容，请稍后重试。
        </p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            重试
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

