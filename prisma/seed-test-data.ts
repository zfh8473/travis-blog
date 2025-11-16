import { PrismaClient, Role, ArticleStatus } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

/**
 * Seed script to create test data for development and testing.
 * 
 * Creates:
 * - Admin user
 * - Categories (技术, 生活, 思考)
 * - Tags (Next.js, React, TypeScript, 个人成长, 职业发展, etc.)
 * - Published articles with various categories and tags
 * 
 * Usage:
 * ```bash
 * npx tsx prisma/seed-test-data.ts
 * ```
 */
async function main() {
  console.log("🌱 Starting test data seed...");

  // 1. Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Travis";

  const hashedPassword = await hashPassword(adminPassword);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
      name: adminName,
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // 2. Create categories
  const categories = [
    { name: "技术", slug: "tech" },
    { name: "生活", slug: "life" },
    { name: "思考", slug: "thoughts" },
  ];

  const createdCategories = await Promise.all(
    categories.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );
  console.log(`✅ Created ${createdCategories.length} categories`);

  // 3. Create tags
  const tags = [
    { name: "Next.js", slug: "nextjs" },
    { name: "React", slug: "react" },
    { name: "TypeScript", slug: "typescript" },
    { name: "Web开发", slug: "web-development" },
    { name: "个人成长", slug: "personal-growth" },
    { name: "职业发展", slug: "career" },
    { name: "年度总结", slug: "yearly-summary" },
    { name: "反思", slug: "reflection" },
    { name: "CSS", slug: "css" },
    { name: "Tailwind", slug: "tailwind" },
    { name: "前端", slug: "frontend" },
    { name: "数据库", slug: "database" },
    { name: "PostgreSQL", slug: "postgresql" },
  ];

  const createdTags = await Promise.all(
    tags.map((tag) =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag,
      })
    )
  );
  console.log(`✅ Created ${createdTags.length} tags`);

  // 4. Create articles
  const articles = [
    {
      title: "Next.js 14 新特性深度解析",
      slug: "nextjs-14-new-features",
      excerpt: "探索 Next.js 14 带来的新特性，包括 Server Components、App Router 的改进，以及性能优化的最佳实践。本文将深入分析这些新功能如何提升开发体验和应用性能。",
      content: `<h1>Next.js 14 新特性深度解析</h1>
<p>Next.js 14 带来了许多令人兴奋的新特性，让我们一起来探索这些改进。</p>
<h2>Server Components</h2>
<p>Server Components 是 Next.js 14 的核心特性之一，它允许我们在服务器端渲染组件，减少客户端 JavaScript 包的大小。</p>
<h2>App Router 改进</h2>
<p>App Router 在 Next.js 14 中得到了显著改进，提供了更好的性能和开发体验。</p>
<h2>性能优化</h2>
<p>Next.js 14 引入了多项性能优化，包括更快的构建时间和更好的运行时性能。</p>`,
      categorySlug: "tech",
      tagSlugs: ["nextjs", "react", "web-development"],
      publishedAt: new Date("2025-01-15T10:00:00Z"),
    },
    {
      title: "如何建立个人技术品牌",
      slug: "building-personal-tech-brand",
      excerpt: "分享我在建立个人技术品牌过程中的思考和实践，包括内容创作、社区参与、持续学习等方面的心得。通过这篇文章，希望能帮助更多开发者找到自己的定位。",
      content: `<h1>如何建立个人技术品牌</h1>
<p>建立个人技术品牌是一个长期的过程，需要持续的努力和正确的策略。</p>
<h2>内容创作</h2>
<p>高质量的内容是建立个人品牌的基础。无论是技术博客、开源项目还是技术分享，都能帮助你建立专业形象。</p>
<h2>社区参与</h2>
<p>积极参与技术社区，与其他开发者交流，分享经验，这些都是建立个人品牌的重要途径。</p>
<h2>持续学习</h2>
<p>技术领域变化很快，持续学习是保持竞争力的关键。</p>`,
      categorySlug: "thoughts",
      tagSlugs: ["personal-growth", "career"],
      publishedAt: new Date("2025-01-12T10:00:00Z"),
    },
    {
      title: "TypeScript 类型系统进阶",
      slug: "typescript-advanced-types",
      excerpt: "深入理解 TypeScript 的类型系统，包括泛型、条件类型、映射类型等高级特性的使用场景和最佳实践。通过实际案例，帮助你掌握这些强大的类型工具。",
      content: `<h1>TypeScript 类型系统进阶</h1>
<p>TypeScript 的类型系统非常强大，掌握高级类型特性可以让我们写出更安全、更灵活的代码。</p>
<h2>泛型</h2>
<p>泛型允许我们创建可重用的组件，这些组件可以处理多种类型的数据。</p>
<h2>条件类型</h2>
<p>条件类型允许我们根据条件选择不同的类型，这是构建复杂类型系统的关键工具。</p>
<h2>映射类型</h2>
<p>映射类型允许我们基于现有类型创建新类型，这对于工具类型非常有用。</p>`,
      categorySlug: "tech",
      tagSlugs: ["typescript", "web-development"],
      publishedAt: new Date("2025-01-10T10:00:00Z"),
    },
    {
      title: "2024 年度总结与反思",
      slug: "2024-yearly-summary",
      excerpt: "回顾 2024 年的学习、工作和生活，总结收获和成长，展望 2025 年的目标和计划。这是一次深刻的自我反思，也是对未来的一次规划。",
      content: `<h1>2024 年度总结与反思</h1>
<p>2024 年对我来说是充满挑战和成长的一年。让我来回顾一下这一年的经历。</p>
<h2>学习成果</h2>
<p>今年我深入学习了许多新技术，包括 Next.js、TypeScript、PostgreSQL 等，这些知识为我的职业发展打下了坚实的基础。</p>
<h2>工作经历</h2>
<p>在工作中，我承担了更多责任，参与了多个重要项目的开发，积累了宝贵的经验。</p>
<h2>生活感悟</h2>
<p>除了技术学习，我也在生活中有很多感悟，学会了更好地平衡工作和生活。</p>
<h2>2025 年计划</h2>
<p>展望 2025 年，我计划继续深入学习，同时开始分享更多有价值的内容，帮助更多开发者成长。</p>`,
      categorySlug: "life",
      tagSlugs: ["yearly-summary", "reflection", "personal-growth"],
      publishedAt: new Date("2025-01-08T10:00:00Z"),
    },
    {
      title: "Tailwind CSS 实用技巧分享",
      slug: "tailwind-css-tips",
      excerpt: "分享一些 Tailwind CSS 的实用技巧和最佳实践，帮助你更高效地使用这个强大的 CSS 框架。从配置到组件，从响应式设计到性能优化，全面覆盖。",
      content: `<h1>Tailwind CSS 实用技巧分享</h1>
<p>Tailwind CSS 是一个功能强大的实用优先的 CSS 框架，掌握一些技巧可以大大提高开发效率。</p>
<h2>配置优化</h2>
<p>合理配置 Tailwind 可以减小最终 CSS 文件的大小，只包含实际使用的样式。</p>
<h2>组件复用</h2>
<p>通过组合 Tailwind 类，我们可以创建可复用的组件，提高代码的可维护性。</p>
<h2>响应式设计</h2>
<p>Tailwind 的响应式设计系统非常灵活，可以轻松实现各种屏幕尺寸的适配。</p>
<h2>性能优化</h2>
<p>通过 PurgeCSS 和合理的类使用，可以确保最终 CSS 文件尽可能小。</p>`,
      categorySlug: "tech",
      tagSlugs: ["css", "tailwind", "frontend"],
      publishedAt: new Date("2025-01-05T10:00:00Z"),
    },
    {
      title: "数据库设计最佳实践",
      slug: "database-design-best-practices",
      excerpt: "探讨数据库设计的基本原则和最佳实践，包括表结构设计、索引优化、查询性能优化等方面。通过实际案例，帮助你设计出高效、可维护的数据库。",
      content: `<h1>数据库设计最佳实践</h1>
<p>良好的数据库设计是应用性能的基础，让我们来探讨一些最佳实践。</p>
<h2>表结构设计</h2>
<p>合理的表结构设计可以提高查询效率，减少数据冗余，提高数据一致性。</p>
<h2>索引优化</h2>
<p>正确使用索引可以大大提高查询性能，但过多的索引也会影响写入性能，需要平衡。</p>
<h2>查询优化</h2>
<p>编写高效的 SQL 查询是数据库性能优化的关键，需要理解查询执行计划。</p>
<h2>数据规范化</h2>
<p>适当的数据规范化可以减少数据冗余，但过度规范化也可能影响性能，需要权衡。</p>`,
      categorySlug: "tech",
      tagSlugs: ["database", "postgresql"],
      publishedAt: new Date("2025-01-03T10:00:00Z"),
    },
  ];

  // Helper function to find category by slug
  const findCategory = (slug: string) =>
    createdCategories.find((c) => c.slug === slug);

  // Helper function to find tags by slugs
  const findTags = (slugs: string[]) =>
    createdTags.filter((t) => slugs.includes(t.slug));

  // Create articles
  for (const articleData of articles) {
    const category = findCategory(articleData.categorySlug);
    const articleTags = findTags(articleData.tagSlugs);

    await prisma.article.upsert({
      where: { slug: articleData.slug },
      update: {
        title: articleData.title,
        excerpt: articleData.excerpt,
        content: articleData.content,
        status: ArticleStatus.PUBLISHED,
        categoryId: category?.id || null,
        publishedAt: articleData.publishedAt,
        // Update tags
        tags: {
          deleteMany: {},
          create: articleTags.map((tag) => ({
            tagId: tag.id,
          })),
        },
      },
      create: {
        title: articleData.title,
        slug: articleData.slug,
        excerpt: articleData.excerpt,
        content: articleData.content,
        status: ArticleStatus.PUBLISHED,
        authorId: admin.id,
        categoryId: category?.id || null,
        publishedAt: articleData.publishedAt,
        tags: {
          create: articleTags.map((tag) => ({
            tagId: tag.id,
          })),
        },
      },
    });
  }
  console.log(`✅ Created ${articles.length} articles`);

  console.log("\n🎉 Test data seed completed successfully!");
  console.log("\n📝 Summary:");
  console.log(`   - Admin user: ${adminEmail}`);
  console.log(`   - Categories: ${createdCategories.length}`);
  console.log(`   - Tags: ${createdTags.length}`);
  console.log(`   - Articles: ${articles.length}`);
  console.log("\n💡 You can now test the application with this data!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding test data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

