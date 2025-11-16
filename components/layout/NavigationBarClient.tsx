"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { useUserRole } from "@/lib/hooks/useUserRole";

/**
 * Navigation bar client component for interactive features.
 * 
 * Handles:
 * - Mobile menu toggle
 * - Search functionality
 * - Client-side navigation
 * 
 * @component
 * @param props - Component props
 * @param props.isAuthenticated - Whether user is authenticated (from server)
 * @param props.isAdmin - Whether user is admin (from server)
 */
export default function NavigationBarClient({
  isAuthenticated: serverIsAuthenticated,
  isAdmin: serverIsAdmin,
  categoryHref = "/articles",
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
  categoryHref?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated: clientIsAuthenticated, isAdmin: clientIsAdmin } = useUserRole();
  
  // Use client-side session if available (more up-to-date), fallback to server props
  const isAuthenticated = clientIsAuthenticated || serverIsAuthenticated;
  const isAdmin = clientIsAdmin || serverIsAdmin;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Handles search form submission.
   * Redirects to search results page with query parameter.
   */
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMobileMenuOpen(false); // Close mobile menu after search
    }
  };

  /**
   * Checks if a navigation link is active.
   */
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  /**
   * Toggles mobile menu.
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  /**
   * Closes mobile menu when a link is clicked.
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 mb-8">
      {/* 导航栏背景和内容区域 - 与主页内容区域对齐，非全宽 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm rounded-b-lg">
          <div className="flex items-center justify-between h-16 gap-8 px-6">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 no-underline group flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg leading-none">T</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                Travis-Blog
              </span>
              <span className="text-xs text-slate-500 leading-tight hidden sm:block">
                分享技术与思考
              </span>
            </div>
          </Link>

          {/* Search Box - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex flex-1 max-w-[400px] relative"
          >
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-slate-400"
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
                      placeholder="搜索文章..."
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all search-input-focus"
                      aria-label="搜索文章"
                    />
          </form>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors relative ${
                isActive("/")
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              首页
              {isActive("/") && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
            <Link
              href={categoryHref}
              className={`text-sm font-medium transition-colors relative ${
                pathname.startsWith("/articles/category")
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              分类
              {pathname.startsWith("/articles/category") && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
            <Link
              href="/tags"
              className={`text-sm font-medium transition-colors relative ${
                isActive("/tags")
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              标签
              {isActive("/tags") && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors relative ${
                isActive("/about")
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              关于
              {isActive("/about") && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            {/* 登录按钮 - 未登录时显示，已登录时显示"个人中心" */}
            {!isAuthenticated ? (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all btn-hover"
              >
                登录
              </Link>
            ) : (
              <Link
                href="/profile"
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all btn-hover"
              >
                个人中心
              </Link>
            )}
            {/* 发布文章按钮 - 仅管理员可见 */}
            {isAuthenticated && isAdmin && (
              <Link
                href="/admin/articles/new"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all btn-hover"
              >
                发布文章
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-slate-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="切换菜单"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
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
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="p-4 border-b border-slate-200">
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-slate-400"
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
                          placeholder="搜索文章..."
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[44px] search-input-focus"
                          aria-label="搜索文章"
                        />
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <div className="p-4 space-y-1">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center ${
                  isActive("/")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                首页
              </Link>
              <Link
                href={categoryHref}
                onClick={closeMobileMenu}
                className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center ${
                  pathname.startsWith("/articles/category")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                分类
              </Link>
              <Link
                href="/tags"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center ${
                  isActive("/tags")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                标签
              </Link>
              <Link
                href="/about"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center ${
                  isActive("/about")
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                关于
              </Link>
            </div>

            {/* Mobile Action Buttons */}
            <div className="p-4 pt-0 space-y-2 border-t border-slate-200">
              {/* 登录按钮 - 未登录时显示，已登录时显示"个人中心" */}
              {!isAuthenticated ? (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block w-full px-4 py-3 text-sm font-medium text-center text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all min-h-[44px] flex items-center justify-center"
                >
                  登录
                </Link>
              ) : (
                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className="block w-full px-4 py-3 text-sm font-medium text-center text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all min-h-[44px] flex items-center justify-center"
                >
                  个人中心
                </Link>
              )}
              {/* 发布文章按钮 - 仅管理员可见 */}
              {isAuthenticated && isAdmin && (
                <Link
                  href="/admin/articles/new"
                  onClick={closeMobileMenu}
                  className="block w-full px-4 py-3 text-sm font-semibold text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all min-h-[44px] flex items-center justify-center"
                >
                  发布文章
                </Link>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </nav>
  );
}

