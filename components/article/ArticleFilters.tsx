"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

/**
 * Category interface.
 */
interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Article filters component.
 * 
 * Provides sort filter for article list.
 * Category filtering is available via navigation bar.
 * 
 * @component
 * @param props - Component props
 * @param props.categories - Array of categories from database (unused, kept for compatibility)
 */
export default function ArticleFilters({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState(searchParams.get("sort") || "最新");
  const [isPending, startTransition] = useTransition();

  // Sync with URL params on mount
  useEffect(() => {
    setSort(searchParams.get("sort") || "最新");
  }, [searchParams]);

  /**
   * Handles sort filter change.
   */
  const handleSortChange = (value: string) => {
    setSort(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "最新") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page"); // Reset to first page when sorting
    
    // Build new URL
    const newUrl = params.toString() ? `/?${params.toString()}` : "/";
    
    // Use router.push to navigate and trigger Server Component re-render
    // router.push automatically triggers a refresh for Server Components
    startTransition(() => {
      router.push(newUrl);
    });
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <h1 className="text-4xl font-bold text-slate-900">最新文章</h1>
      
      <div className="flex flex-wrap gap-4 items-center">
        {/* Sort filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-filter" className="text-sm font-semibold text-slate-600 whitespace-nowrap">
            排序
          </label>
          <div className="relative">
            <select
              id="sort-filter"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              disabled={isPending}
              className="appearance-none pl-4 pr-10 py-2 text-sm font-normal text-slate-900 border border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="最新">最新</option>
              <option value="最早">最早</option>
              <option value="最热">最热</option>
              <option value="最多评论">最多评论</option>
            </select>
            <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

