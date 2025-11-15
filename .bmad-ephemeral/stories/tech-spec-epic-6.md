# Epic Technical Specification: 后台管理界面（Admin Dashboard）

Date: 2025-11-15
Author: Travis
Epic ID: 6
Status: Draft

---

## Overview

Epic 6 实现 travis-blog 的后台管理界面系统，为博主提供统一的后台管理入口，方便管理文章、查看统计等。根据 PRD 的功能需求 FR-6.1 和 FR-6.2，本 Epic 涵盖后台管理界面基础结构、文章管理列表和后台文章编辑集成功能。

本 Epic 是博客系统的管理模块，为博主提供集中的内容管理界面。所有功能将使用 Next.js App Router 的 Server Components 和 Client Components，通过现有的 API Routes 和 Server Actions 操作数据，并使用 Tailwind CSS 实现专业的管理界面。后台管理界面需要严格的权限控制，只有管理员可以访问。

**注意**: 部分功能（文章管理列表、文章创建和编辑页面）已在 Epic 3 中实现。本 Epic 主要任务是创建统一的 admin layout 和导航菜单，并将现有功能集成到后台管理界面中。

---

## Objectives and Scope

### In-Scope

- ✅ **后台管理界面基础结构：** 创建 `/admin` 路由，实现 admin layout 组件和导航菜单
- ✅ **文章管理列表：** 在后台显示所有文章列表，支持筛选、搜索和操作（编辑、删除）
- ✅ **后台文章编辑集成：** 将文章创建和编辑页面集成到后台管理界面，添加导航和统一布局
- ✅ **权限控制：** 所有后台路由需要管理员权限，非管理员用户被重定向
- ✅ **导航菜单：** 提供清晰的导航菜单，方便在不同管理功能之间切换
- ✅ **统一布局：** 所有后台页面使用统一的布局和样式

### Out-of-Scope

- ❌ **统计功能：** 文章统计、阅读量统计等功能不在本 Epic 范围内，属于后续功能
- ❌ **用户管理：** 用户管理功能不在本 Epic 范围内（Epic 2 已实现基础功能）
- ❌ **留言管理界面：** 留言管理界面不在本 Epic 范围内（Epic 5 已实现留言删除功能）
- ❌ **媒体管理界面：** 媒体管理界面不在本 Epic 范围内（Epic 3 Story 3.8 已实现）
- ❌ **分类和标签管理界面：** 分类和标签管理界面不在本 Epic 范围内（Epic 3 已实现基础功能）
- ❌ **仪表板统计：** 仪表板首页的统计图表不在本 Epic 范围内（MVP 阶段不包含）

---

## System Architecture Alignment

本 Epic 与系统架构完全对齐，使用以下架构组件和模式：

**前端架构：**
- 使用 Next.js App Router 的 Server Components 和 Client Components
- 使用 React 组件实现管理界面：`app/admin/` 目录
- 使用 Tailwind CSS 实现专业的管理界面
- 组件组织：
  - `app/admin/layout.tsx` - Admin layout 组件（Server Component）
  - `app/admin/page.tsx` - Admin dashboard 首页（Server Component）
  - `app/admin/articles/page.tsx` - 文章管理列表（Client Component）
  - `app/admin/articles/new/page.tsx` - 文章创建页面（Client Component）
  - `app/admin/articles/[id]/edit/page.tsx` - 文章编辑页面（Client Component）

**后端架构：**
- 使用现有的 API Routes 处理数据操作（Epic 3 已实现）
- 使用现有的 Server Actions（如果适用）
- API 端点：`app/api/articles/` 目录（已存在）
- 数据模型：使用已定义的 `Article` 模型（Epic 3 已实现）

**权限架构：**
- 使用 NextAuth.js 进行身份验证（Epic 2 已实现）
- 使用 middleware 保护 admin 路由（Epic 2 Story 2.4 已实现）
- 使用 `requireAdmin` 函数验证管理员权限（Epic 2 Story 2.5 已实现）
- 所有 admin 路由需要 ADMIN 角色

**架构决策对齐：**
- ✅ **Server Components 模式：** 使用 Server Components 进行数据获取和权限检查
- ✅ **Client Components 模式：** 使用 Client Components 处理交互（表单、列表操作）
- ✅ **权限检查：** 使用 middleware 和 Server Components 双重权限检查
- ✅ **JSDoc 注释：** 所有公共函数和组件包含 JSDoc 注释
- ✅ **统一错误处理：** 使用统一的错误响应格式

**约束：**
- 必须遵循架构文档中定义的命名约定
- 必须使用现有的 API Routes（不能创建新的 API 端点，除非必要）
- 必须使用 middleware 保护所有 admin 路由
- 所有 admin 页面必须在 Server Component 中进行权限检查

---

## Detailed Design

### Services and Modules

| 模块/服务 | 职责 | 输入 | 输出 | 所有者 |
|----------|------|------|------|--------|
| **Admin Layout 模块** | 提供统一的 admin 布局和导航菜单 | 子页面内容 | React 布局组件 | Story 6.1 |
| **Admin Navigation 模块** | 提供导航菜单，链接到不同管理功能 | 当前路由 | React 导航组件 | Story 6.1 |
| **文章管理列表模块** | 显示所有文章列表，支持筛选和搜索 | 筛选参数、搜索关键词 | 文章列表、分页信息 | Story 6.2 |
| **文章创建集成模块** | 将文章创建页面集成到 admin 布局 | 文章数据 | 创建的文章对象 | Story 6.3 |
| **文章编辑集成模块** | 将文章编辑页面集成到 admin 布局 | 文章 ID、更新数据 | 更新的文章对象 | Story 6.3 |
| **权限检查模块** | 验证用户权限（管理员） | 用户会话 | 权限验证结果 | Story 6.1（复用 Epic 2） |

### Data Models and Contracts

**数据库 Schema（Prisma）：**

本 Epic 使用现有的数据模型，无需修改数据库 schema：

```prisma
model Article {
  id          String        @id @default(cuid())
  title       String
  content     String        @db.Text
  excerpt     String?
  slug        String        @unique
  status      ArticleStatus @default(DRAFT)
  categoryId  String?
  authorId    String
  publishedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  author      User          @relation(fields: [authorId], references: [id])
  category    Category?     @relation(fields: [categoryId], references: [id])
  tags        ArticleTag[]
  comments    Comment[]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  articles  Article[]
  comments  Comment[]
}
```

**数据关系：**
- User → Articles (One-to-Many) - 用户创建的文章
- Article → Category (Many-to-One) - 文章分类
- Article → Tags (Many-to-Many) - 文章标签
- Article → Comments (One-to-Many) - 文章留言

### APIs and Interfaces

**现有 API Routes（Epic 3 已实现）：**

**文章管理 API：**
```typescript
// Get all articles (admin only)
GET /api/articles
Query params: ?page=1&limit=10&status=all|published|drafts&search=keyword
Response: { success: true, data: { articles: Article[], pagination: Pagination } }

// Get single article
GET /api/articles/[id]
Response: { success: true, data: Article }

// Create article
POST /api/articles
Body: { title, content, excerpt, categoryId, tagIds, status }
Response: { success: true, data: Article }

// Update article
PUT /api/articles/[id]
Body: { title, content, excerpt, categoryId, tagIds, status }
Response: { success: true, data: Article }

// Delete article
DELETE /api/articles/[id]
Response: { success: true, message: string }
```

**分类和标签 API：**
```typescript
// Get all categories
GET /api/categories
Response: { success: true, data: Category[] }

// Get all tags
GET /api/tags
Response: { success: true, data: Tag[] }
```

**权限检查接口：**
```typescript
// Middleware protection (Epic 2 已实现)
middleware.ts - 保护 /admin/* 路由，要求 ADMIN 角色

// Server Component permission check
getServerSession(authOptions) - 在 Server Components 中检查用户会话
requireAdmin(user) - 在 API Routes 中检查管理员权限
```

**Admin Layout 接口：**
```typescript
// Admin layout component
interface AdminLayoutProps {
  children: React.ReactNode;
}

// Admin navigation component
interface AdminNavProps {
  currentPath?: string;
}
```

### Workflows and Sequencing

**Story 6.1: 后台管理界面基础结构**

1. **用户访问 `/admin`**
   - Middleware 检查用户是否已登录
   - 如果未登录，重定向到 `/login?callbackUrl=/admin`
   - Middleware 检查用户角色是否为 ADMIN
   - 如果非管理员，重定向到首页并显示错误消息

2. **Server Component 权限检查**
   - `app/admin/layout.tsx` 使用 `getServerSession` 检查用户会话
   - 如果用户未登录或非管理员，重定向到登录页或首页

3. **渲染 Admin Layout**
   - 显示统一的 admin 布局（header、sidebar、main content）
   - 显示导航菜单（文章管理、媒体管理、设置等）
   - 渲染子页面内容

**Story 6.2: 文章管理列表**

1. **用户访问 `/admin/articles`**
   - Middleware 和 Layout 进行权限检查
   - 加载文章列表数据（从 `/api/articles`）

2. **显示文章列表**
   - 显示所有文章（已发布和草稿）
   - 显示文章信息：标题、状态、发布日期、作者、分类、标签
   - 显示操作按钮：编辑、删除

3. **筛选和搜索**
   - 用户可以选择状态筛选（全部/已发布/草稿）
   - 用户可以搜索文章标题
   - 更新 URL 参数并重新加载数据

4. **文章操作**
   - 点击"编辑"按钮，导航到 `/admin/articles/[id]/edit`
   - 点击"删除"按钮，显示确认对话框，删除文章
   - 点击"新建文章"按钮，导航到 `/admin/articles/new`

**Story 6.3: 后台文章编辑集成**

1. **用户创建新文章**
   - 用户点击"新建文章"按钮
   - 导航到 `/admin/articles/new`
   - 显示文章创建表单（Tiptap 编辑器、分类、标签等）
   - 用户填写表单并提交
   - 调用 `POST /api/articles` 创建文章
   - 成功后导航回文章列表或文章详情页

2. **用户编辑文章**
   - 用户点击文章列表中的"编辑"按钮
   - 导航到 `/admin/articles/[id]/edit`
   - 加载文章数据并填充表单
   - 用户修改内容并提交
   - 调用 `PUT /api/articles/[id]` 更新文章
   - 成功后显示成功消息或导航回文章列表

3. **导航集成**
   - 所有页面使用统一的 admin layout
   - 提供"返回文章列表"导航链接
   - 显示面包屑导航（可选）

---

## Non-Functional Requirements

### Performance

**NFR-6.1 页面加载性能：**
- Admin 页面首次加载时间 < 2 秒（管理界面需要快速响应）
- 文章列表加载时间 < 1 秒（支持分页，每页 20 条）
- 文章编辑页面加载时间 < 1.5 秒（包括文章数据和分类/标签数据）

**NFR-6.2 列表性能：**
- 文章列表支持分页，避免一次性加载所有文章
- 使用客户端分页或服务端分页（根据数据量选择）
- 搜索和筛选操作响应时间 < 500ms

**参考**: [Source: docs/architecture.md#Performance-Architecture]

### Security

**NFR-6.2 权限控制：**
- 所有 `/admin/*` 路由必须通过 middleware 权限检查
- Server Components 中必须再次验证用户权限（双重检查）
- 非管理员用户访问 admin 路由时，返回 403 Forbidden 或重定向到首页
- 所有 API 调用必须验证管理员权限

**NFR-6.3 会话管理：**
- 使用 NextAuth.js 管理用户会话
- 会话过期后自动重定向到登录页
- 保护敏感操作（删除文章）需要确认对话框

**参考**: [Source: docs/architecture.md#Security-Architecture], [Source: middleware.ts], [Source: lib/auth/permissions.ts]

### Reliability/Availability

**NFR-6.4 错误处理：**
- 网络错误时显示友好的错误消息
- API 调用失败时提供重试机制
- 文章加载失败时显示错误页面或错误消息
- 表单验证错误时显示具体的错误信息

**NFR-6.5 数据一致性：**
- 文章删除操作需要确认对话框，防止误操作
- 文章编辑时检测并发修改（可选，MVP 阶段不包含）
- 确保文章状态变更（草稿/已发布）的一致性

### Observability

**NFR-6.6 日志记录：**
- 记录所有 admin 操作（创建、编辑、删除文章）
- 记录权限拒绝事件（非管理员尝试访问 admin 路由）
- 使用结构化日志格式

**NFR-6.7 用户反馈：**
- 操作成功时显示成功消息（toast 或 alert）
- 操作失败时显示错误消息
- 加载状态时显示加载指示器

---

## Dependencies and Integrations

### External Dependencies

**Next.js:**
- `next` (^16.0.2) - Next.js 框架
- `next-auth` (^4.24.13) - 认证和会话管理

**React:**
- `react` (^19.2.0) - React 库
- `react-dom` (^19.2.0) - React DOM

**UI Libraries:**
- `tailwindcss` - CSS 框架（已安装）
- `date-fns` (^4.1.0) - 日期格式化（已安装）

**Editor:**
- `@tiptap/react` - Tiptap 编辑器（Epic 3 已安装）
- `@tiptap/starter-kit` - Tiptap 基础功能（Epic 3 已安装）

### Internal Dependencies

**Epic 2 依赖：**
- 用户认证系统（NextAuth.js）
- 权限管理系统（`lib/auth/permissions.ts`）
- Middleware 路由保护（`middleware.ts`）

**Epic 3 依赖：**
- 文章数据模型（Prisma schema）
- 文章 API Routes (`app/api/articles/`)
- Tiptap 编辑器组件 (`components/editor/TiptapEditor.tsx`)
- 分类和标签 API (`app/api/categories/`, `app/api/tags/`)

**Epic 5 依赖：**
- 无直接依赖（留言管理功能不在本 Epic 范围内）

### Integration Points

**Middleware Integration:**
- `middleware.ts` 保护所有 `/admin/*` 路由
- 检查用户认证状态和 ADMIN 角色
- 重定向未授权用户

**API Integration:**
- 使用现有的 `/api/articles` 端点（Epic 3 已实现）
- 使用现有的 `/api/categories` 和 `/api/tags` 端点（Epic 3 已实现）
- 所有 API 调用需要管理员权限验证

**Component Integration:**
- 复用 `TiptapEditor` 组件（Epic 3 已实现）
- 复用文章表单组件结构（Epic 3 已实现）
- 创建新的 admin layout 和 navigation 组件

---

## Acceptance Criteria (Authoritative)

基于 Epic 6 的 Story 定义和 PRD 需求 FR-6.1、FR-6.2：

### Story 6.1: 后台管理界面基础结构

**AC-6.1.1:** Given I am logged in as an admin, When I navigate to `/admin`, Then I see the admin dashboard, And I see a navigation menu with admin sections (文章管理、媒体管理等), And the dashboard has a clean, professional layout

**AC-6.1.2:** Given I am not logged in, When I navigate to `/admin`, Then I am redirected to the login page with callback URL, And after logging in, I am redirected back to `/admin`

**AC-6.1.3:** Given I am logged in as a regular user (not admin), When I navigate to `/admin`, Then I am redirected to the homepage, And I see an error message indicating admin access is required

**AC-6.1.4:** Given I am logged in as an admin, When I view the admin dashboard, Then I see a navigation menu with links to different admin sections, And I can navigate between sections using the menu

**AC-6.1.5:** Given I am logged in as an admin, When I view any admin page, Then all pages use the same admin layout, And the navigation menu is consistent across all pages

### Story 6.2: 文章管理列表

**AC-6.2.1:** Given I am logged in as an admin, When I navigate to `/admin/articles`, Then I see a list of all articles (published and drafts), And each article shows title, status, publish date, author, category, and tags

**AC-6.2.2:** Given I am viewing the articles list, When I select a status filter (all, published, drafts), Then the list is filtered to show only articles with the selected status, And the URL is updated with the filter parameter

**AC-6.2.3:** Given I am viewing the articles list, When I enter a search keyword in the search box, Then the list is filtered to show only articles whose title contains the keyword, And the URL is updated with the search parameter

**AC-6.2.4:** Given I am viewing the articles list, When I click "New Article" button, Then I am navigated to `/admin/articles/new` to create a new article

**AC-6.2.5:** Given I am viewing the articles list, When I click "Edit" on an article, Then I am navigated to `/admin/articles/[id]/edit` to edit the article

**AC-6.2.6:** Given I am viewing the articles list, When I click "Delete" on an article, Then I see a confirmation dialog, When I confirm the deletion, Then the article is deleted, And the article is removed from the list, And I see a success message

**AC-6.2.7:** Given I am viewing the articles list, Then I see article statistics (total articles, published articles, draft articles) displayed at the top of the page

### Story 6.3: 后台文章编辑集成

**AC-6.3.1:** Given I am logged in as an admin, When I click "New Article" in the admin dashboard, Then I am taken to `/admin/articles/new`, And I see the article creation form with Tiptap editor, And the form is displayed within the admin layout with navigation menu

**AC-6.3.2:** Given I am creating a new article, When I fill in the form and click "Save as Draft" or "Publish", Then the article is saved, And I am redirected to the articles list or article detail page, And I see a success message

**AC-6.3.3:** Given I am logged in as an admin, When I click "Edit" on an article in the articles list, Then I am taken to `/admin/articles/[id]/edit`, And I see the article edit form with pre-filled data, And the form is displayed within the admin layout with navigation menu

**AC-6.3.4:** Given I am editing an article, When I make changes and save, Then the article is updated in the database, And I see a success message, And I can navigate back to the articles list using the navigation menu

**AC-6.3.5:** Given I am on any admin article page (new or edit), When I view the page, Then I see a "Back to Articles List" link or button, And clicking it navigates me back to `/admin/articles`

---

## Traceability Mapping

| 接受标准 | 规范章节 | 组件/API | 测试想法 |
|---------|---------|---------|---------|
| AC-6.1.1 | Admin Layout 模块 | `app/admin/layout.tsx`, `app/admin/page.tsx` | 测试 admin dashboard 显示，导航菜单显示 |
| AC-6.1.2 | 权限检查模块 | `middleware.ts`, `app/admin/layout.tsx` | 测试未登录用户重定向到登录页 |
| AC-6.1.3 | 权限检查模块 | `middleware.ts`, `app/admin/layout.tsx` | 测试普通用户访问 admin 路由被重定向 |
| AC-6.1.4 | Admin Navigation 模块 | `app/admin/layout.tsx` | 测试导航菜单链接功能 |
| AC-6.1.5 | Admin Layout 模块 | `app/admin/layout.tsx` | 测试所有 admin 页面使用统一布局 |
| AC-6.2.1 | 文章管理列表模块 | `app/admin/articles/page.tsx`, `GET /api/articles` | 测试文章列表显示所有文章 |
| AC-6.2.2 | 文章管理列表模块 | `app/admin/articles/page.tsx` | 测试状态筛选功能 |
| AC-6.2.3 | 文章管理列表模块 | `app/admin/articles/page.tsx` | 测试搜索功能 |
| AC-6.2.4 | 文章管理列表模块 | `app/admin/articles/page.tsx` | 测试"新建文章"按钮导航 |
| AC-6.2.5 | 文章管理列表模块 | `app/admin/articles/page.tsx` | 测试"编辑"按钮导航 |
| AC-6.2.6 | 文章管理列表模块 | `app/admin/articles/page.tsx`, `DELETE /api/articles/[id]` | 测试删除功能（确认对话框、删除操作、列表更新） |
| AC-6.2.7 | 文章管理列表模块 | `app/admin/articles/page.tsx` | 测试文章统计显示 |
| AC-6.3.1 | 文章创建集成模块 | `app/admin/articles/new/page.tsx`, `app/admin/layout.tsx` | 测试文章创建页面在 admin 布局中显示 |
| AC-6.3.2 | 文章创建集成模块 | `app/admin/articles/new/page.tsx`, `POST /api/articles` | 测试文章创建流程和导航 |
| AC-6.3.3 | 文章编辑集成模块 | `app/admin/articles/[id]/edit/page.tsx`, `app/admin/layout.tsx` | 测试文章编辑页面在 admin 布局中显示 |
| AC-6.3.4 | 文章编辑集成模块 | `app/admin/articles/[id]/edit/page.tsx`, `PUT /api/articles/[id]` | 测试文章更新流程和导航 |
| AC-6.3.5 | 文章创建/编辑集成模块 | `app/admin/articles/new/page.tsx`, `app/admin/articles/[id]/edit/page.tsx` | 测试"返回文章列表"导航链接 |

---

## Risks, Assumptions, Open Questions

### Risks

**R-6.1 现有代码集成风险：**
- **风险**: Story 6.2 和 6.3 的部分功能已在 Epic 3 中实现，需要确保集成到 admin layout 中不会破坏现有功能
- **影响**: 中等
- **缓解措施**: 
  - 仔细审查现有代码结构
  - 使用统一的 admin layout 包装现有页面
  - 充分测试现有功能是否仍然正常工作

**R-6.2 权限检查遗漏风险：**
- **风险**: 如果遗漏某些 admin 路由的权限检查，可能导致安全漏洞
- **影响**: 高
- **缓解措施**: 
  - 使用 middleware 统一保护所有 `/admin/*` 路由
  - 在 Server Components 中进行双重权限检查
  - 代码审查时重点检查权限验证

**R-6.3 布局一致性风险：**
- **风险**: 如果不同 admin 页面使用不同的布局，可能导致用户体验不一致
- **影响**: 低
- **缓解措施**: 
  - 创建统一的 `app/admin/layout.tsx` 组件
  - 所有 admin 页面都使用这个 layout
  - 使用 Tailwind CSS 确保样式一致性

### Assumptions

**A-6.1 现有 API 可用性：**
- **假设**: Epic 3 实现的文章 API (`/api/articles`) 已经稳定可用
- **验证**: 检查现有 API 端点是否满足 Story 6.2 和 6.3 的需求
- **如果假设错误**: 需要扩展或修改现有 API

**A-6.2 权限系统完整性：**
- **假设**: Epic 2 实现的权限系统（middleware、requireAdmin）已经完整且稳定
- **验证**: 测试 middleware 是否正确保护 admin 路由
- **如果假设错误**: 需要修复或增强权限系统

**A-6.3 现有页面结构：**
- **假设**: Epic 3 实现的文章创建和编辑页面可以轻松集成到 admin layout 中
- **验证**: 检查现有页面组件结构，确保可以包装在 layout 中
- **如果假设错误**: 可能需要重构现有页面组件

### Open Questions

**Q-6.1 导航菜单内容：**
- **问题**: 导航菜单应该包含哪些管理功能？
- **当前计划**: 文章管理、媒体管理（链接到现有页面）、设置（可选）
- **决策**: 根据 PRD 和实际需求确定菜单项

**Q-6.2 文章列表分页策略：**
- **问题**: 文章列表应该使用客户端分页还是服务端分页？
- **当前计划**: 使用服务端分页（通过 API 的 page 和 limit 参数）
- **决策**: 根据文章数量决定，如果文章数量较少（< 100），可以使用客户端分页

**Q-6.3 面包屑导航：**
- **问题**: 是否需要实现面包屑导航？
- **当前计划**: MVP 阶段不包含，使用"返回文章列表"链接即可
- **决策**: 根据用户体验需求决定

---

## Test Strategy Summary

### Unit Tests

**Admin Layout 组件测试：**
- 测试 layout 组件正确渲染导航菜单
- 测试权限检查逻辑（重定向未授权用户）
- 测试导航菜单链接功能
- 测试布局样式和响应式设计

**Admin Navigation 组件测试：**
- 测试导航菜单项显示
- 测试当前路由高亮
- 测试导航链接点击

**文章管理列表组件测试：**
- 测试文章列表渲染
- 测试筛选功能（状态筛选）
- 测试搜索功能
- 测试分页功能
- 测试删除确认对话框
- 测试编辑和删除按钮点击

**文章创建/编辑页面测试：**
- 测试表单渲染和预填充
- 测试表单验证
- 测试提交逻辑
- 测试导航链接

### Integration Tests

**Admin 路由保护测试：**
- 测试 middleware 保护 admin 路由
- 测试未登录用户访问 admin 路由被重定向
- 测试普通用户访问 admin 路由被重定向
- 测试管理员可以正常访问 admin 路由

**文章管理 API 集成测试：**
- 测试文章列表 API 调用（筛选、搜索、分页）
- 测试文章创建 API 调用
- 测试文章编辑 API 调用
- 测试文章删除 API 调用
- 测试权限验证（非管理员无法调用 API）

**Admin Layout 集成测试：**
- 测试所有 admin 页面使用统一 layout
- 测试导航菜单在所有页面中一致显示
- 测试权限检查在所有页面中正常工作

### E2E Tests

**Admin Dashboard 流程测试：**
- 测试管理员登录后访问 `/admin` 看到 dashboard
- 测试导航菜单功能
- 测试权限保护（未登录、普通用户无法访问）

**文章管理流程测试：**
- 测试完整的文章管理流程：查看列表 → 创建文章 → 编辑文章 → 删除文章
- 测试筛选和搜索功能
- 测试分页功能
- 测试删除确认对话框

**文章编辑集成测试：**
- 测试从文章列表导航到创建页面
- 测试从文章列表导航到编辑页面
- 测试创建/编辑页面中的"返回文章列表"链接
- 测试创建/编辑成功后导航回列表

### Test Coverage Goals

- **单元测试**: 覆盖所有组件的主要功能和边界情况
- **集成测试**: 覆盖 API 调用、权限检查、数据流
- **E2E 测试**: 覆盖关键用户流程（查看列表、创建、编辑、删除）

**测试工具：**
- Jest + React Testing Library（单元测试和组件测试）
- Playwright（E2E 测试）

**参考**: [Source: .bmad-ephemeral/stories/tech-spec-epic-5.md#Test-Strategy-Summary]

---

## Learnings from Previous Epics

### From Epic 2: 用户认证和授权

- **权限检查模式**: 使用 middleware 和 Server Components 双重权限检查
- **参考**: `middleware.ts` - 保护 admin 路由的模式
- **参考**: `lib/auth/permissions.ts` - `requireAdmin` 函数的使用
- **参考**: `app/admin/page.tsx` - Server Component 权限检查模式

### From Epic 3: 内容创作和管理

- **文章管理 API**: 使用现有的 `/api/articles` 端点，无需重新实现
- **Tiptap 编辑器**: 复用 `TiptapEditor` 组件
- **文章表单结构**: 复用文章创建和编辑页面的表单结构
- **参考**: `app/admin/articles/page.tsx` - 文章列表页面（已实现）
- **参考**: `app/admin/articles/new/page.tsx` - 文章创建页面（已实现）
- **参考**: `app/admin/articles/[id]/edit/page.tsx` - 文章编辑页面（已实现）

### From Epic 5: 读者互动

- **Server Actions 模式**: 虽然本 Epic 主要使用 API Routes，但可以参考 Server Actions 的错误处理模式
- **组件组织**: 遵循 `components/` 目录的组织模式
- **参考**: `components/comment/` - 组件组织模式

---

## Implementation Notes

### Story 6.1 实现要点

1. **创建 Admin Layout**
   - 创建 `app/admin/layout.tsx` Server Component
   - 实现权限检查（使用 `getServerSession`）
   - 实现统一的布局结构（header、sidebar、main content）
   - 实现导航菜单组件

2. **更新 Admin Dashboard 首页**
   - 更新 `app/admin/page.tsx` 使用新的 layout
   - 添加欢迎信息和快速链接

3. **权限保护**
   - 确保 middleware 保护所有 `/admin/*` 路由
   - 在 layout 中进行双重权限检查

### Story 6.2 实现要点

1. **集成现有文章列表页面**
   - 检查 `app/admin/articles/page.tsx` 是否满足需求
   - 确保页面使用 admin layout
   - 添加或完善筛选、搜索、分页功能
   - 添加文章统计显示

2. **导航集成**
   - 确保"新建文章"按钮正确导航
   - 确保"编辑"按钮正确导航
   - 添加删除确认对话框（如果尚未实现）

### Story 6.3 实现要点

1. **集成文章创建页面**
   - 检查 `app/admin/articles/new/page.tsx` 是否满足需求
   - 确保页面使用 admin layout
   - 添加"返回文章列表"导航链接
   - 确保创建成功后正确导航

2. **集成文章编辑页面**
   - 检查 `app/admin/articles/[id]/edit/page.tsx` 是否满足需求
   - 确保页面使用 admin layout
   - 添加"返回文章列表"导航链接
   - 确保编辑成功后正确导航

3. **统一用户体验**
   - 确保所有页面使用相同的布局和样式
   - 确保导航菜单在所有页面中一致显示
   - 确保错误处理和成功消息一致

---

## References

- **Epic Definition**: [Source: docs/epics.md#Epic-6-后台管理界面（Admin-Dashboard）]
- **PRD Requirements**: [Source: docs/PRD.md#FR-61-后台管理界面, FR-6.2-文章管理]
- **Architecture**: [Source: docs/architecture.md#Project-Structure, Security-Architecture]
- **Database Schema**: [Source: prisma/schema.prisma#Article-model, User-model]
- **Permission System**: [Source: lib/auth/permissions.ts, middleware.ts]
- **Existing Admin Pages**: [Source: app/admin/page.tsx, app/admin/articles/page.tsx, app/admin/articles/new/page.tsx, app/admin/articles/[id]/edit/page.tsx]
- **Previous Epic Tech Specs**: [Source: .bmad-ephemeral/stories/tech-spec-epic-3.md, tech-spec-epic-5.md]

