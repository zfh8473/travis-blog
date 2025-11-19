"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Logo demo page.
 * 
 * Displays different logo options embedded in a homepage-like layout
 * so the user can see how each logo looks in context.
 * 
 * @component
 * @route /demo/logo
 */
export default function LogoDemoPage() {
  const [selectedLogo, setSelectedLogo] = useState<number | null>(null);

  /**
   * Logo component for each option.
   */
  const LogoOption = ({ id, name, description, svgContent }: {
    id: number;
    name: string;
    description: string;
    svgContent: React.ReactNode;
  }) => {
    const isSelected = selectedLogo === id;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
           onClick={() => setSelectedLogo(isSelected ? null : id)}>
        <div className="p-6">
          <div className="flex items-center justify-center h-32 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg mb-4">
            {svgContent}
          </div>
          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{name}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{description}</p>
          {isSelected && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
              ✓ 已选中
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Homepage header mockup with logo.
   */
  const HomepageHeader = ({ logoId }: { logoId: number }) => {
    const getLogo = () => {
      switch (logoId) {
        case 1:
          return (
            <svg width="120" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
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
        case 2:
          return (
            <svg width="120" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
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
        case 3:
          return (
            <svg width="120" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
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
        case 4:
          return (
            <svg width="120" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
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
        case 5:
          return (
            <svg width="120" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
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
        case 6:
          return (
            <svg width="120" height="40" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto">
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
          return <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">Travis Blog</div>;
      }
    };

    return (
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              {getLogo()}
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">首页</Link>
              <Link href="/articles" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">文章</Link>
              <Link href="/tags" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">标签</Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">关于</Link>
            </nav>

            {/* Search Icon (Mobile) */}
            <Link href="/search" className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
    );
  };

  /**
   * Homepage content mockup.
   */
  const HomepageContent = () => (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          欢迎来到 Travis Blog
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          这是一个技术博客，分享编程、技术和生活的思考。
        </p>

        {/* Sample Articles */}
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <article key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                示例文章标题 {i}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                这是文章的摘要内容，用于展示文章卡片的效果...
              </p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>2025-01-XX</span>
                <span className="mx-2">·</span>
                <span>技术</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Logo 设计方案预览
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            点击下方 logo 选项查看在首页中的实际效果
          </p>
        </div>

        {/* Logo Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <LogoOption
            id={1}
            name="风 · 书韵"
            description="书法笔触，展现东方传统文化底蕴"
            svgContent={
              <svg width="120" height="120" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
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
            }
          />
          <LogoOption
            id={2}
            name="風 · 印章"
            description="传统篆刻印章风格，古朴雅致"
            svgContent={
              <svg width="120" height="120" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
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
            }
          />
          <LogoOption
            id={3}
            name="风 · 水墨"
            description="水墨晕染效果，意境悠远"
            svgContent={
              <svg width="120" height="120" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
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
            }
          />
          <LogoOption
            id={4}
            name="风 · 徽章"
            description="圆形徽章设计，庄重典雅"
            svgContent={
              <svg width="120" height="120" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
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
            }
          />
          <LogoOption
            id={5}
            name="風 · 竹简"
            description="竹简卷轴风格，古色古香"
            svgContent={
              <svg width="120" height="120" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
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
            }
          />
          <LogoOption
            id={6}
            name="风 · 简雅"
            description="极简线条，现代与传统的融合"
            svgContent={
              <svg width="120" height="120" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
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
            }
          />
        </div>

        {/* Preview Section */}
        {selectedLogo && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                首页预览 - {selectedLogo === 1 ? "风 · 书韵" : 
                           selectedLogo === 2 ? "風 · 印章" :
                           selectedLogo === 3 ? "风 · 水墨" :
                           selectedLogo === 4 ? "风 · 徽章" :
                           selectedLogo === 5 ? "風 · 竹简" :
                           "风 · 简雅"}
              </h2>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                  <HomepageHeader logoId={selectedLogo} />
                  <HomepageContent />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Section - Show all logos side by side */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            所有 Logo 在 Header 中的对比
          </h2>
          <div className="space-y-8">
            {[1, 2, 3, 4, 5, 6].map((logoId) => (
              <div key={logoId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {logoId === 1 ? "方案 1: 风 · 书韵" :
                   logoId === 2 ? "方案 2: 風 · 印章" :
                   logoId === 3 ? "方案 3: 风 · 水墨" :
                   logoId === 4 ? "方案 4: 风 · 徽章" :
                   logoId === 5 ? "方案 5: 風 · 竹简" :
                   "方案 6: 风 · 简雅"}
                </div>
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                  <HomepageHeader logoId={logoId} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

