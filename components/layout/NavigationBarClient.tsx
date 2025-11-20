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
            {/* 风 · 书韵 Logo */}
            <svg width="48" height="48" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
              <defs>
                <linearGradient id="trad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:"#92400e",stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:"#d97706",stopOpacity:1}} />
                </linearGradient>
              </defs>
              <path d="M35 35 L105 35 Q110 35 110 40 L110 42 Q110 47 105 47 L35 47 Q30 47 30 42 L30 40 Q30 35 35 35" fill="url(#trad1)"/>
              <path d="M35 60 L80 60 Q85 60 85 65 L85 67 Q85 72 80 72 L35 72 Q30 72 30 67 L30 65 Q30 60 35 60" fill="url(#trad1)"/>
              <rect x="62" y="42" width="8" height="58" rx="4" fill="url(#trad1)"/>
              <ellipse cx="88" cy="85" rx="4" ry="5" fill="#92400e" opacity={0.8}/>
              <ellipse cx="98" cy="85" rx="4" ry="5" fill="#92400e" opacity={0.8}/>
              <path d="M40 85 Q50 95 60 87" stroke="#d97706" strokeWidth="6" fill="none" strokeLinecap="round"/>
            </svg>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                Travis-Blog
              </span>
              <span className="text-xs text-slate-500 leading-tight hidden sm:block">
                分享技术与思考
              </span>
            </div>
          </Link>

          {/* Search Box - Desktop and Tablet */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-[400px] relative"
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

          {/* Desktop and Tablet Navigation Links */}
          <div className="hidden md:flex items-center gap-8 flex-shrink-0">
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

          {/* Desktop and Tablet Action Buttons */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
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

          {/* Mobile Action Buttons - 手机端显示搜索图标和发布文章按钮（管理员） */}
          <div className="md:hidden flex items-center gap-2">
            {/* 搜索图标 */}
            <Link
              href="/search"
              className="p-2 text-slate-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="搜索文章"
            >
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>
            
            {/* 发布文章按钮 - 仅管理员可见 */}
            {isAuthenticated && isAdmin && (
              <Link
                href="/admin/articles/new"
                className="p-2 text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="发布文章"
                title="发布文章"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu - 手机端菜单（平板端和桌面端不显示） */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md">
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

