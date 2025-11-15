import Link from "next/link";

/**
 * 404 Not Found page for article detail.
 *
 * Displays when an article is not found or not published.
 *
 * @component
 */
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-8 rounded-lg text-center">
        <h1 className="text-3xl font-bold mb-4">文章不存在</h1>
        <p className="text-lg mb-6">
          您访问的文章不存在或已被删除。
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

