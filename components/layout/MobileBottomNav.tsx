"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/lib/hooks/useUserRole";

/**
 * Mobile bottom navigation bar component.
 * 
 * Displays fixed bottom navigation on mobile devices only (< 768px).
 * Tablet and desktop devices use the full top navigation bar instead.
 * Contains: 首页, 分类, 标签, 登录/我的 (搜索在顶部导航栏)
 * 
 * @component
 */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, userName, session } = useUserRole();

  /**
   * Checks if a navigation link is active.
   */
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    // Special handling for /articles - it redirects to category pages
    if (href === "/articles") {
      return pathname.startsWith("/articles/category");
    }
    return pathname.startsWith(href);
  };

  // 动态生成导航项，根据登录状态调整"我的"项
  const navItems = [
    {
      href: "/",
      label: "首页",
      icon: (
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: "/articles",
      label: "分类",
      icon: (
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ),
    },
    {
      href: "/tags",
      label: "标签",
      icon: (
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
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
    },
    {
      href: isAuthenticated ? "/profile" : "/login",
      label: isAuthenticated ? (userName || "我的") : "登录",
      icon: isAuthenticated ? (
        // 已登录：显示用户头像图标
        session?.user?.image ? (
          <img
            src={session.user.image}
            alt={userName || "用户"}
            className="w-5 h-5 rounded-full object-cover"
          />
        ) : (
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )
      ) : (
        // 未登录：显示登录图标
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
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed bottom nav */}
      {/* 只在手机端显示（< 768px），平板端和桌面端不显示 */}
      <div className="md:hidden h-16" />
      
      {/* Mobile bottom navigation - 只在手机端显示 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-gray-700/80 shadow-lg">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] transition-colors ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <div
                  className={`transition-transform flex items-center justify-center ${
                    active ? "scale-110" : "scale-100"
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-xs font-medium truncate max-w-[60px] text-center">{item.label}</span>
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

