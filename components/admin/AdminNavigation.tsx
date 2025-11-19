"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * Admin navigation component.
 * 
 * Provides navigation menu for admin pages with active route highlighting.
 * Client component to enable usePathname hook for active route detection.
 * Includes responsive mobile menu with hamburger icon.
 * 
 * @component
 */
export default function AdminNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * Checks if a route is active.
   * 
   * @param href - Route path to check
   * @returns true if route is active, false otherwise
   */
  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  /**
   * Gets CSS classes for navigation link based on active state.
   * 
   * @param href - Route path
   * @returns CSS classes string
   */
  const getLinkClasses = (href: string) => {
    const baseClasses = "block px-4 py-2 rounded-lg transition-colors";
    if (isActive(href)) {
      return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 font-medium`;
    }
    return `${baseClasses} text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`;
  };

  const navItems = [
    { href: "/admin", label: "仪表板" },
    { href: "/admin/articles", label: "文章管理" },
    { href: "/admin/media", label: "媒体管理" },
    // Note: Comment management is available on the dashboard
    // The /admin/comments page is kept for future expansion (viewing all comments, search, filters, etc.)
    // { href: "/admin/comments", label: "评论管理" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={getLinkClasses(item.href)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Navigation - 优化移动端显示 */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full text-left flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
          aria-label="切换菜单"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="font-medium text-gray-900 dark:text-gray-100">菜单</span>
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isMobileMenuOpen ? "rotate-180" : ""}`}
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
        </button>
        {isMobileMenuOpen && (
          <nav className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${getLinkClasses(item.href)} min-h-[44px] flex items-center dark:text-gray-300 dark:hover:bg-gray-700`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}
