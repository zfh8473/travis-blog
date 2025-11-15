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
      return `${baseClasses} bg-blue-100 text-blue-900 font-medium`;
    }
    return `${baseClasses} text-gray-700 hover:bg-gray-100`;
  };

  const navItems = [
    { href: "/admin", label: "仪表板" },
    { href: "/admin/articles", label: "文章管理" },
    { href: "/admin/media", label: "媒体管理" },
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

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-4 w-full text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <span className="font-medium text-gray-900">菜单</span>
          <svg
            className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? "rotate-180" : ""}`}
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
          <nav className="p-2 border-t border-gray-200">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={getLinkClasses(item.href)}
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
