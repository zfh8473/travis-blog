# Epic Technical Specification: 内容创作和管理（Content Creation & Management）

Date: 2025-11-12
Author: Travis
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 实现 travis-blog 的内容创作和管理系统，为博客平台提供完整的文章创建、编辑、发布、删除、草稿管理以及分类和标签管理功能。根据 PRD 的功能需求 FR-2.1 到 FR-2.7 和 FR-5.1 到 FR-5.3，本 Epic 涵盖文章数据模型、Tiptap 编辑器集成、文章 CRUD 操作、分类和标签管理，以及媒体管理功能。

本 Epic 是博客系统的核心内容管理模块，为后续的内容展示（Epic 4）和读者互动（Epic 5）提供内容基础。所有功能将使用 Tiptap 作为富文本编辑器，通过 Prisma ORM 与 PostgreSQL 数据库交互，并使用存储抽象层处理媒体文件上传。

---

## Objectives and Scope

### In-Scope

- **文章数据模型和基础 API：** 设计 Article 数据模型，实现完整的 CRUD API 端点
- **Tiptap 编辑器集成：** 集成 Tiptap 富文本编辑器，支持 Markdown、图片上传、实时预览
- **文章创建功能：** 支持创建新文章，包括标题、内容、分类、标签、草稿/发布状态
- **文章编辑功能：** 支持编辑已存在的文章，更新内容和元数据
- **文章删除功能：** 支持删除文章，包括级联删除相关数据
- **文章分类管理：** 支持文章分类（技术、生活、旅行），分类筛选和显示
- **文章标签管理：** 支持多标签系统，标签筛选和显示
- **媒体管理功能：** 支持媒体库管理，查看、删除上传的媒体文件

### Out-of-Scope

- **文章版本历史：** 版本控制功能不在本 Epic 范围内，可在后续实现
- **文章搜索功能：** 全文搜索功能不在本 Epic 范围内，属于 Epic 4 或后续功能
- **文章导入/导出：** Markdown 导入/导出功能不在本 Epic 范围内
- **文章模板功能：** 文章模板功能不在本 Epic 范围内
- **批量操作：** 批量编辑、批量删除等功能不在本 Epic 范围内
- **文章统计：** 阅读量、点赞数等统计功能不在本 Epic 范围内（属于 Epic 5）

---

## System Architecture Alignment

本 Epic 与系统架构完全对齐，使用以下架构组件和模式：

**数据架构：**
- Article 模型已存在于 Prisma schema 中，包含所有必需字段
- Category 和 Tag 模型已定义，支持分类和标签管理
- ArticleTag 连接表支持多对多关系
- 使用 Prisma ORM 进行所有数据库操作

**API 架构：**
- 使用 Next.js API Routes 创建文章管理端点
- 统一错误响应格式：`{ success: false, error: { message: string, code: string } }`
- HTTP 状态码：200 (Success), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Internal Server Error)
- Server Actions 用于表单提交（可选）

**存储架构：**
- 图片上传使用存储抽象层（Epic 1 Story 1.5 已实现）
- 本地存储实现，未来可迁移到云存储
- 媒体文件存储在 `public/uploads/` 目录

**认证和授权架构：**
- 所有文章管理操作需要 ADMIN 角色（Epic 2 已实现）
- 使用 JWT 中间件保护 API 路由（Epic 2 Story 2.4）
- 使用权限检查函数验证用户角色（Epic 2 Story 2.5）

**编辑器架构：**
- Tiptap 作为富文本编辑器
- 支持 Markdown 输入和输出
- 图片上传集成到编辑器
- 实时预览功能（可选）

参考：[Source: docs/architecture.md#Data-Architecture], [Source: docs/architecture.md#API-Contracts], [Source: prisma/schema.prisma]

---

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **Article Service** | 文章 CRUD 操作 | 文章数据、用户 ID | 文章对象、错误响应 | `app/api/articles/route.ts` |
| **Article Detail Service** | 单个文章操作 | 文章 ID、更新数据 | 文章对象、错误响应 | `app/api/articles/[id]/route.ts` |
| **Tiptap Editor Component** | 富文本编辑 | 初始内容、配置 | 编辑器实例、HTML 内容 | `components/editor/TiptapEditor.tsx` |
| **Image Upload Service** | 图片上传处理 | 文件对象 | 文件路径/URL | `app/api/upload/route.ts` |
| **Category Service** | 分类管理 | 分类数据 | 分类对象 | `lib/utils/categories.ts` |
| **Tag Service** | 标签管理 | 标签数据 | 标签对象 | `app/api/tags/route.ts` |
| **Media Library Service** | 媒体文件管理 | 文件路径、操作类型 | 文件列表、操作结果 | `app/api/media/route.ts` |
| **Article Validation** | 文章数据验证 | 文章输入数据 | 验证结果、错误信息 | `lib/validations/article.ts` |
| **Slug Generation** | URL slug 生成 | 文章标题 | 唯一 slug | `lib/utils/slug.ts` |

### Data Models and Contracts

**Article Model (Prisma Schema):**

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

  author      User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category    Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  tags        ArticleTag[]
  comments    Comment[]

  @@index([publishedAt])
  @@index([slug])
  @@index([authorId])
  @@map("articles")
}
```

**Category Model (Prisma Schema):**

```prisma
model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  articles  Article[]

  @@map("categories")
}
```

**Tag Model (Prisma Schema):**

```prisma
model Tag {
  id        String      @id @default(cuid())
  name      String      @unique
  slug      String      @unique
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  articles  ArticleTag[]

  @@map("tags")
}
```

**ArticleTag Junction Table:**

```prisma
model ArticleTag {
  articleId String
  tagId     String
  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
  @@map("article_tags")
}
```

**ArticleStatus Enum:**

```prisma
enum ArticleStatus {
  DRAFT
  PUBLISHED
}
```

**Data Contracts:**

- **CreateArticleInput:**
  - `title: string` (required, max 200 chars)
  - `content: string` (required, HTML format from Tiptap)
  - `excerpt?: string` (optional, max 500 chars)
  - `categoryId?: string` (optional)
  - `tagIds?: string[]` (optional, array of tag IDs)
  - `status: ArticleStatus` (required, DRAFT or PUBLISHED)

- **UpdateArticleInput:**
  - Same as CreateArticleInput, all fields optional except those being updated

- **ArticleResponse:**
  - `id: string`
  - `title: string`
  - `content: string`
  - `excerpt?: string`
  - `slug: string`
  - `status: ArticleStatus`
  - `category?: Category`
  - `tags: Tag[]`
  - `author: User` (minimal: id, name, image)
  - `publishedAt?: DateTime`
  - `createdAt: DateTime`
  - `updatedAt: DateTime`

参考：[Source: prisma/schema.prisma#Article-model], [Source: prisma/schema.prisma#Category-model], [Source: prisma/schema.prisma#Tag-model]

### APIs and Interfaces

**Article CRUD API Endpoints:**

1. **POST /api/articles**
   - **Description:** 创建新文章
   - **Authentication:** Required (ADMIN role)
   - **Request Body:**
     ```typescript
     {
       title: string;
       content: string;
       excerpt?: string;
       categoryId?: string;
       tagIds?: string[];
       status: "DRAFT" | "PUBLISHED";
     }
     ```
   - **Response (201):**
     ```typescript
     {
       success: true;
       data: ArticleResponse;
     }
     ```
   - **Error Responses:**
     - 400: Validation error
     - 401: Unauthorized
     - 403: Forbidden (not ADMIN)
     - 500: Internal server error

2. **GET /api/articles**
   - **Description:** 获取文章列表（管理员视图，包含草稿）
   - **Authentication:** Required (ADMIN role)
   - **Query Parameters:**
     - `status?: "DRAFT" | "PUBLISHED"` - 按状态筛选
     - `categoryId?: string` - 按分类筛选
     - `tagId?: string` - 按标签筛选
     - `page?: number` - 页码（默认 1）
     - `limit?: number` - 每页数量（默认 20）
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

3. **GET /api/articles/[id]**
   - **Description:** 获取单个文章详情
   - **Authentication:** Required (ADMIN role for draft articles, public for published)
   - **Response (200):**
     ```typescript
     {
       success: true;
       data: ArticleResponse;
     }
     ```
   - **Error Responses:**
     - 404: Article not found
     - 401: Unauthorized
     - 403: Forbidden

4. **PUT /api/articles/[id]**
   - **Description:** 更新文章
   - **Authentication:** Required (ADMIN role)
   - **Request Body:** Same as POST /api/articles (all fields optional)
   - **Response (200):**
     ```typescript
     {
       success: true;
       data: ArticleResponse;
     }
     ```
   - **Error Responses:**
     - 400: Validation error
     - 401: Unauthorized
     - 403: Forbidden
     - 404: Article not found
     - 500: Internal server error

5. **DELETE /api/articles/[id]**
   - **Description:** 删除文章
   - **Authentication:** Required (ADMIN role)
   - **Response (200):**
     ```typescript
     {
       success: true;
       message: "Article deleted successfully";
     }
     ```
   - **Error Responses:**
     - 401: Unauthorized
     - 403: Forbidden
     - 404: Article not found
     - 500: Internal server error

**Image Upload API Endpoint:**

6. **POST /api/upload**
   - **Description:** 上传图片文件（用于 Tiptap 编辑器）
   - **Authentication:** Required (ADMIN role)
   - **Request:** multipart/form-data
     - `file: File` - 图片文件
   - **Response (200):**
     ```typescript
     {
       success: true;
       data: {
         url: string;  // 图片 URL 路径
         path: string; // 存储路径
       };
     }
     ```
   - **Error Responses:**
     - 400: Invalid file type or size
     - 401: Unauthorized
     - 403: Forbidden
     - 413: File too large
     - 500: Upload failed

**Tag Management API Endpoints:**

7. **GET /api/tags**
   - **Description:** 获取所有标签列表
   - **Authentication:** Optional (public for published articles, ADMIN for all)
   - **Response (200):**
     ```typescript
     {
       success: true;
       data: Tag[];
     }
     ```

8. **POST /api/tags**
   - **Description:** 创建新标签（如果不存在）
   - **Authentication:** Required (ADMIN role)
   - **Request Body:**
     ```typescript
     {
       name: string;
     }
     ```
   - **Response (201):**
     ```typescript
     {
       success: true;
       data: Tag;
     }
     ```

**Media Library API Endpoints:**

9. **GET /api/media**
   - **Description:** 获取媒体文件列表
   - **Authentication:** Required (ADMIN role)
   - **Query Parameters:**
     - `page?: number` - 页码
     - `limit?: number` - 每页数量
   - **Response (200):**
     ```typescript
     {
       success: true;
       data: {
         files: MediaFile[];
         pagination: PaginationInfo;
       };
     }
     ```

10. **DELETE /api/media/[path]**
    - **Description:** 删除媒体文件
    - **Authentication:** Required (ADMIN role)
    - **Response (200):**
      ```typescript
      {
        success: true;
        message: "File deleted successfully";
      }
      ```
    - **Error Responses:**
      - 400: File is in use
      - 401: Unauthorized
      - 403: Forbidden
      - 404: File not found

参考：[Source: docs/architecture.md#API-Contracts], [Source: docs/architecture.md#Project-Structure]

### Workflows and Sequencing

**Article Creation Workflow:**

1. User navigates to `/admin/articles/new`
2. User fills in article form (title, content via Tiptap editor)
3. User selects category (optional)
4. User adds tags (optional, can create new tags on the fly)
5. User chooses status (DRAFT or PUBLISHED)
6. User clicks "Save" button
7. Client validates form data
8. Client sends POST request to `/api/articles`
9. Server validates authentication (ADMIN role required)
10. Server validates article data (Zod schema)
11. Server generates unique slug from title
12. Server creates Article record in database
13. Server creates ArticleTag records for selected tags
14. Server returns created article
15. Client redirects to article list or detail page

**Image Upload Workflow (in Tiptap Editor):**

1. User drags image into editor OR pastes image from clipboard
2. Tiptap editor intercepts image insertion
3. Editor calls image upload handler
4. Handler creates FormData with image file
5. Handler sends POST request to `/api/upload`
6. Server validates authentication (ADMIN role required)
7. Server validates file (type, size)
8. Server uses storage abstraction layer to upload file
9. Server returns image URL
10. Editor inserts image URL into content
11. Image displays in editor

**Article Editing Workflow:**

1. User navigates to `/admin/articles/[id]/edit`
2. Server loads article data from database
3. Server checks user has permission (ADMIN role)
4. Server returns article data
5. Client pre-fills form with article data
6. Tiptap editor loads article content
7. User makes changes
8. User clicks "Save" button
9. Client sends PUT request to `/api/articles/[id]`
10. Server validates and updates article
11. Server updates `updatedAt` timestamp
12. Server returns updated article
13. Client shows success message

**Article Deletion Workflow:**

1. User clicks delete button on article
2. Client shows confirmation dialog
3. User confirms deletion
4. Client sends DELETE request to `/api/articles/[id]`
5. Server validates authentication (ADMIN role required)
6. Server checks if article exists
7. Server deletes ArticleTag records (cascade)
8. Server deletes Article record
9. Server returns success response
10. Client removes article from UI

参考：[Source: docs/epics/epic-3-内容创作和管理content-creation-management.md]

---

## Non-Functional Requirements

### Performance

**NFR-3.1 文章列表加载性能**
- **要求：** 文章列表页面加载时间 < 2 秒
- **指标：**
  - API 响应时间 < 500ms
  - 数据库查询优化（使用索引）
  - 分页大小：默认 20 条，最大 50 条
- **实现方式：**
  - 数据库索引：`publishedAt`, `slug`, `authorId`
  - 分页查询优化
  - 服务端渲染（SSR）缓存

**NFR-3.2 图片上传性能**
- **要求：** 图片上传响应时间 < 3 秒（5MB 以内）
- **指标：**
  - 文件大小限制：5MB
  - 支持格式：jpg, jpeg, png, gif, webp
  - 异步上传处理
- **实现方式：**
  - 客户端文件验证（大小、类型）
  - 服务器端验证和存储
  - 进度指示器

**NFR-3.3 Tiptap 编辑器性能**
- **要求：** 编辑器初始化时间 < 1 秒
- **指标：**
  - 编辑器加载时间
  - 内容渲染时间
  - 实时预览响应时间
- **实现方式：**
  - 代码分割和懒加载
  - 编辑器扩展按需加载
  - 内容虚拟化（长文章）

参考：[Source: docs/PRD.md#NFR-1.1], [Source: docs/architecture.md#Performance-Considerations]

### Security

**NFR-3.4 文章操作授权**
- **要求：** 所有文章管理操作需要 ADMIN 角色
- **标准：**
  - 使用 JWT 中间件验证认证
  - 使用权限检查函数验证角色
  - API 路由保护
- **实现方式：**
  - `requireAuth` 函数检查认证
  - `requireAdmin` 函数检查角色
  - 中间件保护 `/api/articles/*` 路由

**NFR-3.5 输入验证和清理**
- **要求：** 所有用户输入必须验证和清理
- **标准：**
  - 使用 Zod 进行服务器端验证
  - HTML 内容清理（防止 XSS）
  - 文件上传验证（类型、大小）
- **实现方式：**
  - Zod schemas 验证文章数据
  - Tiptap 自动清理 HTML
  - 文件类型和大小验证

**NFR-3.6 文件上传安全**
- **要求：** 安全的文件上传处理
- **标准：**
  - 文件类型白名单
  - 文件大小限制
  - 文件名唯一化（防止覆盖）
  - 存储路径验证
- **实现方式：**
  - 文件类型验证（MIME type）
  - 文件大小限制（5MB）
  - 唯一文件名生成（UUID + 时间戳）
  - 存储路径规范化

参考：[Source: docs/PRD.md#NFR-2.1], [Source: docs/architecture.md#Security-Architecture]

### Reliability/Availability

**NFR-3.7 数据一致性**
- **要求：** 文章操作保证数据一致性
- **标准：**
  - 事务处理（创建文章和标签关联）
  - 级联删除（删除文章时删除相关数据）
  - 外键约束
- **实现方式：**
  - Prisma 事务处理
  - 数据库外键约束
  - 级联删除配置

**NFR-3.8 错误恢复**
- **要求：** 优雅的错误处理和恢复
- **标准：**
  - 统一的错误响应格式
  - 用户友好的错误消息
  - 错误日志记录
- **实现方式：**
  - 统一错误响应格式
  - Try-catch 错误处理
  - 结构化错误日志

参考：[Source: docs/architecture.md#Error-Handling]

### Observability

**NFR-3.9 日志记录**
- **要求：** 记录关键操作日志
- **标准：**
  - 文章创建、更新、删除操作
  - 文件上传操作
  - 错误和异常
- **实现方式：**
  - Console logging (dev)
  - Structured logging (prod)
  - 日志包含：操作类型、用户 ID、时间戳、结果

**NFR-3.10 监控指标**
- **要求：** 关键操作监控
- **标准：**
  - API 响应时间
  - 错误率
  - 文件上传成功率
- **实现方式：**
  - Vercel Analytics (if available)
  - 自定义指标收集
  - 错误追踪

参考：[Source: docs/architecture.md#Logging-Strategy]

---

## Dependencies and Integrations

### External Dependencies

**Required Packages:**

- **@tiptap/react** (latest) - Tiptap React 集成
- **@tiptap/starter-kit** (latest) - Tiptap 基础扩展包
- **@tiptap/extension-image** (latest) - 图片扩展
- **@tiptap/extension-link** (latest) - 链接扩展
- **@tiptap/extension-markdown** (latest) - Markdown 支持（可选）
- **zod** (^4.1.12) - 数据验证（已安装）
- **next-auth** (^4.24.13) - 认证（已安装，Epic 2）
- **@prisma/client** (^6.19.0) - Prisma ORM（已安装）

**Development Dependencies:**

- **@types/node** (^20) - Node.js 类型定义（已安装）
- **typescript** (^5) - TypeScript（已安装）

### Internal Dependencies

**Epic 2 Dependencies (Required):**
- ✅ User authentication (Story 2.1, 2.2, 2.3)
- ✅ JWT middleware (Story 2.4)
- ✅ Role and permission system (Story 2.5)
- ✅ User profile management (Story 2.6)

**Epic 1 Dependencies (Required):**
- ✅ Storage abstraction layer (Story 1.5)
- ✅ Database setup (Story 1.2, 1.3)
- ✅ Project structure (Story 1.1)

**Database Schema:**
- ✅ Article model (已定义)
- ✅ Category model (已定义)
- ✅ Tag model (已定义)
- ✅ ArticleTag junction table (已定义)

参考：[Source: package.json], [Source: prisma/schema.prisma]

---

## Acceptance Criteria (Authoritative)

基于 PRD 和 Epic 定义，以下是 Epic 3 的权威接受标准：

### Story 3.1: 文章数据模型和基础 API

1. **AC-3.1.1:** Given the database is set up, When I create an article through the API, Then the article is saved to the database with all required fields
2. **AC-3.1.2:** When I retrieve an article by ID, Then the article data is returned correctly with all fields
3. **AC-3.1.3:** When I update an article, Then the article is updated in the database and updatedAt timestamp is refreshed
4. **AC-3.1.4:** When I delete an article, Then the article is removed from the database and related data (tags, comments) are handled appropriately

### Story 3.2: Tiptap 编辑器集成

5. **AC-3.2.1:** Given I am logged in as an admin, When I navigate to the article creation page, Then I see the Tiptap editor
6. **AC-3.2.2:** I can type and format text (bold, italic, headings, lists, etc.)
7. **AC-3.2.3:** The editor supports Markdown input and output
8. **AC-3.2.4:** I can upload images by dragging and dropping or pasting
9. **AC-3.2.5:** When I upload an image, Then the image is uploaded to the storage layer and the image URL is inserted into the editor
10. **AC-3.2.6:** When I save the article, Then the formatted content (including images) is saved to the database

### Story 3.3: 文章创建功能

11. **AC-3.3.1:** Given I am logged in as an admin, When I navigate to the article creation page, And I enter article title and content, And I select a category and add tags, And I click "Save as Draft", Then the article is saved as a draft and is not visible on the frontend
12. **AC-3.3.2:** When I click "Publish", Then the article status changes to "published", the article becomes visible on the frontend, and the published_at timestamp is set

### Story 3.4: 文章编辑功能

13. **AC-3.4.1:** Given I am logged in as an admin, And an article exists, When I navigate to the article edit page, Then I see the article content pre-filled in the editor
14. **AC-3.4.2:** When I make changes to the article, And I save the changes, Then the article is updated in the database, the updated_at timestamp is refreshed, and I see a success message

### Story 3.5: 文章删除功能

15. **AC-3.5.1:** Given I am logged in as an admin, And an article exists, When I click the delete button, Then I see a confirmation dialog
16. **AC-3.5.2:** When I confirm the deletion, Then the article is removed from the database, the article is no longer visible anywhere, and I see a success message

### Story 3.6: 文章分类管理

17. **AC-3.6.1:** Given I am logged in as an admin, When I create or edit an article, Then I can select a category (技术、生活、旅行), and the category is saved with the article
18. **AC-3.6.2:** When I view an article on the frontend, Then the category is displayed
19. **AC-3.6.3:** When I click on a category, Then I see all articles in that category

### Story 3.7: 文章标签管理

20. **AC-3.7.1:** Given I am logged in as an admin, When I create or edit an article, Then I can add multiple tags, and tags are saved with the article
21. **AC-3.7.2:** When I view an article on the frontend, Then all tags are displayed
22. **AC-3.7.3:** When I click on a tag, Then I see all articles with that tag

### Story 3.8: 媒体管理功能

23. **AC-3.8.1:** Given I am logged in as an admin, When I navigate to the media library page, Then I see a list of all uploaded media files with thumbnail (for images), filename, upload date, and file size
24. **AC-3.8.2:** I can preview images by clicking on them
25. **AC-3.8.3:** When I click delete on a media file, Then I see a confirmation dialog
26. **AC-3.8.4:** When I confirm the deletion, Then the file is removed from storage, the file is removed from the media library, and I see a success message
27. **AC-3.8.5:** When I try to delete a file that is used in an article, Then I see a warning message indicating the file is in use, and I can choose to delete anyway or cancel

参考：[Source: docs/epics/epic-3-内容创作和管理content-creation-management.md], [Source: docs/PRD.md#FR-2.1]

---

## Traceability Mapping

| AC# | PRD Requirement | Spec Section | Component/API | Test Idea |
|-----|----------------|--------------|---------------|-----------|
| AC-3.1.1 | FR-2.1 | Data Models | POST /api/articles | Test article creation with all required fields |
| AC-3.1.2 | FR-2.1 | APIs | GET /api/articles/[id] | Test article retrieval by ID |
| AC-3.1.3 | FR-2.2 | APIs | PUT /api/articles/[id] | Test article update and timestamp refresh |
| AC-3.1.4 | FR-2.4 | APIs | DELETE /api/articles/[id] | Test article deletion and cascade |
| AC-3.2.1 | FR-5.1 | Tiptap Editor | TiptapEditor.tsx | Test editor rendering |
| AC-3.2.2 | FR-5.1 | Tiptap Editor | TiptapEditor.tsx | Test text formatting features |
| AC-3.2.3 | FR-5.1 | Tiptap Editor | TiptapEditor.tsx | Test Markdown support |
| AC-3.2.4 | FR-5.2 | Image Upload | POST /api/upload | Test drag-and-drop and paste |
| AC-3.2.5 | FR-5.2 | Image Upload | POST /api/upload | Test image upload and URL insertion |
| AC-3.2.6 | FR-2.1 | Article Service | POST /api/articles | Test content saving with images |
| AC-3.3.1 | FR-2.5 | Article Creation | POST /api/articles | Test draft creation |
| AC-3.3.2 | FR-2.3 | Article Creation | POST /api/articles | Test publish status change |
| AC-3.4.1 | FR-2.2 | Article Edit | GET /api/articles/[id] | Test article loading for edit |
| AC-3.4.2 | FR-2.2 | Article Edit | PUT /api/articles/[id] | Test article update |
| AC-3.5.1 | FR-2.4 | Article Delete | DELETE /api/articles/[id] | Test delete confirmation |
| AC-3.5.2 | FR-2.4 | Article Delete | DELETE /api/articles/[id] | Test article removal |
| AC-3.6.1 | FR-2.6 | Category Service | POST /api/articles | Test category selection |
| AC-3.6.2 | FR-2.6 | Category Display | Article Detail Page | Test category display |
| AC-3.6.3 | FR-2.6 | Category Filter | Category Page | Test category filtering |
| AC-3.7.1 | FR-2.7 | Tag Service | POST /api/articles | Test tag addition |
| AC-3.7.2 | FR-2.7 | Tag Display | Article Detail Page | Test tag display |
| AC-3.7.3 | FR-2.7 | Tag Filter | Tag Page | Test tag filtering |
| AC-3.8.1 | FR-5.3 | Media Library | GET /api/media | Test media list display |
| AC-3.8.2 | FR-5.3 | Media Library | Media Preview | Test image preview |
| AC-3.8.3 | FR-5.3 | Media Library | DELETE /api/media/[path] | Test delete confirmation |
| AC-3.8.4 | FR-5.3 | Media Library | DELETE /api/media/[path] | Test file deletion |
| AC-3.8.5 | FR-5.3 | Media Library | DELETE /api/media/[path] | Test in-use file warning |

---

## Risks, Assumptions, Open Questions

### Risks

**R-3.1: Tiptap 编辑器学习曲线**
- **风险:** Tiptap 编辑器配置和扩展可能较复杂
- **影响:** 可能延长 Story 3.2 的开发时间
- **缓解措施:** 
  - 提前研究 Tiptap 文档和示例
  - 创建简单的原型验证可行性
  - 参考 Tiptap 官方示例代码

**R-3.2: 图片上传性能**
- **风险:** 大图片上传可能影响编辑器响应
- **影响:** 用户体验下降
- **缓解措施:**
  - 客户端文件大小验证
  - 显示上传进度
  - 异步上传处理
  - 考虑图片压缩（未来优化）

**R-3.3: Slug 唯一性冲突**
- **风险:** 相同标题可能生成重复的 slug
- **影响:** 数据库唯一性约束错误
- **缓解措施:**
  - Slug 生成算法包含时间戳或随机字符串
  - 检查 slug 唯一性，如果冲突则追加序号
  - 数据库唯一性约束

**R-3.4: 级联删除数据丢失**
- **风险:** 删除文章时可能意外删除相关数据
- **影响:** 数据丢失
- **缓解措施:**
  - 明确的级联删除配置
  - 删除前确认对话框
  - 考虑软删除（未来优化）

### Assumptions

**A-3.1: 分类数量有限**
- **假设:** 分类数量较少（技术、生活、旅行），不需要复杂的分类管理
- **验证:** 当前 Epic 定义支持此假设
- **如果假设错误:** 需要实现分类管理功能（创建、编辑、删除分类）

**A-3.2: 标签可以动态创建**
- **假设:** 在创建文章时可以动态创建新标签
- **验证:** Story 3.7 支持此功能
- **如果假设错误:** 需要预先创建标签

**A-3.3: 存储抽象层已就绪**
- **假设:** Epic 1 Story 1.5 的存储抽象层可以处理图片上传
- **验证:** 存储抽象层已实现并测试
- **如果假设错误:** 需要修复或扩展存储抽象层

**A-3.4: 文章内容使用 HTML 格式**
- **假设:** Tiptap 编辑器输出 HTML 格式，直接存储到数据库
- **验证:** Tiptap 默认输出 HTML
- **如果假设错误:** 需要转换格式（Markdown 或其他）

### Open Questions

**Q-3.1: 文章摘要（excerpt）生成方式**
- **问题:** 摘要是手动输入还是自动从内容生成？
- **当前决定:** 支持手动输入（excerpt 字段可选）
- **未来考虑:** 可以添加自动生成功能（从内容前 N 个字符）

**Q-3.2: 文章版本历史**
- **问题:** 是否需要保存文章编辑历史？
- **当前决定:** 不在本 Epic 范围内
- **未来考虑:** 可以作为后续功能实现

**Q-3.3: 图片优化**
- **问题:** 上传的图片是否需要自动优化（压缩、格式转换）？
- **当前决定:** 不在本 Epic 范围内，存储原始图片
- **未来考虑:** 可以作为性能优化功能实现

**Q-3.4: 文章搜索功能**
- **问题:** 是否需要全文搜索功能？
- **当前决定:** 不在本 Epic 范围内
- **未来考虑:** 可以作为 Epic 4 或独立功能实现

---

## Test Strategy Summary

### Test Levels

**Unit Tests:**
- 文章验证 schemas (Zod)
- Slug 生成函数
- 文章数据转换函数
- 权限检查函数

**Integration Tests:**
- Article CRUD API 端点
- Image upload API 端点
- Tag management API 端点
- Media library API 端点
- 数据库操作（Prisma）

**E2E Tests:**
- 文章创建流程
- 文章编辑流程
- 文章删除流程
- Tiptap 编辑器交互
- 图片上传流程
- 媒体库管理流程

### Test Coverage Goals

- **单元测试覆盖率:** ≥ 80%
- **集成测试覆盖率:** 所有 API 端点
- **E2E 测试覆盖率:** 所有关键用户流程

### Test Frameworks

- **单元测试:** Jest + @testing-library/react
- **集成测试:** Jest + Next.js API route testing
- **E2E 测试:** Playwright

### Test Data Management

- 使用测试数据库或 mock
- 每个测试后清理测试数据
- 使用工厂函数创建测试数据

### Edge Cases to Test

- 空标题或内容
- 超长标题或内容
- 无效的分类或标签 ID
- 重复的 slug
- 删除不存在的文章
- 上传无效文件类型
- 上传超大文件
- 删除正在使用的媒体文件
- 未授权访问（非 ADMIN 用户）

参考：[Source: docs/architecture.md#Testing-Strategy], [Source: tests/README.md]

---

**Tech Spec Status:** Draft  
**Next Steps:** Review and validate with team, then proceed with story implementation

