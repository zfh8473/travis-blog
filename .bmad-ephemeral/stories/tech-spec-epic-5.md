# Epic Technical Specification: 读者互动（Reader Interaction）

Date: 2025-11-14
Author: Travis
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 实现 travis-blog 的读者互动系统，为博客平台提供留言、回复和留言管理功能，让读者可以与博主和其他读者进行互动。根据 PRD 的功能需求 FR-4.1 到 FR-4.3，本 Epic 涵盖留言功能、留言回复功能和留言管理功能。

本 Epic 是博客系统的互动模块，为读者提供与博主和其他读者交流的渠道。所有功能将使用 Next.js App Router 的 Server Actions 和 API Routes，通过 Prisma ORM 操作数据库，并使用 React 组件实现用户界面。留言系统支持嵌套回复，管理员可以删除留言以维护健康的讨论环境。

---

## Objectives and Scope

### In-Scope

- ✅ **留言功能：** 读者可以在文章下方发表留言，支持登录用户和匿名用户留言
- ✅ **留言回复功能：** 支持嵌套回复，读者可以回复其他用户的留言
- ✅ **留言管理功能：** 博主（管理员）可以删除留言，支持级联删除回复
- ✅ **留言显示：** 在文章详情页显示留言列表，支持嵌套显示回复
- ✅ **留言表单：** 提供留言和回复表单组件，支持输入验证
- ✅ **权限控制：** 区分普通用户和管理员的权限，管理员可以删除留言

### Out-of-Scope

- ❌ **留言审核功能：** 留言审核（approve/reject）不在本 Epic 范围内，属于后续功能
- ❌ **留言编辑功能：** 留言编辑功能不在本 Epic 范围内（MVP 阶段不包含）
- ❌ **留言点赞功能：** 留言点赞功能不在本 Epic 范围内（属于后续功能）
- ❌ **留言通知功能：** 留言通知（邮件、推送）不在本 Epic 范围内（属于后续功能）
- ❌ **留言搜索功能：** 留言搜索功能不在本 Epic 范围内（属于后续功能）
- ❌ **悄悄话功能：** 悄悄话功能属于 Post-MVP 功能，不在本 Epic 范围内

---

## System Architecture Alignment

本 Epic 与系统架构完全对齐，使用以下架构组件和模式：

**前端架构：**
- 使用 Next.js App Router 的 Server Components 和 Client Components
- 使用 React 组件实现留言界面：`components/comment/` 目录
- 使用 Tailwind CSS 实现响应式设计
- 组件组织：
  - `components/comment/CommentForm.tsx` - 留言表单组件
  - `components/comment/CommentList.tsx` - 留言列表组件
  - `components/comment/CommentItem.tsx` - 单个留言组件

**后端架构：**
- 使用 Next.js Server Actions 处理留言创建和删除操作
- 使用 Prisma ORM 进行数据库操作
- API 端点：`app/api/comments/` 目录
- 数据模型：使用已定义的 `Comment` 模型（支持嵌套回复）

**数据库架构：**
- 使用已定义的 `Comment` 表（prisma/schema.prisma）
- 支持自引用关系（parentId）实现嵌套回复
- 支持级联删除（删除父留言时删除所有回复）

**权限架构：**
- 使用 NextAuth.js 进行身份验证
- 使用角色检查中间件验证管理员权限
- 普通用户可以创建留言和回复
- 管理员可以删除留言

**架构决策对齐：**
- ✅ **Server Actions 模式：** 使用 Server Actions 处理数据变更操作
- ✅ **Prisma ORM：** 使用 Prisma 进行类型安全的数据库操作
- ✅ **统一错误处理：** 使用统一的错误响应格式
- ✅ **JSDoc 注释：** 所有公共函数和组件包含 JSDoc 注释

**约束：**
- 必须遵循架构文档中定义的命名约定
- 必须使用 Prisma 进行数据库操作（不能使用原始 SQL）
- 必须使用 Server Actions 处理数据变更（不能使用 API Routes）
- 留言内容必须进行输入验证和清理（防止 XSS）

---

## Detailed Design

### Services and Modules

| 模块/服务 | 职责 | 输入 | 输出 | 所有者 |
|----------|------|------|------|--------|
| **留言创建模块** | 处理留言创建逻辑 | 留言内容、文章ID、用户ID（可选）、父留言ID（可选） | 创建的留言对象 | Story 5.1 |
| **留言查询模块** | 查询文章的所有留言 | 文章ID | 留言列表（包含嵌套回复） | Story 5.1 |
| **留言回复模块** | 处理留言回复逻辑 | 回复内容、父留言ID、文章ID、用户ID（可选） | 创建的回复对象 | Story 5.2 |
| **留言删除模块** | 处理留言删除逻辑（管理员权限） | 留言ID | 删除结果 | Story 5.3 |
| **留言显示组件** | 渲染留言列表和单个留言 | 留言数据 | React 组件 | Story 5.1, 5.2 |
| **留言表单组件** | 提供留言输入表单 | 文章ID、父留言ID（可选）、用户信息 | React 组件 | Story 5.1, 5.2 |
| **权限检查模块** | 验证用户权限（管理员） | 用户会话 | 权限验证结果 | Story 5.3 |

### Data Models and Contracts

**数据库 Schema（Prisma）：**

```prisma
/**
 * Comment model represents user comments on articles.
 * Supports nested replies via self-referential relationship.
 * 
 * Relationships:
 * - Many-to-One with Article
 * - Many-to-One with User (optional, for anonymous comments)
 * - Self-referential for comment replies (parentId)
 */
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  articleId String
  userId    String?
  parentId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")

  @@index([articleId])
  @@index([parentId])
  @@map("comments")
}
```

**数据模型说明：**

- **id:** 留言唯一标识符（CUID）
- **content:** 留言内容（Text 类型，支持长文本）
- **articleId:** 关联的文章ID（外键，级联删除）
- **userId:** 关联的用户ID（可选，支持匿名留言，外键，删除用户时设为 null）
- **parentId:** 父留言ID（可选，用于嵌套回复，外键，级联删除）
- **createdAt:** 创建时间（自动设置）
- **updatedAt:** 更新时间（自动更新）

**关系说明：**

- **Comment → Article:** 多对一关系，一个文章可以有多个留言
- **Comment → User:** 多对一关系（可选），一个用户可以有多个留言
- **Comment → Comment:** 自引用关系，支持嵌套回复（parentId 指向父留言）

**TypeScript 类型定义：**

```typescript
/**
 * Comment data type with nested replies.
 */
export interface Comment {
  id: string;
  content: string;
  articleId: string;
  userId: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  replies?: Comment[];
}

/**
 * Input type for creating a comment.
 */
export interface CreateCommentInput {
  content: string;
  articleId: string;
  userId?: string | null;
  parentId?: string | null;
  authorName?: string; // For anonymous comments
}

/**
 * Input type for deleting a comment.
 */
export interface DeleteCommentInput {
  commentId: string;
}
```

### APIs and Interfaces

**Server Actions:**

```typescript
/**
 * Server action to create a new comment.
 * 
 * This action handles comment creation on the server side,
 * including validation, authorization checks, and database operations.
 * 
 * @param data - Comment data including content, articleId, and optional userId/parentId
 * @returns Promise resolving to the created comment or an error
 * 
 * @throws {ValidationError} If input validation fails
 * @throws {NotFoundError} If article doesn't exist
 * 
 * @example
 * ```typescript
 * const result = await createCommentAction({
 *   content: "Great article!",
 *   articleId: "article-123",
 *   userId: "user-456"
 * });
 * ```
 */
export async function createCommentAction(
  data: CreateCommentInput
): Promise<ActionResult<Comment>>;

/**
 * Server action to get all comments for an article.
 * 
 * Returns comments with nested replies in a hierarchical structure.
 * 
 * @param articleId - The ID of the article
 * @returns Promise resolving to array of top-level comments with nested replies
 * 
 * @example
 * ```typescript
 * const comments = await getCommentsAction("article-123");
 * ```
 */
export async function getCommentsAction(
  articleId: string
): Promise<Comment[]>;

/**
 * Server action to delete a comment (admin only).
 * 
 * This action handles comment deletion on the server side,
 * including authorization checks and cascading deletes.
 * 
 * @param commentId - The ID of the comment to delete
 * @returns Promise resolving to success or error
 * 
 * @throws {UnauthorizedError} If user is not authenticated or not admin
 * @throws {NotFoundError} If comment doesn't exist
 * 
 * @example
 * ```typescript
 * const result = await deleteCommentAction("comment-789");
 * ```
 */
export async function deleteCommentAction(
  commentId: string
): Promise<ActionResult<void>>;
```

**API Routes（如果需要外部集成）：**

目前不需要 API Routes，所有操作通过 Server Actions 处理。如果未来需要外部系统集成（如 Webhook），可以添加：

- `POST /api/comments` - 创建留言（可选，用于外部集成）
- `GET /api/comments?articleId={id}` - 获取留言列表（可选，用于外部集成）
- `DELETE /api/comments/[id]` - 删除留言（可选，用于外部集成）

**响应格式：**

```typescript
// Success response
{ success: true, data: Comment }

// Error response
{ success: false, error: { message: string, code: string } }
```

**HTTP 状态码：**
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not admin for delete)
- 404: Not Found (article or comment not found)
- 500: Internal Server Error

### Workflows and Sequencing

**留言创建流程：**

1. **用户操作：** 用户在文章详情页滚动到留言区域
2. **显示表单：** 系统显示留言表单（如果已登录，自动填充用户名）
3. **用户输入：** 用户输入留言内容（和可选的用户名，如果未登录）
4. **表单提交：** 用户点击"提交"按钮
5. **客户端验证：** 前端验证留言内容（非空、长度限制）
6. **Server Action 调用：** 调用 `createCommentAction` Server Action
7. **服务端验证：** 验证留言内容、文章存在性、用户权限
8. **数据库操作：** 使用 Prisma 创建留言记录
9. **响应返回：** 返回创建的留言对象
10. **UI 更新：** 前端更新留言列表，显示新留言
11. **成功提示：** 显示成功消息

**留言回复流程：**

1. **用户操作：** 用户点击留言的"回复"按钮
2. **显示回复表单：** 系统在留言下方显示回复表单（内联或模态框）
3. **用户输入：** 用户输入回复内容
4. **表单提交：** 用户点击"提交"按钮
5. **Server Action 调用：** 调用 `createCommentAction` Server Action（包含 parentId）
6. **服务端验证：** 验证回复内容、父留言存在性
7. **数据库操作：** 使用 Prisma 创建回复记录（parentId 指向父留言）
8. **响应返回：** 返回创建的回复对象
9. **UI 更新：** 前端更新留言树，在父留言下显示新回复
10. **成功提示：** 显示成功消息

**留言删除流程（管理员）：**

1. **管理员操作：** 管理员在留言上看到"删除"按钮
2. **点击删除：** 管理员点击"删除"按钮
3. **确认对话框：** 系统显示确认对话框
4. **确认删除：** 管理员确认删除
5. **Server Action 调用：** 调用 `deleteCommentAction` Server Action
6. **权限验证：** 验证用户是否为管理员
7. **数据库操作：** 使用 Prisma 删除留言记录（级联删除所有回复）
8. **响应返回：** 返回删除成功结果
9. **UI 更新：** 前端从留言列表中移除已删除的留言及其回复
10. **成功提示：** 显示成功消息

**留言加载流程：**

1. **页面加载：** 文章详情页加载
2. **Server Component 获取数据：** 使用 `getCommentsAction` 获取留言列表
3. **数据库查询：** Prisma 查询文章的所有留言（按创建时间排序）
4. **构建嵌套结构：** 在应用层构建留言的嵌套树结构
5. **返回数据：** 返回顶层留言列表（包含嵌套回复）
6. **组件渲染：** `CommentList` 组件递归渲染留言树
7. **显示留言：** 在文章下方显示留言列表

---

## Non-Functional Requirements

### Performance

**NFR-5.1 留言加载性能**
- **要求：** 留言列表加载时间 < 500ms（对于包含 100 条留言的文章）
- **指标：**
  - 数据库查询时间 < 200ms
  - 留言树构建时间 < 100ms
  - 组件渲染时间 < 200ms
- **实现方式：**
  - 使用 Prisma 的 `include` 和 `select` 优化查询
  - 在应用层构建留言树（避免 N+1 查询）
  - 使用 React 的 `useMemo` 优化组件渲染
  - 考虑分页加载留言（如果留言数量 > 100）

**NFR-5.2 留言创建性能**
- **要求：** 留言创建响应时间 < 300ms
- **指标：**
  - 数据库插入时间 < 100ms
  - Server Action 执行时间 < 200ms
- **实现方式：**
  - 使用 Prisma 的批量插入（如果支持）
  - 优化数据库索引（articleId, parentId）
  - 使用异步操作，不阻塞 UI

**NFR-5.3 留言删除性能**
- **要求：** 留言删除响应时间 < 500ms（包括级联删除）
- **指标：**
  - 数据库删除时间 < 300ms（包括级联删除）
  - Server Action 执行时间 < 200ms
- **实现方式：**
  - 使用数据库级联删除（onDelete: Cascade）
  - 优化数据库索引
  - 使用事务确保数据一致性

**性能优化参考：**
- PRD NFR-1.1: 页面加载性能 < 3 秒
- 架构文档：使用 Prisma select 限制字段，优化 N+1 查询

### Security

**NFR-5.4 输入验证和清理**
- **要求：** 所有留言内容必须经过验证和清理，防止 XSS 攻击
- **标准：**
  - 留言内容长度限制（最小 1 字符，最大 5000 字符）
  - HTML 标签清理（使用 DOMPurify 或类似库）
  - 防止 SQL 注入（Prisma 自动处理）
- **实现方式：**
  - 使用 Zod 进行输入验证
  - 使用 DOMPurify 清理 HTML 内容
  - 使用 Prisma 参数化查询（自动防护 SQL 注入）

**NFR-5.5 权限控制**
- **要求：** 只有管理员可以删除留言
- **标准：**
  - 使用 NextAuth.js 验证用户身份
  - 检查用户角色（ADMIN）
  - 未授权访问返回 403 Forbidden
- **实现方式：**
  - 在 Server Action 中检查用户角色
  - 使用中间件保护删除操作
  - 前端隐藏删除按钮（非管理员）

**NFR-5.6 速率限制**
- **要求：** 防止留言 spam 攻击
- **标准：**
  - 每个 IP 地址每分钟最多创建 10 条留言
  - 每个用户每分钟最多创建 5 条留言
- **实现方式：**
  - 使用 Next.js 中间件实现速率限制
  - 使用 Redis 或内存存储记录请求频率
  - 超过限制返回 429 Too Many Requests

**安全参考：**
- PRD NFR-2.2: 数据保护（XSS 防护、输入验证）
- PRD NFR-2.3: 防攻击措施（速率限制）
- 架构文档：安全架构（输入验证、XSS 防护）

### Reliability/Availability

**NFR-5.7 数据一致性**
- **要求：** 留言删除操作必须保证数据一致性
- **标准：**
  - 使用数据库事务确保级联删除的原子性
  - 删除父留言时，所有回复必须被删除
  - 删除失败时，回滚所有更改
- **实现方式：**
  - 使用 Prisma 的事务功能
  - 使用数据库级联删除（onDelete: Cascade）
  - 错误处理和回滚机制

**NFR-5.8 错误处理**
- **要求：** 所有错误必须被正确处理和记录
- **标准：**
  - 用户友好的错误消息
  - 服务端错误日志记录
  - 错误不会导致应用崩溃
- **实现方式：**
  - 使用统一的错误响应格式
  - 使用 try-catch 捕获所有错误
  - 记录错误到日志系统

**可靠性参考：**
- 架构文档：错误处理策略（统一错误格式）
- 架构文档：日志策略（开发和生产环境）

### Observability

**NFR-5.9 日志记录**
- **要求：** 记录留言操作的关键事件
- **标准：**
  - 记录留言创建、删除操作
  - 记录错误和异常
  - 记录性能指标（查询时间、响应时间）
- **实现方式：**
  - 开发环境：使用 `console.log` 和 `console.error`
  - 生产环境：使用结构化日志（JSON 格式）
  - 记录操作类型、用户ID、时间戳

**NFR-5.10 监控指标**
- **要求：** 监控留言系统的关键指标
- **标准：**
  - 留言创建速率
  - 留言删除速率
  - 平均响应时间
  - 错误率
- **实现方式：**
  - 使用 Vercel Analytics（如果可用）
  - 自定义指标收集（可选）
  - 监控数据库查询性能

**可观测性参考：**
- 架构文档：日志策略（开发和生产环境）
- 架构文档：监控和追踪（可选）

---

## Dependencies and Integrations

### External Dependencies

**核心依赖（package.json）：**

```json
{
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "@prisma/client": "latest",
    "next-auth": "latest",
    "zod": "latest",
    "dompurify": "latest",
    "date-fns": "latest"
  },
  "devDependencies": {
    "prisma": "latest",
    "@types/dompurify": "latest"
  }
}
```

**依赖说明：**

- **next:** Next.js 框架（Server Actions、App Router）
- **react/react-dom:** React 库（组件开发）
- **@prisma/client:** Prisma 客户端（数据库操作）
- **next-auth:** NextAuth.js（身份验证和权限检查）
- **zod:** 输入验证库（留言内容验证）
- **dompurify:** HTML 清理库（XSS 防护）
- **date-fns:** 日期格式化库（留言时间显示）

### Internal Dependencies

**依赖的 Epic：**

- **Epic 1（Foundation）：** 数据库 Schema、Prisma 配置、项目结构
- **Epic 2（Authentication）：** 用户认证、角色管理、权限检查
- **Epic 4（Content Display）：** 文章详情页（留言显示位置）

**依赖的模块：**

- `lib/db/prisma.ts` - Prisma Client 实例
- `lib/auth/middleware.ts` - 认证中间件
- `lib/auth/permissions.ts` - 权限检查函数
- `lib/validations/comment.ts` - 留言验证 Schema（需要创建）

**集成点：**

- **文章详情页：** 在 `app/articles/[slug]/page.tsx` 中集成留言组件
- **留言组件：** 在 `components/comment/` 目录中创建留言相关组件
- **Server Actions：** 在 `app/articles/[slug]/actions.ts` 或单独的文件中创建留言 Server Actions

### Integration Constraints

- **数据库约束：** 必须使用已定义的 `Comment` 模型（不能修改 Schema）
- **认证约束：** 必须使用 NextAuth.js 进行身份验证（不能使用其他认证库）
- **API 约束：** 必须使用 Server Actions 处理数据变更（不能使用 API Routes，除非外部集成需要）
- **组件约束：** 必须遵循架构文档中的组件命名和组织约定

---

## Acceptance Criteria (Authoritative)

### Story 5.1: 留言功能

**AC-5.1.1:** 用户在文章详情页可以看到留言区域
- **Given** 用户访问文章详情页
- **When** 页面加载完成
- **Then** 在文章内容下方显示留言区域
- **And** 留言区域包含留言列表和留言表单

**AC-5.1.2:** 用户可以提交留言
- **Given** 用户在留言表单中输入内容
- **When** 用户点击"提交"按钮
- **Then** 留言被保存到数据库
- **And** 留言立即显示在留言列表中
- **And** 显示成功消息

**AC-5.1.3:** 已登录用户的留言显示用户信息
- **Given** 用户已登录
- **When** 用户提交留言
- **Then** 留言显示用户的名称和头像（如果有）
- **And** 留言显示"回复"按钮

**AC-5.1.4:** 匿名用户的留言显示自定义名称
- **Given** 用户未登录
- **When** 用户在留言表单中输入名称和内容
- **And** 用户提交留言
- **Then** 留言显示用户输入的名称
- **And** 留言不显示头像
- **And** 留言显示"回复"按钮

**AC-5.1.5:** 留言内容验证
- **Given** 用户尝试提交留言
- **When** 留言内容为空
- **Then** 显示验证错误消息
- **And** 留言不被保存
- **When** 留言内容超过 5000 字符
- **Then** 显示验证错误消息
- **And** 留言不被保存

**AC-5.1.6:** 留言列表按时间排序
- **Given** 文章有多条留言
- **When** 用户查看留言列表
- **Then** 留言按创建时间倒序排列（最新的在顶部或底部，根据设计决定）

### Story 5.2: 留言回复功能

**AC-5.2.1:** 用户可以回复留言
- **Given** 文章有留言
- **When** 用户点击留言的"回复"按钮
- **Then** 在留言下方显示回复表单
- **When** 用户输入回复内容并提交
- **Then** 回复被保存到数据库
- **And** 回复显示在父留言下方（嵌套显示）
- **And** 显示成功消息

**AC-5.2.2:** 回复显示嵌套结构
- **Given** 留言有回复
- **When** 用户查看留言列表
- **Then** 回复显示在父留言下方（缩进或视觉区分）
- **And** 回复显示回复者的名称和时间
- **And** 回复可以继续被回复（支持多级嵌套）

**AC-5.2.3:** 回复限制嵌套深度（可选）
- **Given** 系统设置了最大嵌套深度（例如 3 层）
- **When** 用户尝试在达到最大深度的留言下回复
- **Then** 显示提示消息（"已达到最大回复深度"）
- **And** 不允许继续回复（或提供替代方案）

**AC-5.2.4:** 回复显示父留言信息
- **Given** 用户回复一条留言
- **When** 回复显示在留言列表中
- **Then** 回复显示"回复 @用户名"的提示
- **And** 用户可以点击提示跳转到父留言

### Story 5.3: 留言管理功能（博主）

**AC-5.3.1:** 管理员可以看到删除按钮
- **Given** 管理员已登录
- **When** 管理员查看文章留言
- **Then** 每条留言显示"删除"按钮
- **And** 普通用户看不到删除按钮

**AC-5.3.2:** 管理员可以删除留言
- **Given** 管理员已登录
- **When** 管理员点击留言的"删除"按钮
- **Then** 显示确认对话框
- **When** 管理员确认删除
- **Then** 留言从数据库删除
- **And** 留言从页面移除
- **And** 显示成功消息

**AC-5.3.3:** 删除留言时级联删除回复
- **Given** 留言有回复
- **When** 管理员删除父留言
- **Then** 父留言被删除
- **And** 所有回复也被删除（级联删除）
- **And** 页面更新，移除所有相关留言

**AC-5.3.4:** 非管理员无法删除留言
- **Given** 普通用户已登录
- **When** 普通用户尝试调用删除 API
- **Then** 返回 403 Forbidden 错误
- **And** 显示错误消息（"您没有权限执行此操作"）

**AC-5.3.5:** 未登录用户无法删除留言
- **Given** 用户未登录
- **When** 用户尝试调用删除 API
- **Then** 返回 401 Unauthorized 错误
- **And** 显示错误消息（"请先登录"）

---

## Traceability Mapping

| 接受标准 | 规范章节 | 组件/API | 测试想法 |
|---------|---------|---------|---------|
| AC-5.1.1 | 留言显示组件 | `components/comment/CommentList.tsx` | 测试留言区域在文章详情页正确显示 |
| AC-5.1.2 | 留言创建模块、Server Action | `createCommentAction` | 测试留言创建流程，验证数据库保存 |
| AC-5.1.3 | 留言显示组件 | `components/comment/CommentItem.tsx` | 测试已登录用户的留言显示用户信息 |
| AC-5.1.4 | 留言表单组件 | `components/comment/CommentForm.tsx` | 测试匿名用户留言功能 |
| AC-5.1.5 | 输入验证模块 | `lib/validations/comment.ts` | 测试留言内容验证（空内容、长度限制） |
| AC-5.1.6 | 留言查询模块 | `getCommentsAction` | 测试留言列表排序（按创建时间） |
| AC-5.2.1 | 留言回复模块、Server Action | `createCommentAction` (with parentId) | 测试回复创建流程，验证嵌套保存 |
| AC-5.2.2 | 留言显示组件 | `components/comment/CommentList.tsx` | 测试嵌套回复的显示结构 |
| AC-5.2.3 | 留言回复模块 | `createCommentAction` | 测试嵌套深度限制（如果实现） |
| AC-5.2.4 | 留言显示组件 | `components/comment/CommentItem.tsx` | 测试回复显示父留言信息 |
| AC-5.3.1 | 权限检查模块、留言显示组件 | `components/comment/CommentItem.tsx` | 测试管理员看到删除按钮，普通用户看不到 |
| AC-5.3.2 | 留言删除模块、Server Action | `deleteCommentAction` | 测试管理员删除留言流程 |
| AC-5.3.3 | 留言删除模块、数据库级联删除 | Prisma `onDelete: Cascade` | 测试级联删除功能 |
| AC-5.3.4 | 权限检查模块 | `deleteCommentAction` | 测试普通用户无法删除留言 |
| AC-5.3.5 | 认证中间件 | `deleteCommentAction` | 测试未登录用户无法删除留言 |

---

## Risks, Assumptions, Open Questions

### Risks

**R-5.1: 留言 spam 风险**
- **描述：** 恶意用户可能大量提交留言，导致数据库压力和服务性能下降
- **影响：** 高
- **缓解措施：**
  - 实现速率限制（每个 IP 每分钟最多 10 条留言）
  - 实现用户级别的速率限制（每个用户每分钟最多 5 条留言）
  - 考虑实现留言审核功能（Post-MVP）
  - 监控留言创建速率，设置告警

**R-5.2: XSS 攻击风险**
- **描述：** 用户可能在留言中注入恶意脚本，导致 XSS 攻击
- **影响：** 高
- **缓解措施：**
  - 使用 DOMPurify 清理所有用户输入
  - 使用 React 的自动转义（默认行为）
  - 实施严格的输入验证（Zod Schema）
  - 使用 Content Security Policy (CSP) 头部

**R-5.3: 嵌套回复性能风险**
- **描述：** 如果文章有大量留言和深层嵌套回复，可能导致查询和渲染性能问题
- **影响：** 中
- **缓解措施：**
  - 优化数据库查询（使用 Prisma include 和 select）
  - 在应用层构建留言树（避免 N+1 查询）
  - 考虑实现留言分页（如果留言数量 > 100）
  - 使用 React 的 `useMemo` 优化组件渲染
  - 考虑限制嵌套深度（例如 3 层）

**R-5.4: 级联删除数据丢失风险**
- **描述：** 管理员误删留言可能导致重要回复丢失
- **影响：** 中
- **缓解措施：**
  - 实现删除确认对话框
  - 考虑实现软删除（标记为已删除，不实际删除数据）
  - 考虑实现留言恢复功能（Post-MVP）
  - 记录删除操作日志

### Assumptions

**A-5.1: 留言数量假设**
- **假设：** 每篇文章的留言数量不会超过 1000 条
- **依据：** 个人博客的典型留言数量
- **如果假设不成立：** 需要实现留言分页功能

**A-5.2: 嵌套深度假设**
- **假设：** 留言的嵌套深度通常不超过 3 层
- **依据：** 大多数博客的留言嵌套深度
- **如果假设不成立：** 需要优化深层嵌套的显示和性能

**A-5.3: 匿名留言假设**
- **假设：** 允许匿名用户留言（输入名称）
- **依据：** PRD 功能需求 FR-4.1 提到"支持未登录用户留言（可选）"
- **如果假设不成立：** 需要修改为仅允许登录用户留言

**A-5.4: 留言审核假设**
- **假设：** MVP 阶段不需要留言审核功能，所有留言立即显示
- **依据：** Epic 5 的 Out-of-Scope 明确说明留言审核不在范围内
- **如果假设不成立：** 需要实现留言审核功能（Post-MVP）

### Open Questions

**Q-5.1: 留言编辑功能**
- **问题：** 是否需要在 MVP 阶段实现留言编辑功能？
- **当前决定：** 不在 MVP 范围内（Out-of-Scope）
- **后续考虑：** 如果用户需求强烈，可以在 Post-MVP 阶段实现

**Q-5.2: 留言点赞功能**
- **问题：** 是否需要在 MVP 阶段实现留言点赞功能？
- **当前决定：** 不在 MVP 范围内（Out-of-Scope）
- **后续考虑：** 如果用户需求强烈，可以在 Post-MVP 阶段实现

**Q-5.3: 留言通知功能**
- **问题：** 是否需要在 MVP 阶段实现留言通知功能（邮件、推送）？
- **当前决定：** 不在 MVP 范围内（Out-of-Scope）
- **后续考虑：** 如果用户需求强烈，可以在 Post-MVP 阶段实现

**Q-5.4: 留言排序选项**
- **问题：** 是否需要提供留言排序选项（按时间、按点赞数等）？
- **当前决定：** MVP 阶段仅支持按时间排序（最新的在顶部或底部）
- **后续考虑：** 如果用户需求强烈，可以在 Post-MVP 阶段实现

**Q-5.5: 留言分页**
- **问题：** 如果文章有大量留言（> 100），是否需要实现留言分页？
- **当前决定：** MVP 阶段不实现分页，如果性能有问题再考虑
- **后续考虑：** 根据实际使用情况决定是否实现分页

---

## Test Strategy Summary

### Test Levels

**单元测试（Unit Tests）：**
- **目标：** 测试各个模块和函数的独立功能
- **覆盖范围：**
  - 留言验证函数（Zod Schema）
  - 留言树构建函数（将扁平列表转换为嵌套树）
  - 权限检查函数
  - 日期格式化函数
- **测试框架：** Jest + React Testing Library
- **位置：** `tests/__tests__/unit/`

**集成测试（Integration Tests）：**
- **目标：** 测试 Server Actions 和数据库交互
- **覆盖范围：**
  - `createCommentAction` - 留言创建流程
  - `getCommentsAction` - 留言查询流程
  - `deleteCommentAction` - 留言删除流程
  - 数据库级联删除功能
- **测试框架：** Jest + Prisma Test Client
- **位置：** `tests/__tests__/integration/`

**组件测试（Component Tests）：**
- **目标：** 测试 React 组件的渲染和交互
- **覆盖范围：**
  - `CommentForm` - 留言表单组件
  - `CommentList` - 留言列表组件
  - `CommentItem` - 单个留言组件
  - 嵌套回复显示
  - 删除按钮显示（管理员 vs 普通用户）
- **测试框架：** Jest + React Testing Library
- **位置：** `tests/__tests__/unit/components/comment/`

**端到端测试（E2E Tests）：**
- **目标：** 测试完整的用户流程
- **覆盖范围：**
  - 用户创建留言流程
  - 用户回复留言流程
  - 管理员删除留言流程
  - 匿名用户留言流程
  - 权限控制流程
- **测试框架：** Playwright
- **位置：** `tests/e2e/`

### Test Coverage Goals

- **单元测试覆盖率：** ≥ 80%
- **集成测试覆盖率：** ≥ 90%（关键路径）
- **组件测试覆盖率：** ≥ 80%
- **E2E 测试覆盖率：** 所有关键用户流程

### Critical Test Scenarios

**留言创建测试：**
1. 测试已登录用户创建留言
2. 测试匿名用户创建留言（输入名称）
3. 测试留言内容验证（空内容、长度限制）
4. 测试留言创建后的 UI 更新
5. 测试留言创建错误处理

**留言回复测试：**
1. 测试用户回复留言
2. 测试嵌套回复显示（多级嵌套）
3. 测试嵌套深度限制（如果实现）
4. 测试回复创建后的 UI 更新

**留言删除测试：**
1. 测试管理员删除留言
2. 测试级联删除回复
3. 测试普通用户无法删除留言
4. 测试未登录用户无法删除留言
5. 测试删除确认对话框

**权限控制测试：**
1. 测试管理员看到删除按钮
2. 测试普通用户看不到删除按钮
3. 测试权限检查中间件

**性能测试：**
1. 测试大量留言的加载性能（100+ 条留言）
2. 测试深层嵌套回复的渲染性能（3+ 层嵌套）
3. 测试留言创建响应时间

**安全测试：**
1. 测试 XSS 防护（恶意脚本注入）
2. 测试 SQL 注入防护（Prisma 自动处理）
3. 测试速率限制（防止 spam）
4. 测试权限绕过尝试

### Test Data Strategy

- **测试数据库：** 使用独立的测试数据库（Prisma Test Client）
- **测试数据：** 创建测试文章、用户、留言数据
- **数据清理：** 每个测试后清理测试数据
- **隔离性：** 每个测试独立运行，不依赖其他测试

### Test Execution Strategy

- **开发阶段：** 运行单元测试和组件测试（快速反馈）
- **提交前：** 运行所有测试（单元、集成、组件）
- **CI/CD：** 运行所有测试，包括 E2E 测试
- **性能测试：** 定期运行性能测试（手动或自动化）

---

_This technical specification provides comprehensive implementation guidance for Epic 5: Reader Interaction, ensuring consistent and high-quality implementation across all stories._

