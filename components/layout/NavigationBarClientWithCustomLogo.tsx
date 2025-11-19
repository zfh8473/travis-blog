"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { useUserRole } from "@/lib/hooks/useUserRole";

/**
 * Navigation bar client component with custom logo.
 * 
 * Similar to NavigationBarClient but accepts a logoId prop to display different logo options.
 * 
 * @component
 */
export default function NavigationBarClientWithCustomLogo({
  isAuthenticated: serverIsAuthenticated,
  isAdmin: serverIsAdmin,
  categoryHref = "/articles",
  logoId,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
  categoryHref?: string;
  logoId: number;
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
   */
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
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

  /**
   * Renders the custom logo based on logoId.
   */
  const renderLogo = () => {
    const logoSize = "w-10 h-10"; // Same size as original T logo
    const logoSize1 = "w-12 h-12"; // Slightly larger for option 1 (风 · 书韵)
    
    switch (logoId) {
      case 1: // 风 · 书韵
        return (
          <svg width="48" height="48" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className={logoSize1}>
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
        );
      case 2: // 風 · 印章
        return (
          <svg width="40" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className={logoSize}>
            <defs>
              <filter id="roughen">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} result="noise" seed={2}/>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={2}/>
              </filter>
            </defs>
            <rect x="30" y="30" width="80" height="80" rx="4" fill="none" stroke="#991b1b" strokeWidth="3" filter="url(#roughen)"/>
            <text x="70" y="82" fontSize="48" fontWeight="bold" textAnchor="middle" fill="#991b1b" fontFamily="serif" filter="url(#roughen)">風</text>
            <text x="70" y="100" fontSize="10" textAnchor="middle" fill="#991b1b" fontFamily="serif">TRAVIS</text>
          </svg>
        );
      case 3: // 风 · 水墨
        return (
          <svg width="40" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className={logoSize}>
            <defs>
              <radialGradient id="ink1" cx="50%" cy="50%">
                <stop offset="0%" style={{stopColor:"#1e293b",stopOpacity:0.9}} />
                <stop offset="100%" style={{stopColor:"#475569",stopOpacity:0.6}} />
              </radialGradient>
              <filter id="ink-blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.5"/>
              </filter>
            </defs>
            <path d="M35 38 L100 38 Q105 38 105 43 Q105 48 100 48 L35 48 Q30 48 30 43 Q30 38 35 38" fill="url(#ink1)" filter="url(#ink-blur)"/>
            <path d="M35 62 L75 62 Q80 62 80 67 Q80 72 75 72 L35 72 Q30 72 30 67 Q30 62 35 62" fill="url(#ink1)" filter="url(#ink-blur)"/>
            <ellipse cx="66" cy="70" rx="6" ry="32" fill="url(#ink1)" filter="url(#ink-blur)"/>
            <circle cx="85" cy="88" r="4" fill="#1e293b" opacity={0.7}/>
            <circle cx="95" cy="88" r="4" fill="#1e293b" opacity={0.7}/>
            <path d="M42 88 Q52 98 62 90" stroke="#475569" strokeWidth="5" fill="none" strokeLinecap="round" filter="url(#ink-blur)"/>
          </svg>
        );
      case 4: // 风 · 徽章
        return (
          <svg width="40" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className={logoSize}>
            <defs>
              <linearGradient id="trad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:"#78350f",stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:"#ca8a04",stopOpacity:1}} />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r="45" fill="none" stroke="url(#trad4)" strokeWidth="2.5"/>
            <circle cx="70" cy="70" r="40" fill="none" stroke="url(#trad4)" strokeWidth="1"/>
            <rect x="45" y="50" width="50" height="3" rx="1.5" fill="url(#trad4)"/>
            <rect x="45" y="63" width="35" height="3" rx="1.5" fill="url(#trad4)"/>
            <rect x="66" y="53" width="3" height="30" rx="1.5" fill="url(#trad4)"/>
            <circle cx="82" cy="75" r="2" fill="#78350f"/>
            <circle cx="89" cy="75" r="2" fill="#78350f"/>
            <path d="M50 75 Q57 82 64 76" stroke="#ca8a04" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        );
      case 5: // 風 · 竹简
        return (
          <svg width="40" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className={logoSize}>
            <defs>
              <linearGradient id="bamboo" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor:"#14532d",stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:"#15803d",stopOpacity:1}} />
              </linearGradient>
            </defs>
            <rect x="25" y="35" width="90" height="70" rx="3" fill="none" stroke="url(#bamboo)" strokeWidth="2"/>
            <rect x="30" y="40" width="80" height="60" rx="2" fill="#fef3c7" opacity={0.3}/>
            <rect x="20" y="30" width="5" height="80" rx="2.5" fill="url(#bamboo)"/>
            <rect x="115" y="30" width="5" height="80" rx="2.5" fill="url(#bamboo)"/>
            <text x="70" y="80" fontSize="40" fontWeight="bold" textAnchor="middle" fill="#14532d" fontFamily="serif">風</text>
          </svg>
        );
      case 6: // 风 · 简雅
        return (
          <svg width="40" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className={logoSize}>
            <defs>
              <linearGradient id="minimal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:"#44403c",stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:"#78716c",stopOpacity:1}} />
              </linearGradient>
            </defs>
            <line x1="40" y1="45" x2="100" y2="45" stroke="url(#minimal)" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="40" y1="62" x2="80" y2="62" stroke="url(#minimal)" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="68" y1="47" x2="68" y2="95" stroke="url(#minimal)" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="88" cy="78" r="2.5" fill="#44403c"/>
            <circle cx="96" cy="78" r="2.5" fill="#44403c"/>
            <path d="M46 78 Q56 88 66 80" stroke="#78716c" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <text x="70" y="110" fontSize="11" textAnchor="middle" fill="#44403c" fontFamily="serif" letterSpacing="2">TRAVIS</text>
          </svg>
        );
      default:
        // Fallback to original T logo
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg leading-none">T</span>
          </div>
        );
    }
  };

  return (
    <nav className="sticky top-0 z-50 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm rounded-b-lg">
          <div className="flex items-center justify-between h-16 gap-8 px-6">
            {/* Logo Section with Custom Logo */}
            <Link href="/" className="flex items-center gap-3 no-underline group flex-shrink-0">
              {renderLogo()}
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
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  pathname.startsWith("/tags")
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                标签
                {pathname.startsWith("/tags") && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
              <Link
                href="/about"
                className={`text-sm font-medium transition-colors relative ${
                  pathname.startsWith("/about")
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                关于
                {pathname.startsWith("/about") && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-4 flex-shrink-0">
              {!isAuthenticated ? (
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  登录
                </Link>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    个人中心
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/articles/new"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      发布文章
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Mobile Search Icon */}
            <Link
              href="/search"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
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

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 px-6 py-4 space-y-3">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`block text-sm font-medium ${
                  isActive("/")
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                首页
              </Link>
              <Link
                href={categoryHref}
                onClick={closeMobileMenu}
                className={`block text-sm font-medium ${
                  pathname.startsWith("/articles/category")
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                分类
              </Link>
              <Link
                href="/tags"
                onClick={closeMobileMenu}
                className={`block text-sm font-medium ${
                  pathname.startsWith("/tags")
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                标签
              </Link>
              <Link
                href="/about"
                onClick={closeMobileMenu}
                className={`block text-sm font-medium ${
                  pathname.startsWith("/about")
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                关于
              </Link>
              <div className="pt-3 border-t border-slate-200">
                {!isAuthenticated ? (
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="block text-sm font-medium text-slate-600 hover:text-blue-600"
                  >
                    登录
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className="block text-sm font-medium text-slate-600 hover:text-blue-600 mb-2"
                    >
                      个人中心
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/articles/new"
                        onClick={closeMobileMenu}
                        className="block text-sm font-medium text-white bg-blue-600 rounded-lg px-4 py-2 text-center hover:bg-blue-700 transition-colors"
                      >
                        发布文章
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

