# Epic Technical Specification: 项目基础架构（Foundation）

Date: 2025-11-12
Author: Travis
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 是 travis-blog 项目的基础架构阶段，为整个博客系统建立技术基础。这个 Epic 涵盖了项目初始化、数据库设计、ORM 配置、部署设置和存储抽象层的实现。作为项目的第一个 Epic，它不依赖于任何其他 Epic，为后续所有功能（用户认证、内容管理、内容展示等）提供必要的技术基础设施。

根据 PRD，travis-blog 是一个个人博客平台，旨在通过完整的 Vibe 开发流程实现学习、分享和建立个人品牌的目标。Epic 1 确保项目有一个坚实、可扩展、符合最佳实践的技术基础，支持后续功能的快速开发。

---

## Objectives and Scope

### In-Scope

- ✅ **项目初始化：** 使用 Next.js 官方模板创建项目，配置 TypeScript、Tailwind CSS 和 App Router
- ✅ **数据库设计：** 设计并实现 PostgreSQL 数据库 Schema，包括所有核心表（users, articles, categories, tags, comments）
- ✅ **ORM 配置：** 配置 Prisma ORM，建立数据库连接，实现类型安全的数据库操作
- ✅ **部署配置：** 配置 Vercel 部署和基础 CI/CD 流程
- ✅ **存储抽象层：** 实现文件存储抽象层，支持本地存储，为未来迁移到云存储做准备
- ✅ **开发环境设置：** 配置开发环境，包括依赖安装、环境变量、数据库连接等

### Out-of-Scope

- ❌ **用户认证功能：** 由 Epic 2 负责（NextAuth.js 配置在 Epic 1 中不包含）
- ❌ **内容管理功能：** 由 Epic 3 负责（文章 CRUD 操作）
- ❌ **前端组件：** 由后续 Epic 负责（Epic 4、5、6）
- ❌ **SEO 优化：** 由 Epic 7 负责
- ❌ **生产环境监控：** 基础日志已包含，但详细监控由后续阶段负责

---

## System Architecture Alignment

Epic 1 直接对应架构文档中的以下组件和决策：

**架构组件：**
- `app/` - Next.js App Router 目录结构
- `prisma/` - Prisma schema 和 migrations
- `lib/db/` - 数据库连接和 Prisma Client
- `lib/storage/` - 存储抽象层（interface.ts, local.ts）
- `lib/utils/` - 工具函数（date.ts, validation.ts）
- `public/uploads/` - 本地文件存储目录

**架构决策对齐：**
- ✅ **Next.js App Router：** 使用官方 starter 模板，TypeScript + Tailwind CSS
- ✅ **Prisma ORM：** 类型安全，与 Next.js 集成好，迁移系统完善
- ✅ **存储抽象层：** 便于后续迁移到云存储，抽象层设计
- ✅ **date-fns：** 轻量级，函数式，易于使用
- ✅ **统一错误处理：** 一致性，便于前端处理
- ✅ **日志策略：** 开发用 console，生产用结构化日志

**约束：**
- 必须遵循架构文档中定义的项目结构
- 必须使用 Prisma 作为 ORM（不能使用其他 ORM）
- 存储抽象层必须支持未来迁移到云存储
- 所有日期时间必须使用 UTC 存储

---

## Detailed Design

### Services and Modules

| 模块/服务 | 职责 | 输入 | 输出 | 所有者 |
|----------|------|------|------|--------|
| **项目初始化模块** | 创建 Next.js 项目结构，配置基础工具 | 无 | 初始化的项目目录结构 | Story 1.1 |
| **数据库 Schema 模块** | 定义数据库表结构、关系、索引 | PRD 需求 | Prisma schema 文件 | Story 1.2 |
| **Prisma Client 模块** | 提供类型安全的数据库访问 | Database URL | Prisma Client 实例 | Story 1.3 |
| **数据库连接模块** | 管理数据库连接池 | Database URL | 数据库连接 | Story 1.3 |
| **Vercel 部署模块** | 配置自动部署流程 | Git 仓库 | 部署配置 | Story 1.4 |
| **存储接口模块** | 定义存储抽象接口 | 无 | StorageInterface | Story 1.5 |
| **本地存储模块** | 实现本地文件系统存储 | File, path | File path/URL | Story 1.5 |
| **存储工厂模块** | 提供存储实例工厂函数 | Environment config | Storage instance | Story 1.5 |

### Data Models and Contracts

**数据库 Schema（Prisma）：**

```prisma
// 用户表（Epic 1 中定义，Epic 2 使用）
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  articles  Article[]
  comments Comment[]
}

enum Role {
  USER
  ADMIN
}

// 文章表（Epic 1 中定义，Epic 3 使用）
model Article {
  id          String      @id @default(cuid())
  title       String
  content     String      @db.Text
  excerpt     String?
  slug        String      @unique
  status      ArticleStatus @default(DRAFT)
  categoryId  String?
  authorId    String
  publishedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  author      User        @relation(fields: [authorId], references: [id])
  category    Category?   @relation(fields: [categoryId], references: [id])
  tags        ArticleTag[]
  comments    Comment[]
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
}

// 分类表
model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  articles   Article[]
}

// 标签表
model Tag {
  id        String      @id @default(cuid())
  name      String      @unique
  slug      String      @unique
  articles   ArticleTag[]
}

// 文章标签关联表
model ArticleTag {
  articleId String
  tagId     String
  article   Article @relation(fields: [articleId], references: [id])
  tag       Tag     @relation(fields: [tagId], references: [id])
  
  @@id([articleId, tagId])
}

// 评论表（Epic 1 中定义，Epic 5 使用）
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  articleId String
  userId    String?
  parentId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  article   Article  @relation(fields: [articleId], references: [id])
  user      User?    @relation(fields: [userId], references: [id])
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
}
```

**数据关系：**
- User → Articles (One-to-Many)
- User → Comments (One-to-Many)
- Article → Category (Many-to-One)
- Article → Tags (Many-to-Many via ArticleTag)
- Article → Comments (One-to-Many)
- Comment → Comment (Self-referential for replies)

**性能索引：**
- `articles.publishedAt` - 用于排序已发布文章
- `articles.slug` - 用于文章查找
- `articles.authorId` - 用于作者文章查询
- `comments.articleId` - 用于文章评论查询
- `comments.parentId` - 用于评论回复查询

**存储抽象层接口：**

```typescript
/**
 * Represents a storage interface for file operations.
 * 
 * This interface provides an abstraction layer for file storage,
 * allowing easy migration between local and cloud storage backends.
 * 
 * @interface StorageInterface
 */
export interface StorageInterface {
  /**
   * Uploads a file to storage.
   * 
   * @param file - The file to upload
   * @param path - Optional custom path for the file
   * @returns Promise resolving to the file path/URL
   * @throws {StorageError} If the upload fails
   */
  upload(file: File, path?: string): Promise<string>;
  
  /**
   * Deletes a file from storage.
   * 
   * @param path - The path of the file to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {StorageError} If the file doesn't exist or deletion fails
   */
  delete(path: string): Promise<void>;
  
  /**
   * Lists files in storage.
   * 
   * @param prefix - Optional prefix to filter files
   * @returns Promise resolving to array of file metadata
   * @throws {StorageError} If listing fails
   */
  list(prefix?: string): Promise<FileMetadata[]>;
  
  /**
   * Gets the public URL for a file.
   * 
   * @param path - The file path
   * @returns Promise resolving to the public URL
   * @throws {StorageError} If the file doesn't exist
   */
  getUrl(path: string): Promise<string>;
}

export interface FileMetadata {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: Date;
}
```

### APIs and Interfaces

**Prisma Client API：**

```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton instance.
 * 
 * Prevents multiple instances in development with hot reloading.
 * 
 * @returns PrismaClient instance
 */
export function getPrismaClient(): PrismaClient {
  // Implementation with singleton pattern
}
```

**存储工厂 API：**

```typescript
// lib/storage/index.ts
import { StorageInterface } from './interface';
import { LocalStorage } from './local';

/**
 * Gets the storage instance based on environment configuration.
 * 
 * @returns StorageInterface instance (currently LocalStorage)
 * @throws {Error} If storage type is invalid
 */
export function getStorage(): StorageInterface {
  // Implementation with environment variable support
}
```

**环境变量接口：**

```typescript
// .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/travis_blog"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
STORAGE_TYPE="local"  # Options: local, s3, cloudinary (future)
```

### Workflows and Sequencing

**Story 执行顺序：**

```
Story 1.1: 项目初始化和基础配置
    ↓
Story 1.2: 数据库设计和初始化 (依赖: 1.1)
    ↓
Story 1.3: 数据库连接和 ORM 配置 (依赖: 1.2)
    ↓
Story 1.4: 部署配置和 CI/CD 基础 (依赖: 1.1, 可并行)
    ↓
Story 1.5: 存储抽象层实现 (依赖: 1.1, 可并行)
```

**关键工作流：**

1. **项目初始化流程：**
   - 执行 `npx create-next-app@latest travis-blog --typescript --tailwind --app --no-src-dir`
   - 安装基础依赖
   - 配置 TypeScript、Tailwind CSS
   - 设置项目目录结构

2. **数据库初始化流程：**
   - 设计 Prisma schema
   - 运行 `npx prisma migrate dev` 创建数据库
   - 生成 Prisma Client
   - 验证数据库连接

3. **部署配置流程：**
   - 连接 GitHub 仓库到 Vercel
   - 配置构建设置
   - 设置环境变量
   - 测试部署流程

4. **存储抽象层实现流程：**
   - 定义 StorageInterface
   - 实现 LocalStorage 类
   - 创建存储工厂函数
   - 测试存储操作

---

## Non-Functional Requirements

### Performance

**数据库查询性能：**
- 所有数据库查询必须使用 Prisma 的优化查询（select 字段限制）
- 必须创建性能索引（见 Data Models 部分）
- 连接池配置：默认 Prisma 连接池设置

**文件存储性能：**
- 文件上传大小限制：5MB（图片），10MB（其他文件）
- 文件命名使用 UUID 或时间戳，避免冲突
- 本地存储路径：`public/uploads/`（可通过环境变量配置）

**构建性能：**
- Next.js 自动代码分割
- TypeScript 类型检查在构建时执行
- Prisma Client 在构建时生成

**链接到 PRD NFR：**
- NFR-1.1: 页面加载性能（Epic 1 建立基础，具体优化在 Epic 7）
- NFR-1.2: 响应式设计性能（基础结构支持，具体实现在后续 Epic）

### Security

**数据库安全：**
- 使用 Prisma 参数化查询（自动防护 SQL 注入）
- 数据库连接字符串存储在环境变量中
- 生产环境使用加密连接（SSL）

**文件存储安全：**
- 文件上传验证：类型、大小限制
- 文件路径验证：防止目录遍历攻击
- 文件访问权限：仅允许访问 `public/uploads/` 目录

**环境变量安全：**
- 敏感信息（数据库 URL、密钥）存储在 `.env.local`（gitignored）
- `.env.example` 提供模板，不包含真实值
- Vercel 环境变量在部署平台配置

**链接到 PRD NFR：**
- NFR-2.2: 数据保护（数据库连接加密、参数化查询）
- NFR-2.3: 防攻击措施（文件上传验证、路径验证）

### Reliability/Availability

**数据库可靠性：**
- 使用 PostgreSQL 连接池（Prisma 自动管理）
- 数据库连接错误处理：重试机制（Prisma 内置）
- 迁移回滚支持：Prisma Migrate 支持

**存储可靠性：**
- 文件上传错误处理：捕获文件系统错误
- 文件删除验证：检查文件是否存在
- 目录创建：自动创建不存在的目录

**部署可靠性：**
- Vercel 自动部署失败处理：回滚到上一个版本
- 构建失败通知：Vercel 发送通知
- 环境变量验证：构建时检查必需环境变量

**链接到 PRD NFR：**
- NFR-3.1: 功能扩展性（存储抽象层支持未来扩展）

### Observability

**日志策略：**

**开发环境：**
- 使用 `console.log`, `console.error` 进行调试
- 日志级别：Verbose
- 数据库查询日志：Prisma 查询日志（可选）

**生产环境：**
- 结构化日志（JSON 格式）
- 日志级别：error, warn, info
- 日志输出：console（Vercel 自动聚合）

**关键日志点：**
- 数据库连接成功/失败
- Prisma 迁移执行
- 文件上传成功/失败
- 存储操作错误

**监控指标（基础）：**
- 数据库连接状态
- 文件存储使用情况（可选）
- 构建时间（Vercel 自动提供）

---

## Dependencies and Integrations

### Core Dependencies

**Next.js 生态系统：**
- `next` (Latest) - React 框架，App Router
- `react` (Latest) - React 库
- `react-dom` (Latest) - React DOM 渲染

**TypeScript：**
- `typescript` (Latest) - TypeScript 编译器
- `@types/node` (Latest) - Node.js 类型定义
- `@types/react` (Latest) - React 类型定义

**样式：**
- `tailwindcss` (Latest) - Tailwind CSS 框架
- `postcss` (Latest) - PostCSS 处理器
- `autoprefixer` (Latest) - CSS 自动前缀

**数据库：**
- `@prisma/client` (Latest) - Prisma Client
- `prisma` (Latest) - Prisma CLI 和工具

**工具库：**
- `date-fns` (Latest) - 日期时间处理
- `date-fns-tz` (Latest) - 时区处理

### Development Dependencies

- `eslint` (Latest) - 代码检查
- `eslint-config-next` (Latest) - Next.js ESLint 配置
- `prettier` (Latest) - 代码格式化（可选）

### External Services

**Vercel：**
- 部署平台
- 自动构建和部署
- 环境变量管理
- 日志聚合

**PostgreSQL：**
- 生产环境：Vercel Postgres 或外部托管服务
- 开发环境：本地 PostgreSQL 实例

### Integration Points

**GitHub → Vercel：**
- 自动部署触发：Git push 到 main 分支
- Preview 部署：Pull Request
- 环境变量同步：Vercel Dashboard

**Prisma → PostgreSQL：**
- 连接字符串：`DATABASE_URL` 环境变量
- 迁移执行：`prisma migrate deploy`（生产）
- Client 生成：`prisma generate`（构建时）

**Storage → File System：**
- 本地存储：Node.js `fs` 模块
- 存储路径：`public/uploads/`（可配置）
- 未来扩展：S3、Cloudinary、Vercel Blob

---

## Acceptance Criteria (Authoritative)

基于 Epic 1 的 5 个 Story，以下是原子化、可测试的接受标准：

### Story 1.1: 项目初始化和基础配置

1. **AC-1.1.1:** 执行 `npx create-next-app@latest travis-blog --typescript --tailwind --app --no-src-dir` 成功创建项目
2. **AC-1.1.2:** 项目包含 `app/`, `components/`, `lib/`, `public/` 目录结构
3. **AC-1.1.3:** `package.json` 包含 Next.js、React、TypeScript、Tailwind CSS 依赖
4. **AC-1.1.4:** `tsconfig.json` 配置正确，TypeScript 编译无错误
5. **AC-1.1.5:** `tailwind.config.js` 配置正确，Tailwind CSS 样式生效
6. **AC-1.1.6:** `.env.example` 文件存在，包含必需的环境变量模板
7. **AC-1.1.7:** ESLint 配置正确（可选但推荐）

### Story 1.2: 数据库设计和初始化

8. **AC-1.2.1:** `prisma/schema.prisma` 文件存在，包含所有必需的表定义
9. **AC-1.2.2:** Schema 包含 User、Article、Category、Tag、ArticleTag、Comment 模型
10. **AC-1.2.3:** 所有外键关系正确定义（User → Articles, Article → Category, Article → Tags, Article → Comments）
11. **AC-1.2.4:** 性能索引已创建（articles.publishedAt, articles.slug, articles.authorId, comments.articleId, comments.parentId）
12. **AC-1.2.5:** 执行 `npx prisma migrate dev` 成功创建数据库和表
13. **AC-1.2.6:** 数据库迁移文件在 `prisma/migrations/` 目录中生成

### Story 1.3: 数据库连接和 ORM 配置

14. **AC-1.3.1:** `lib/db/prisma.ts` 文件存在，导出 Prisma Client 实例
15. **AC-1.3.2:** Prisma Client 使用单例模式（防止开发环境热重载时多实例）
16. **AC-1.3.3:** 数据库连接字符串从 `DATABASE_URL` 环境变量读取
17. **AC-1.3.4:** 执行 `npx prisma generate` 成功生成 Prisma Client
18. **AC-1.3.5:** 可以成功执行数据库 CRUD 操作（测试查询）
19. **AC-1.3.6:** 连接池配置正确（Prisma 默认配置）

### Story 1.4: 部署配置和 CI/CD 基础

20. **AC-1.4.1:** GitHub 仓库已连接到 Vercel 项目
21. **AC-1.4.2:** Vercel 自动部署已配置（main 分支推送触发）
22. **AC-1.4.3:** Preview 部署已配置（Pull Request 触发）
23. **AC-1.4.4:** 必需的环境变量已在 Vercel Dashboard 配置
24. **AC-1.4.5:** 生产环境构建成功（无错误）
25. **AC-1.4.6:** 生产环境数据库连接正常

### Story 1.5: 存储抽象层实现

26. **AC-1.5.1:** `lib/storage/interface.ts` 文件存在，定义 `StorageInterface` 接口
27. **AC-1.5.2:** `StorageInterface` 包含 `upload`, `delete`, `list`, `getUrl` 方法
28. **AC-1.5.3:** `FileMetadata` 类型定义正确（path, name, size, mimeType, createdAt）
29. **AC-1.5.4:** `lib/storage/local.ts` 文件存在，实现 `LocalStorage` 类
30. **AC-1.5.5:** `LocalStorage` 类实现 `StorageInterface` 接口
31. **AC-1.5.6:** 文件上传功能正常：文件保存到 `public/uploads/` 目录
32. **AC-1.5.7:** 文件删除功能正常：文件从磁盘删除
33. **AC-1.5.8:** 文件列表功能正常：返回文件元数据数组
34. **AC-1.5.9:** 文件 URL 生成正确：返回 `/uploads/{filename}` 格式
35. **AC-1.5.10:** 存储工厂函数 `getStorage()` 存在，返回存储实例
36. **AC-1.5.11:** 错误处理正确：文件系统错误被捕获并返回有意义的消息

---

## Traceability Mapping

| 接受标准 | 规范章节 | 组件/API | 测试想法 |
|---------|---------|---------|---------|
| AC-1.1.1 | Project Initialization | `npx create-next-app` | 执行命令，验证项目创建 |
| AC-1.1.2 | Project Structure | 项目目录 | 检查目录结构存在 |
| AC-1.1.3 | Project Initialization | `package.json` | 验证依赖版本 |
| AC-1.1.4 | Project Initialization | `tsconfig.json` | TypeScript 编译测试 |
| AC-1.1.5 | Project Initialization | `tailwind.config.js` | 应用 Tailwind 类，验证样式 |
| AC-1.2.1-1.2.3 | Data Architecture | `prisma/schema.prisma` | Schema 验证，关系检查 |
| AC-1.2.4 | Data Architecture | Prisma indexes | 检查索引定义 |
| AC-1.2.5-1.2.6 | Data Architecture | Prisma Migrate | 执行迁移，验证表创建 |
| AC-1.3.1-1.3.3 | Data Architecture | `lib/db/prisma.ts` | 导入测试，连接测试 |
| AC-1.3.4 | Data Architecture | Prisma Client | 生成验证 |
| AC-1.3.5-1.3.6 | Data Architecture | Prisma Client | CRUD 操作测试 |
| AC-1.4.1-1.4.3 | Deployment Architecture | Vercel 配置 | 检查 Vercel Dashboard |
| AC-1.4.4-1.4.6 | Deployment Architecture | Vercel 环境变量 | 部署测试，连接测试 |
| AC-1.5.1-1.5.3 | Storage Abstraction | `lib/storage/interface.ts` | 接口定义验证 |
| AC-1.5.4-1.5.5 | Storage Abstraction | `lib/storage/local.ts` | 类实现验证 |
| AC-1.5.6-1.5.9 | Storage Abstraction | LocalStorage 方法 | 单元测试：上传、删除、列表、URL |
| AC-1.5.10 | Storage Abstraction | `getStorage()` | 工厂函数测试 |
| AC-1.5.11 | Storage Abstraction | Error handling | 错误场景测试 |

---

## Risks, Assumptions, Open Questions

### Risks

**R1: 数据库迁移失败风险**
- **描述：** 生产环境数据库迁移可能失败，导致部署中断
- **影响：** 高 - 阻止应用部署
- **缓解措施：** 
  - 在本地和 staging 环境充分测试迁移
  - 使用 Prisma Migrate 的备份和回滚功能
  - 在 Vercel 构建脚本中添加迁移验证

**R2: 存储抽象层性能问题**
- **描述：** 本地文件存储在 Vercel serverless 环境中可能有限制
- **影响：** 中 - 可能影响文件上传功能
- **缓解措施：**
  - 验证 Vercel serverless 函数的文件系统限制
  - 考虑早期迁移到 Vercel Blob 或 S3
  - 实现文件大小和数量限制

**R3: 环境变量配置错误**
- **描述：** 生产环境变量配置错误可能导致应用无法启动
- **影响：** 高 - 阻止应用运行
- **缓解措施：**
  - 在 `.env.example` 中明确列出所有必需变量
  - 在应用启动时验证必需环境变量
  - Vercel 部署前检查环境变量配置

### Assumptions

**A1: PostgreSQL 可用性**
- **假设：** 开发和生产环境都有可用的 PostgreSQL 数据库
- **验证：** Story 1.2 执行时验证数据库连接

**A2: Vercel 平台稳定性**
- **假设：** Vercel 平台稳定，自动部署功能正常
- **验证：** Story 1.4 执行时测试部署流程

**A3: Node.js 版本兼容性**
- **假设：** Node.js 18.18+ 在所有环境中可用
- **验证：** Story 1.1 执行时检查 Node.js 版本

### Open Questions

**Q1: 存储抽象层的具体迁移策略**
- **问题：** 从本地存储迁移到云存储的具体步骤是什么？
- **状态：** 待后续 Epic 3 实施时确定
- **影响：** 低 - 不影响当前实现

**Q2: 数据库备份策略**
- **问题：** 生产环境数据库备份频率和保留策略？
- **状态：** 待部署时与 Vercel/数据库提供商确认
- **影响：** 低 - 不影响当前实现

**Q3: 开发环境数据库管理**
- **问题：** 是否需要数据库 seed 脚本用于开发？
- **状态：** 可选，可在 Story 1.3 中实现
- **影响：** 低 - 不影响核心功能

---

## Test Strategy Summary

### Test Levels

**1. 单元测试（Unit Tests）：**
- **目标：** 存储抽象层方法（upload, delete, list, getUrl）
- **框架：** Jest 或 Vitest（Next.js 推荐）
- **覆盖：** 
  - 文件上传成功/失败场景
  - 文件删除成功/失败场景
  - 文件列表功能
  - 错误处理

**2. 集成测试（Integration Tests）：**
- **目标：** 数据库连接、Prisma Client 操作
- **框架：** Jest + Prisma Test Environment
- **覆盖：**
  - 数据库连接测试
  - CRUD 操作测试
  - 迁移执行测试

**3. 端到端测试（E2E Tests）：**
- **目标：** 部署流程、环境变量配置
- **框架：** 手动测试 + Vercel Preview 部署
- **覆盖：**
  - Vercel 自动部署
  - 环境变量加载
  - 生产环境数据库连接

### Test Coverage Goals

- **存储抽象层：** 100% 代码覆盖率（关键模块）
- **数据库操作：** 核心 CRUD 操作测试
- **错误处理：** 所有错误路径测试

### Critical Paths to Test

1. **项目初始化路径：** 验证所有配置正确
2. **数据库迁移路径：** 验证迁移成功执行
3. **存储操作路径：** 验证文件上传/删除/列表功能
4. **部署路径：** 验证 Vercel 部署成功

### Edge Cases

- 数据库连接失败时的错误处理
- 文件系统权限错误
- 磁盘空间不足
- 无效的文件类型
- 环境变量缺失

---

