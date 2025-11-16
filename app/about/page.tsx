import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

/**
 * About page.
 * 
 * Displays information about the blog and author.
 * 
 * @component
 * @route /about
 */
export default async function AboutPage() {
  // Get admin user info for author section
  const adminUser = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
    select: {
      name: true,
      bio: true,
      image: true,
    },
    orderBy: {
      createdAt: "asc", // Get the first admin (likely the blog owner)
    },
  });

  // Technology stack
  const techStack = [
    { name: "Next.js", description: "React 框架，服务端渲染" },
    { name: "TypeScript", description: "类型安全的 JavaScript" },
    { name: "Tailwind CSS", description: "实用优先的 CSS 框架" },
    { name: "PostgreSQL", description: "关系型数据库" },
    { name: "Prisma", description: "现代 ORM 工具" },
    { name: "Vercel", description: "部署平台" },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
      {/* Page header */}
      <header className="mb-8">
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📖</span>
            <h1 className="text-4xl font-bold text-slate-900">关于</h1>
          </div>
          <p className="text-slate-600">
            了解这个博客和背后的故事
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - About blog */}
        <div className="space-y-6">
          {/* About blog card */}
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🚀</span>
              <h2 className="text-2xl font-bold text-slate-900">关于 Travis-Blog</h2>
            </div>
            <div className="border-t border-slate-200/80 mb-4" />
            <p className="text-slate-700 leading-relaxed mb-4">
              Travis-Blog 是一个个人博客平台，旨在通过完整的开发流程实现学习、分享和建立个人品牌的目标。
              这是一个实验性学习项目，使用现代 Web 技术栈构建。
            </p>
            <p className="text-slate-700 leading-relaxed">
              通过这个项目，我不仅学习了现代 Web 开发技术，也建立了一个完全可控的平台来分享思考、学习和生活。
            </p>
          </div>

          {/* Project goals card */}
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎯</span>
              <h2 className="text-2xl font-bold text-slate-900">项目目标</h2>
            </div>
            <div className="border-t border-slate-200/80 mb-4" />
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <div>
                  <span className="font-semibold text-slate-900">技术学习实践</span>
                  <p className="text-slate-600 text-sm mt-1">
                    通过完整的项目实践掌握现代开发技术
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <div>
                  <span className="font-semibold text-slate-900">满足表达需求</span>
                  <p className="text-slate-600 text-sm mt-1">
                    提供一个完全可控的平台来分享思考、学习和生活
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">•</span>
                <div>
                  <span className="font-semibold text-slate-900">建立个人品牌</span>
                  <p className="text-slate-600 text-sm mt-1">
                    建立独立的个人平台，展示个人思考和学习过程
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right column - Author & Tech stack */}
        <div className="space-y-6">
          {/* Author card */}
          {adminUser && (
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">👤</span>
                <h2 className="text-2xl font-bold text-slate-900">关于作者</h2>
              </div>
              <div className="border-t border-slate-200/80 mb-4" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {adminUser.name || "Travis"}
                </h3>
                {adminUser.bio && (
                  <p className="text-slate-600 text-sm leading-relaxed mb-3">
                    {adminUser.bio}
                  </p>
                )}
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <a
                    href="mailto:zfh8473@gmail.com"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    zfh8473@gmail.com
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Tech stack card */}
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⚙️</span>
              <h2 className="text-2xl font-bold text-slate-900">技术栈</h2>
            </div>
            <div className="border-t border-slate-200/80 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="text-blue-600 mt-0.5">▸</span>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">{tech.name}</span>
                    <p className="text-slate-600 text-xs mt-0.5">{tech.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact card */}
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💬</span>
              <h2 className="text-2xl font-bold text-slate-900">联系方式</h2>
            </div>
            <div className="border-t border-slate-200/80 mb-4" />
            <p className="text-slate-700 leading-relaxed mb-4">
              如果你有任何问题或建议，欢迎通过留言功能或者发邮件与我联系。
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <span>查看文章</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

