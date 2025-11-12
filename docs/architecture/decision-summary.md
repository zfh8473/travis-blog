# Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Project Template** | Next.js Official Starter | Latest | All | 官方支持，最佳实践，与 Vercel 集成好 |
| **ORM** | Prisma | Latest | Epic 1, 2, 3, 5 | 类型安全，与 Next.js 集成好，迁移系统完善 |
| **API Pattern** | Next.js Server Actions + API Routes | Latest | All | Next.js 原生，类型安全，减少样板代码 |
| **Authentication** | NextAuth.js | Latest | Epic 2 | Next.js 生态，支持 OAuth + JWT，开箱即用 |
| **File Storage** | Local Storage (Abstract Layer) | - | Epic 3, 5 | 便于后续迁移到云存储，抽象层设计 |
| **Date/Time** | date-fns | Latest | All | 轻量级，函数式，易于使用 |
| **Error Handling** | Unified Error Format | - | All | 一致性，便于前端处理 |
| **Logging** | Console (Dev) + Structured (Prod) | - | All | 开发简单，生产结构化 |

---
