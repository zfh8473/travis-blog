# Epic 3: 内容创作和管理（Content Creation & Management）

实现文章的创建、编辑、发布、删除、草稿管理以及分类和标签管理功能。

## Story 3.1: 文章数据模型和基础 API

As a **developer**,  
I want **to create the article data model and basic CRUD APIs**,  
So that **articles can be stored and retrieved from the database**.

**Acceptance Criteria:**

**Given** the database is set up  
**When** I create an article through the API  
**Then** the article is saved to the database  
**And** all required fields are stored (title, content, author, status, etc.)  
**When** I retrieve an article by ID  
**Then** the article data is returned correctly  
**When** I update an article  
**Then** the article is updated in the database  
**When** I delete an article  
**Then** the article is removed from the database

**Prerequisites:** Epic 2 (all stories)

**Technical Notes:**
- Design article data model (title, content, author_id, status, published_at, created_at, updated_at)
- Create article API endpoints (POST, GET, PUT, DELETE)
- Implement input validation
- Add database indexes for performance
- Test all CRUD operations
- Handle errors appropriately

---

## Story 3.2: Tiptap 编辑器集成

As a **blog author**,  
I want **to use Tiptap editor to create and edit articles**,  
So that **I can write rich text content with formatting options**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**When** I navigate to the article creation page  
**Then** I see the Tiptap editor  
**And** I can type and format text (bold, italic, headings, lists, etc.)  
**And** I can see a real-time preview  
**And** the editor supports Markdown input  
**And** I can upload images by dragging and dropping or pasting  
**When** I upload an image  
**Then** the image is uploaded to the storage layer  
**And** the image URL is inserted into the editor  
**And** the image is displayed in the editor  
**When** I save the article  
**Then** the formatted content (including images) is saved to the database

**Prerequisites:** Story 3.1, Story 1.5 (存储抽象层)

**Technical Notes:**
- Install and configure Tiptap
- Set up Tiptap extensions (bold, italic, headings, lists, links, etc.)
- Create article editor component
- Implement Markdown support
- Add real-time preview (optional)
- **图片上传功能实现：**
  - Install `@tiptap/extension-image` extension
  - Configure image upload handler in Tiptap editor
  - Create image upload API endpoint: `POST /api/upload`
  - Use storage abstraction layer (`lib/storage/`) for file storage
  - Implement drag-and-drop image upload
  - Implement paste image upload (clipboard)
  - Validate image format (jpg, png, gif, webp) and size (max 5MB)
  - Generate unique filename for uploaded images
  - Return image URL to editor for insertion
  - Store image path in article content (HTML)
- Save editor content to database
- Handle editor state management

---

## Story 3.3: 文章创建功能

As a **blog author**,  
I want **to create a new article**,  
So that **I can publish content on my blog**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**When** I navigate to the article creation page  
**And** I enter article title and content  
**And** I select a category and add tags  
**And** I click "Save as Draft"  
**Then** the article is saved as a draft  
**And** the article is not visible on the frontend  
**When** I click "Publish"  
**Then** the article status changes to "published"  
**And** the article becomes visible on the frontend  
**And** the published_at timestamp is set

**Prerequisites:** Story 3.2

**Technical Notes:**
- Create article creation page/component
- Implement article form with validation
- Add category and tag selection
- Implement draft/publish status toggle
- Save article to database
- Redirect to article list or article detail after creation
- Show success/error messages

---

## Story 3.4: 文章编辑功能

As a **blog author**,  
I want **to edit existing articles**,  
So that **I can update and improve my content**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**And** an article exists  
**When** I navigate to the article edit page  
**Then** I see the article content pre-filled in the editor  
**When** I make changes to the article  
**And** I save the changes  
**Then** the article is updated in the database  
**And** the updated_at timestamp is refreshed  
**And** I see a success message

**Prerequisites:** Story 3.3

**Technical Notes:**
- Create article edit page/component
- Load existing article data
- Pre-fill editor with article content
- Implement update API endpoint
- Handle article not found errors
- Validate user has permission to edit (admin only)
- Show success/error messages

---

## Story 3.5: 文章删除功能

As a **blog author**,  
I want **to delete articles**,  
So that **I can remove unwanted content**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**And** an article exists  
**When** I click the delete button  
**Then** I see a confirmation dialog  
**When** I confirm the deletion  
**Then** the article is removed from the database  
**And** the article is no longer visible anywhere  
**And** I see a success message

**Prerequisites:** Story 3.4

**Technical Notes:**
- Add delete button to article list/detail page
- Implement delete confirmation dialog
- Create delete API endpoint
- Handle cascading deletes (comments, tags, etc.)
- Validate user has permission to delete (admin only)
- Show success/error messages
- Handle article not found errors

---

## Story 3.6: 文章分类管理

As a **blog author**,  
I want **to assign categories to articles**,  
So that **articles can be organized and filtered by category**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**When** I create or edit an article  
**Then** I can select a category (技术、生活、旅行)  
**And** the category is saved with the article  
**When** I view an article on the frontend  
**Then** the category is displayed  
**When** I click on a category  
**Then** I see all articles in that category

**Prerequisites:** Story 3.3

**Technical Notes:**
- Create categories table or use enum
- Add category field to articles table
- Create category selection UI component
- Display category on article detail page
- Implement category filtering on frontend
- Add category to article API

---

## Story 3.7: 文章标签管理

As a **blog author**,  
I want **to add tags to articles**,  
So that **articles can be organized and discovered by tags**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**When** I create or edit an article  
**Then** I can add multiple tags  
**And** tags are saved with the article  
**When** I view an article on the frontend  
**Then** all tags are displayed  
**When** I click on a tag  
**Then** I see all articles with that tag

**Prerequisites:** Story 3.6

**Technical Notes:**
- Create tags table
- Create article_tags junction table (many-to-many relationship)
- Implement tag input component (with autocomplete/suggestions)
- Save tags when creating/editing article
- Display tags on article detail page
- Implement tag filtering on frontend
- Add tag management (create new tags on the fly)

---

## Story 3.8: 媒体管理功能

As a **blog author**,  
I want **to manage uploaded media files**,  
So that **I can view and delete media files I've uploaded**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**When** I navigate to the media library page  
**Then** I see a list of all uploaded media files  
**And** each file shows thumbnail (for images), filename, upload date, and file size  
**And** I can preview images by clicking on them  
**When** I click delete on a media file  
**Then** I see a confirmation dialog  
**When** I confirm the deletion  
**Then** the file is removed from storage  
**And** the file is removed from the media library  
**And** I see a success message  
**When** I try to delete a file that is used in an article  
**Then** I see a warning message indicating the file is in use  
**And** I can choose to delete anyway or cancel

**Prerequisites:** Story 3.2, Story 1.5 (存储抽象层)

**Technical Notes:**
- Create media library page: `/admin/media`
- Use storage abstraction layer to list all media files
- Display media files in a grid or list layout
- Show file metadata (name, size, upload date)
- Implement image preview (modal or lightbox)
- Create delete media API endpoint: `DELETE /api/media/[id]`
- Check if media file is referenced in any article before deletion
- Implement file usage check (search article content for image URLs)
- Show warning if file is in use, allow force delete
- Use storage abstraction layer for file deletion
- Add pagination if media files are numerous
- Add search/filter functionality (optional)
- Support different file types (images, documents, etc.)

---

## Epic 3 总结

**完成日期：** 2025-11-14  
**状态：** 7/8 故事已完成（87.5%）

### 完成的故事

1. **Story 3.1: 文章数据模型和基础 API** ✅
   - 实现了完整的文章数据模型（Prisma Schema）
   - 创建了文章 CRUD API 端点（POST, GET, PUT, DELETE）
   - 实现了输入验证和错误处理
   - 添加了数据库索引优化性能

2. **Story 3.2: Tiptap 编辑器集成** ✅
   - 集成了 Tiptap 富文本编辑器
   - 实现了图片上传功能（拖拽、粘贴）
   - 支持 Markdown 输入
   - 实现了存储抽象层集成

3. **Story 3.3: 文章创建功能** ✅
   - 创建了文章创建页面（`/admin/articles/new`）
   - 实现了草稿/发布状态管理
   - 集成了分类和标签选择
   - 实现了表单验证和错误处理

4. **Story 3.4: 文章编辑功能** ✅
   - 创建了文章编辑页面（`/admin/articles/[id]/edit`）
   - 实现了文章数据预填充
   - 支持更新文章内容、分类和标签
   - 实现了权限验证（仅管理员）

5. **Story 3.5: 文章删除功能** ✅
   - 实现了文章删除 API 端点
   - 添加了删除确认对话框
   - 处理了级联删除（评论、标签关联）
   - 实现了乐观 UI 更新

6. **Story 3.6: 文章分类管理** ✅
   - 创建了分类数据模型和 API
   - 实现了分类选择 UI 组件
   - 创建了前端分类筛选页面（`/articles/category/[slug]`）
   - 实现了分类导航链接
   - 创建了公开 API 端点（`/api/articles/public`）

7. **Story 3.7: 文章标签管理** ✅
   - 创建了标签数据模型和 API（`POST /api/tags`）
   - 实现了高级标签输入组件（自动完成、创建新标签、可移除 badges）
   - 创建了标签筛选页面（`/articles/tag/[slug]`）
   - 实现了分页功能（每页 10/20/50 可选）
   - 创建了优化的标签查询端点（`GET /api/tags/[slug]`）
   - 实现了标签导航链接

### 待完成的故事

8. **Story 3.8: 媒体管理功能** ⬜
   - 状态：Backlog
   - 计划：创建媒体库页面，实现媒体文件列表、预览和删除功能

### 主要技术成就

**数据模型：**
- ✅ 完整的文章数据模型（Article, Category, Tag, ArticleTag）
- ✅ 多对多关系（文章-标签）
- ✅ 级联删除配置
- ✅ Slug 索引优化

**API 端点：**
- ✅ 管理员 API：`POST /api/articles`, `GET /api/articles`, `PUT /api/articles/[id]`, `DELETE /api/articles/[id]`
- ✅ 公开 API：`GET /api/articles/public`, `GET /api/articles/public/[slug]`
- ✅ 分类 API：`GET /api/categories`, `GET /api/categories/[slug]`
- ✅ 标签 API：`GET /api/tags`, `POST /api/tags`, `GET /api/tags/[slug]`
- ✅ 上传 API：`POST /api/upload`

**前端页面：**
- ✅ 管理员页面：`/admin/articles`, `/admin/articles/new`, `/admin/articles/[id]/edit`
- ✅ 公开页面：`/articles`, `/articles/[slug]`, `/articles/category/[slug]`, `/articles/tag/[slug]`

**用户体验：**
- ✅ 富文本编辑器（Tiptap）集成
- ✅ 图片上传（拖拽、粘贴）
- ✅ 分类和标签选择组件
- ✅ 高级标签输入（自动完成、创建新标签）
- ✅ 分页导航（页码、省略号、上一页/下一页）
- ✅ 每页数量选择器（10/20/50）

**代码质量：**
- ✅ 完整的 JSDoc 注释
- ✅ TypeScript 类型安全
- ✅ 统一的错误处理格式
- ✅ 完善的测试覆盖（单元测试 + 集成测试）
- ✅ React Hooks 最佳实践（useCallback, useEffect 优化）

### 测试覆盖

- **单元测试：** 所有主要组件和功能都有单元测试
- **集成测试：** API 端点都有集成测试
- **测试通过率：** 100%（所有已实现功能的测试都通过）

### 架构对齐

- ✅ 遵循 Next.js App Router 架构
- ✅ 使用 Prisma ORM 进行数据库操作
- ✅ 遵循 RESTful API 设计模式
- ✅ 实现了存储抽象层
- ✅ 遵循统一错误响应格式
- ✅ 实现了权限控制（管理员 vs 公开）

### 下一步计划

1. **Story 3.8: 媒体管理功能** - 实现媒体库页面和媒体文件管理
2. **Epic 4: 内容展示** - 开始实现前台内容展示功能（部分功能已在 Epic 3 中实现）

### 关键指标

- **故事完成率：** 7/8 (87.5%)
- **接受标准覆盖率：** 100%（所有已实现故事的 AC 都满足）
- **代码审查状态：** 所有已完成故事都通过了代码审查
- **测试通过率：** 100%

---
