# Epic Technical Specification: 内容展示（Content Display）

Date: 2025-11-14
Author: Travis
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 实现 travis-blog 的内容展示系统，为博客平台提供前台文章列表、详情页、分类筛选、标签筛选和分页功能。根据 PRD 的功能需求 FR-3.1 到 FR-3.5，本 Epic 涵盖文章列表展示、文章详情展示、分类筛选、标签筛选和分页功能。

本 Epic 是博客系统的前台展示模块，为读者提供浏览和阅读文章的核心功能。所有功能将使用 Next.js App Router 的 Server Components 和 Client Components，通过公开 API 端点获取已发布的文章数据，并使用 Tailwind CSS 实现响应式设计。

---

## Objectives and Scope

### In-Scope

- **文章列表页面（首页）：** 在首页显示已发布文章列表，包含标题、摘要、发布日期、分类和标签
- **文章详情页面：** 显示完整文章内容，包含文章元数据和格式化内容
- **分类筛选功能：** 支持按分类筛选文章，显示分类页面和文章数量
- **标签筛选功能：** 支持按标签筛选文章，显示标签页面和文章数量
- **分页功能：** 支持文章列表分页，包含页码导航和 URL 参数

### Out-of-Scope

- **文章搜索功能：** 全文搜索功能不在本 Epic 范围内，属于后续功能
- **文章排序选项：** 除默认的发布日期排序外，其他排序选项不在本 Epic 范围内
- **文章推荐功能：** 相关文章推荐功能不在本 Epic 范围内（属于 Epic 5 或后续功能）
- **阅读统计：** 文章阅读量统计不在本 Epic 范围内（属于 Epic 5）
- **文章评论功能：** 评论功能属于 Epic 5（读者互动）
- **SEO 优化：** SEO 元标签和结构化数据属于 Epic 7

---

## System Architecture Alignment

本 Epic 与系统架构完全对齐，使用以下架构组件和模式：

**前端架构：**
- 使用 Next.js App Router 的 Server Components 进行服务端渲染
- 使用 Client Components 处理交互功能（分页、筛选）
- 使用 Tailwind CSS 实现响应式设计
- 组件组织：`components/article/` 目录

**API 架构：**
- 使用已实现的公开 API 端点：`GET /api/articles/public` 和 `GET /api/articles/public/[slug]`
- 统一响应格式：`{ success: boolean, data: T, error?: { message: string, code: string } }`
- HTTP 状态码：200 (Success), 404 (Not Found), 500 (Internal Server Error)
- 支持查询参数：`categoryId`, `categorySlug`, `tagId`, `tagSlug`, `page`, `limit`

**路由架构：**
- 首页：`app/page.tsx` - 文章列表
- 文章详情：`app/articles/[slug]/page.tsx` - 单个文章
- 分类页面：`app/articles/category/[slug]/page.tsx` - 分类筛选
- 标签页面：`app/articles/tag/[slug]/page.tsx` - 标签筛选

**数据架构：**
- Article 模型已存在于 Prisma schema 中，包含所有必需字段
- Category 和 Tag 模型已定义，支持分类和标签筛选
- 使用 Prisma ORM 进行数据库查询
- 索引已优化：`articles.publishedAt`, `articles.slug`, `categories.slug`, `tags.slug`

**样式架构：**
- 使用 Tailwind CSS 实现响应式设计
- 移动端优先设计（Mobile-first）
- 使用 shadcn/ui 组件库（如需要）

参考：[Source: docs/architecture.md#Project-Structure], [Source: docs/architecture.md#API-Contracts], [Source: prisma/schema.prisma], [Source: app/api/articles/public/route.ts]

---

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **Homepage Component** | 显示文章列表 | 无 | 文章列表 UI | `app/page.tsx` |
| **Article List Component** | 文章列表展示 | 文章数据数组 | 文章卡片列表 | `components/article/ArticleList.tsx` |
| **Article Card Component** | 单个文章卡片 | 文章对象 | 文章卡片 UI | `components/article/ArticleCard.tsx` |
| **Article Detail Page** | 文章详情展示 | 文章 slug | 文章详情页面 | `app/articles/[slug]/page.tsx` |
| **Article Detail Component** | 文章内容渲染 | 文章对象 | 格式化文章内容 | `components/article/ArticleDetail.tsx` |
| **Category Page** | 分类筛选页面 | 分类 slug | 分类文章列表 | `app/articles/category/[slug]/page.tsx` |
| **Tag Page** | 标签筛选页面 | 标签 slug | 标签文章列表 | `app/articles/tag/[slug]/page.tsx` |
| **Pagination Component** | 分页导航 | 分页元数据 | 分页 UI | `components/article/Pagination.tsx` |
| **Public Articles API** | 获取已发布文章 | 查询参数 | 文章列表和分页数据 | `app/api/articles/public/route.ts` |
| **Public Article Detail API** | 获取单个文章 | 文章 slug | 文章详情 | `app/api/articles/public/[slug]/route.ts` |

### Data Models and Contracts

**Article Response Model (from API):**

```typescript
interface ArticleResponse {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  status: "PUBLISHED";
  categoryId: string | null;
  authorId: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}
```

**Articles List Response:**

```typescript
interface ArticlesListResponse {
  success: true;
  data: {
    articles: ArticleResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

**Article Detail Response:**

```typescript
interface ArticleDetailResponse {
  success: true;
  data: ArticleResponse;
}
```

### APIs and Interfaces

**Public Articles API Endpoints:**

1. **GET /api/articles/public**
   - **Description:** 获取已发布文章列表（公开端点，无需认证）
   - **Authentication:** 不需要
   - **Query Parameters:**
     - `categoryId?: string` - 按分类 ID 筛选
     - `categorySlug?: string` - 按分类 slug 筛选
     - `tagId?: string` - 按标签 ID 筛选
     - `tagSlug?: string` - 按标签 slug 筛选
     - `page?: number` - 页码（默认 1）
     - `limit?: number` - 每页数量（默认 20，最大 100）
   - **Response (200):**
     ```typescript
     {
       success: true;
       data: {
         articles: ArticleResponse[];
         pagination: {
           page: number;
           limit: number;
           total: number;
           totalPages: number;
         };
       };
     }
     ```
   - **Error Responses:**
     - 500: Internal server error

2. **GET /api/articles/public/[slug]**
   - **Description:** 获取单个已发布文章（公开端点，无需认证）
   - **Authentication:** 不需要
   - **Path Parameters:**
     - `slug: string` - 文章 slug
   - **Response (200):**
     ```typescript
     {
       success: true;
       data: ArticleResponse;
     }
     ```
   - **Error Responses:**
     - 404: Article not found (文章不存在或未发布)
     - 500: Internal server error

**Note:** 这些 API 端点已在 Epic 3 中实现，本 Epic 只需要使用它们。

### Workflows and Sequencing

**文章列表页面流程：**

1. 用户访问首页 (`/`)
2. Server Component 调用 `GET /api/articles/public?page=1&limit=20`
3. API 返回已发布文章列表和分页信息
4. Server Component 渲染文章列表 UI
5. 用户点击文章卡片
6. 导航到文章详情页面 (`/articles/[slug]`)

**文章详情页面流程：**

1. 用户访问文章详情页 (`/articles/[slug]`)
2. Server Component 调用 `GET /api/articles/public/[slug]`
3. API 返回文章详情（如果存在且已发布）
4. Server Component 渲染文章内容
5. 如果文章不存在或未发布，显示 404 页面

**分类筛选流程：**

1. 用户点击分类链接（在文章卡片或导航中）
2. 导航到分类页面 (`/articles/category/[slug]`)
3. Server Component 调用 `GET /api/articles/public?categorySlug=[slug]&page=1&limit=20`
4. API 返回该分类下的已发布文章
5. Server Component 渲染筛选后的文章列表
6. URL 反映当前筛选状态

**标签筛选流程：**

1. 用户点击标签（在文章卡片或文章详情中）
2. 导航到标签页面 (`/articles/tag/[slug]`)
3. Server Component 调用 `GET /api/articles/public?tagSlug=[slug]&page=1&limit=20`
4. API 返回该标签下的已发布文章
5. Server Component 渲染筛选后的文章列表
6. URL 反映当前筛选状态

**分页流程：**

1. 用户在文章列表页面
2. 用户点击分页控件（上一页、下一页、页码）
3. URL 更新为新的页码参数 (`?page=2`)
4. Server Component 重新获取数据
5. 显示新页面的文章列表

---

## Non-Functional Requirements

### Performance

**页面加载性能：**
- 首页首次内容绘制（FCP）: < 1.5s
- 文章列表 API 响应时间: < 200ms
- 文章详情 API 响应时间: < 150ms
- 使用 Next.js Server Components 进行服务端渲染，减少客户端 JavaScript

**数据库查询性能：**
- 文章列表查询使用索引：`articles.publishedAt`（排序）
- 分类和标签筛选使用索引：`categories.slug`, `tags.slug`
- 分页查询使用 `skip` 和 `take`，避免加载所有数据

**图片加载性能：**
- 文章内容中的图片使用 Next.js Image 组件
- 实现图片懒加载（lazy loading）
- 图片优化在 Epic 7 中实现

参考：[Source: docs/architecture.md#Performance-Considerations]

### Security

**数据访问控制：**
- 公开 API 端点只返回已发布（PUBLISHED）的文章
- 草稿（DRAFT）文章不会在公开 API 中返回
- 文章详情 API 检查文章状态，未发布文章返回 404

**输入验证：**
- URL 参数验证（slug 格式、页码范围）
- 防止 SQL 注入：使用 Prisma ORM 参数化查询
- 防止 XSS：Next.js 自动转义 HTML 内容

**错误处理：**
- 不暴露内部错误信息给用户
- 统一错误响应格式
- 记录错误日志用于调试

参考：[Source: docs/architecture.md#Security-Architecture]

### Reliability/Availability

**错误处理：**
- 文章不存在时显示友好的 404 页面
- API 错误时显示错误消息，不崩溃
- 网络错误时提供重试机制

**空状态处理：**
- 无文章时显示空状态提示
- 分类/标签无文章时显示相应提示

**数据一致性：**
- 使用数据库事务确保数据一致性
- 文章删除时级联删除相关数据（已在 Epic 3 实现）

参考：[Source: docs/architecture.md#Error-Handling]

### Observability

**日志记录：**
- API 请求日志（开发环境）
- 错误日志（生产环境结构化日志）
- 不记录敏感信息（用户数据）

**监控指标：**
- 页面访问量（Vercel Analytics，可选）
- API 响应时间
- 错误率

参考：[Source: docs/architecture.md#Logging-Strategy]

---

## Dependencies and Integrations

### Internal Dependencies

**Epic 3（内容创作和管理）：**
- ✅ Article 数据模型已实现
- ✅ Category 和 Tag 模型已实现
- ✅ 公开 API 端点已实现：`GET /api/articles/public` 和 `GET /api/articles/public/[slug]`
- ✅ 文章状态管理（DRAFT/PUBLISHED）已实现
- ✅ 文章 slug 生成已实现

**Epic 1（项目基础架构）：**
- ✅ Next.js App Router 已配置
- ✅ Tailwind CSS 已配置
- ✅ Prisma ORM 已配置
- ✅ 数据库连接已建立

**Epic 2（用户认证和授权）：**
- ✅ 用户模型已实现（用于显示作者信息）
- ⚠️ 本 Epic 不需要认证，但需要用户数据用于显示作者信息

### External Dependencies

**Next.js:**
- Next.js App Router（Server Components, Client Components）
- Next.js Image 组件（图片优化）
- Next.js 路由系统

**Tailwind CSS:**
- 响应式设计工具类
- 自定义样式配置

**date-fns:**
- 日期格式化（显示发布日期）

**可选依赖：**
- shadcn/ui 组件库（如需要 UI 组件）

### Integration Points

**API 集成：**
- 使用 `fetch` API 调用公开端点
- 在 Server Components 中直接调用 API
- 错误处理和重试逻辑

**路由集成：**
- Next.js 动态路由：`[slug]`
- URL 参数处理：查询参数（分页、筛选）
- 路由导航：使用 Next.js Link 组件

---

## Acceptance Criteria (Authoritative)

### Story 4.1: 文章列表页面（首页）

**Given** 用户访问首页  
**When** 页面加载  
**Then** 显示已发布文章列表  
**And** 每篇文章显示标题、摘要、发布日期、分类和标签  
**And** 文章按发布日期倒序排列（最新在前）  
**And** 文章列表支持分页（每页 20 篇）  
**And** 页面响应式设计（桌面、平板、手机）  
**And** 显示加载状态  
**And** 无文章时显示空状态提示

**技术实现：**
- 创建 `app/page.tsx` Server Component
- 调用 `GET /api/articles/public?page=1&limit=20`
- 创建 `components/article/ArticleList.tsx` 组件
- 创建 `components/article/ArticleCard.tsx` 组件
- 实现响应式布局（Tailwind CSS）
- 实现加载状态和空状态

### Story 4.2: 文章详情页面

**Given** 用户在首页或文章列表  
**When** 点击文章  
**Then** 导航到文章详情页面  
**And** 显示完整文章内容  
**And** 显示文章标题、发布日期、分类和标签  
**And** 内容格式化良好，可读性强  
**And** 页面响应式设计  
**And** 文章中的图片正确显示  
**And** 文章不存在或未发布时显示 404 页面

**技术实现：**
- 创建 `app/articles/[slug]/page.tsx` Server Component
- 调用 `GET /api/articles/public/[slug]`
- 创建 `components/article/ArticleDetail.tsx` 组件
- 渲染 HTML 内容（来自 Tiptap）
- 实现响应式排版
- 处理 404 错误

### Story 4.3: 分类筛选功能

**Given** 用户在首页或文章列表  
**When** 点击分类（技术、生活、旅行）  
**Then** 导航到分类页面 (`/articles/category/[slug]`)  
**And** 显示该分类下的所有已发布文章  
**And** URL 反映筛选状态  
**And** 显示该分类的文章数量  
**When** 点击"全部"或移除筛选  
**Then** 显示所有文章

**技术实现：**
- 创建 `app/articles/category/[slug]/page.tsx` Server Component
- 调用 `GET /api/articles/public?categorySlug=[slug]&page=1&limit=20`
- 在文章卡片中使分类可点击
- 实现分类导航组件
- 显示分类文章数量
- 实现"全部"选项

### Story 4.4: 标签筛选功能

**Given** 用户查看文章或文章列表  
**When** 点击标签  
**Then** 导航到标签页面 (`/articles/tag/[slug]`)  
**And** 显示该标签下的所有已发布文章  
**And** URL 反映筛选状态  
**And** 显示该标签的文章数量  
**When** 点击"全部"或移除筛选  
**Then** 显示所有文章

**技术实现：**
- 创建 `app/articles/tag/[slug]/page.tsx` Server Component
- 调用 `GET /api/articles/public?tagSlug=[slug]&page=1&limit=20`
- 在文章卡片和详情页中使标签可点击
- 实现标签导航组件
- 显示标签文章数量
- 实现"全部"选项

### Story 4.5: 分页功能

**Given** 文章数量超过一页  
**When** 查看文章列表  
**Then** 显示分页控件  
**And** 显示当前页码和总页数  
**When** 点击"下一页"  
**Then** 显示下一页文章  
**When** 点击"上一页"  
**Then** 显示上一页文章  
**When** 点击特定页码  
**Then** 显示该页文章  
**And** URL 反映当前页码

**技术实现：**
- 创建 `components/article/Pagination.tsx` Client Component
- 从 API 响应中获取分页元数据
- 实现页码导航（上一页、下一页、页码）
- 更新 URL 查询参数（`?page=2`）
- 处理边界情况（第一页、最后一页）
- 实现响应式分页控件（移动端简化显示）

---

## Traceability Mapping

### PRD Requirements

| PRD Requirement | Epic Story | Status |
|----------------|------------|--------|
| **FR-3.1 文章列表展示** | Story 4.1 | ✅ 待实现 |
| **FR-3.2 文章详情展示** | Story 4.2 | ✅ 待实现 |
| **FR-3.3 分类筛选** | Story 4.3 | ✅ 待实现 |
| **FR-3.4 标签筛选** | Story 4.4 | ✅ 待实现 |
| **FR-3.5 分页功能** | Story 4.5 | ✅ 待实现 |

### Architecture Alignment

| Architecture Component | Epic Story | Implementation |
|------------------------|------------|----------------|
| **Next.js App Router** | All Stories | Server Components + Client Components |
| **API Routes** | All Stories | 使用已实现的公开 API 端点 |
| **Prisma ORM** | All Stories | 通过 API 间接使用 |
| **Tailwind CSS** | All Stories | 响应式设计 |
| **Component Organization** | All Stories | `components/article/` 目录 |

### Epic Dependencies

| Dependency Epic | Required Stories | Epic 4 Stories |
|-----------------|------------------|----------------|
| **Epic 1** | 1.1, 1.2, 1.3 | All Stories |
| **Epic 2** | 2.1, 2.6 | All Stories (用于显示作者信息) |
| **Epic 3** | 3.1, 3.6, 3.7 | All Stories |

---

## Risks, Assumptions, Open Questions

### Risks

**低风险：**
- ✅ API 端点已实现，风险较低
- ✅ 数据模型已定义，风险较低
- ⚠️ 性能风险：大量文章时的分页性能（已通过索引优化）

**缓解措施：**
- 使用数据库索引优化查询性能
- 实现合理的分页大小（默认 20，最大 100）
- 使用 Next.js Server Components 减少客户端负担

### Assumptions

1. **API 端点可用性：** 假设 Epic 3 实现的公开 API 端点稳定可用
2. **数据完整性：** 假设文章数据（分类、标签）已正确关联
3. **响应式设计：** 假设 Tailwind CSS 配置支持所需响应式断点
4. **浏览器兼容性：** 假设现代浏览器支持 Next.js 和 React 特性

### Open Questions

1. **文章排序选项：** 是否需要支持其他排序方式（如按标题、按作者）？
   - **决定：** 本 Epic 只支持默认的发布日期排序，其他排序选项在后续实现

2. **分页大小：** 每页显示多少篇文章？
   - **决定：** 默认 20 篇，最大 100 篇，用户可通过 URL 参数调整

3. **空状态设计：** 无文章时的空状态如何设计？
   - **决定：** 显示友好的提示信息，引导用户浏览其他内容

4. **图片加载策略：** 文章列表中的图片是否需要懒加载？
   - **决定：** 使用 Next.js Image 组件，在 Epic 7 中实现完整优化

---

## Test Strategy Summary

### Unit Tests

**组件测试：**
- `ArticleCard` 组件：渲染文章信息
- `ArticleList` 组件：渲染文章列表
- `ArticleDetail` 组件：渲染文章详情
- `Pagination` 组件：分页逻辑和 UI

**工具函数测试：**
- 日期格式化函数
- URL 参数解析函数

### Integration Tests

**API 集成测试：**
- 测试公开 API 端点响应
- 测试分页参数处理
- 测试筛选参数处理
- 测试错误处理（404, 500）

**页面集成测试：**
- 测试首页文章列表加载
- 测试文章详情页加载
- 测试分类筛选功能
- 测试标签筛选功能
- 测试分页导航

### E2E Tests

**用户流程测试：**
- 用户访问首页，查看文章列表
- 用户点击文章，查看详情
- 用户点击分类，查看分类文章
- 用户点击标签，查看标签文章
- 用户使用分页导航

**响应式测试：**
- 测试移动端布局
- 测试平板布局
- 测试桌面布局

### Test Tools

- **Unit Tests:** Jest + React Testing Library
- **Integration Tests:** Jest + Next.js API testing
- **E2E Tests:** Playwright（已在项目中配置）

参考：[Source: docs/architecture.md#Testing-Strategy]

---

## Implementation Notes

### Story Sequencing

**推荐实现顺序：**

1. **Story 4.1** - 文章列表页面（首页）
   - 这是基础功能，其他功能依赖它
   - 实现分页组件（Story 4.5 的一部分）

2. **Story 4.2** - 文章详情页面
   - 依赖 Story 4.1 的导航功能
   - 实现文章内容渲染

3. **Story 4.5** - 分页功能（完善）
   - 在 Story 4.1 基础上完善分页功能
   - 实现完整的分页控件

4. **Story 4.3** - 分类筛选功能
   - 依赖 Story 4.1 和 Story 4.5
   - 实现分类页面和导航

5. **Story 4.4** - 标签筛选功能
   - 依赖 Story 4.1 和 Story 4.5
   - 实现标签页面和导航

### Code Organization

**组件结构：**
```
components/article/
├── ArticleCard.tsx          # 文章卡片组件
├── ArticleList.tsx          # 文章列表组件
├── ArticleDetail.tsx        # 文章详情组件
└── Pagination.tsx           # 分页组件
```

**页面结构：**
```
app/
├── page.tsx                 # 首页（文章列表）
└── articles/
    ├── [slug]/
    │   └── page.tsx         # 文章详情页
    ├── category/
    │   └── [slug]/
    │       └── page.tsx     # 分类页面
    └── tag/
        └── [slug]/
            └── page.tsx     # 标签页面
```

### Key Implementation Details

**Server Components vs Client Components:**
- 文章列表和详情使用 Server Components（SEO 友好，性能好）
- 分页控件使用 Client Component（需要交互）
- 筛选导航可以使用 Server Components（通过 Link 导航）

**数据获取：**
- 在 Server Components 中使用 `fetch` 调用 API
- 使用 `async/await` 处理异步数据
- 错误处理使用 try-catch

**样式实现：**
- 使用 Tailwind CSS 工具类
- 响应式断点：`sm:`, `md:`, `lg:`, `xl:`
- 移动端优先设计

**SEO 考虑：**
- 使用语义化 HTML 标签
- 文章详情页添加 meta 标签（在 Epic 7 中完善）
- 使用 Next.js 的 Metadata API

---

**文档状态：** Draft  
**最后更新：** 2025-11-14  
**下一步：** 开始 Story 4.1 的实现

