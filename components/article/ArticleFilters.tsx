"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

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
 * Provides category and sort filters for article list.
 * 
 * @component
 * @param props - Component props
 * @param props.categories - Array of categories from database
 */
export default function ArticleFilters({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "全部");
  const [sort, setSort] = useState(searchParams.get("sort") || "最新");

  // Sync with URL params on mount
  useEffect(() => {
    setCategory(searchParams.get("category") || "全部");
    setSort(searchParams.get("sort") || "最新");
  }, [searchParams]);

  /**
   * Handles category filter change.
   */
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "全部") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    params.delete("page"); // Reset to first page when filtering
    router.push(`/?${params.toString()}`);
  };

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
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <h1 className="text-4xl font-bold text-slate-900">最新文章</h1>
      
      <div className="flex flex-wrap gap-4 items-center">
        {/* Category filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="category-filter" className="text-sm font-semibold text-slate-600 whitespace-nowrap">
            分类
          </label>
          <div className="relative">
            <select
              id="category-filter"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 text-sm font-normal text-slate-900 border border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer min-w-[120px]"
            >
              <option value="全部">全部</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
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
              className="appearance-none pl-4 pr-10 py-2 text-sm font-normal text-slate-900 border border-slate-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer min-w-[120px]"
            >
              <option value="最新">最新</option>
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

