"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";

/**
 * Search input component for the search page.
 * 
 * Allows users to enter search queries and submit them.
 * 
 * @component
 */
export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize search query from URL params
  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchQuery(query);
  }, [searchParams]);

  /**
   * Handles search form submission.
   * Redirects to search results page with query parameter.
   */
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="输入关键词搜索文章..."
          className="w-full pl-10 pr-4 py-3 text-base border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[44px]"
          aria-label="搜索文章"
          autoFocus
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              router.push("/search");
            }}
            className="absolute right-3 top-0 bottom-0 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
            aria-label="清除搜索"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={!searchQuery.trim()}
        className="mt-4 w-full sm:w-auto px-6 py-3 text-base font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
      >
        搜索
      </button>
    </form>
  );
}

