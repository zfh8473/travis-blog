# travis-blog - Epic Breakdown

**Author:** Travis  
**Date:** 2025-11-12  
**Project Level:** 1  
**Target Scale:** Personal Blog

---

## Overview

This document provides the complete epic and story breakdown for travis-blog, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

**Epic 结构：**
1. **项目基础架构（Foundation）** - 建立项目基础，为所有后续功能提供支撑
2. **用户认证和授权（User Authentication & Authorization）** - 实现用户注册、登录和权限管理
3. **内容创作和管理（Content Creation & Management）** - 实现文章的创建、编辑、发布和管理
4. **内容展示（Content Display）** - 实现前台文章列表和详情展示
5. **读者互动（Reader Interaction）** - 实现留言和回复功能
6. **后台管理界面（Admin Dashboard）** - 实现博主后台管理界面
7. **SEO 和性能优化（SEO & Performance）** - 实现 SEO 优化和性能优化

---

## Epic 1: 项目基础架构（Foundation）

建立项目基础架构，包括项目初始化、数据库设计、部署配置等，为所有后续功能提供基础支撑。

### Story 1.1: 项目初始化和基础配置

As a **developer**,  
I want **to initialize the Next.js project with Tailwind CSS and configure the development environment**,  
So that **I have a solid foundation to build the blog application**.

**Acceptance Criteria:**

**Given** I have Node.js and npm/yarn installed  
**When** I run the project initialization command  
**Then** the Next.js project is created with TypeScript support  
**And** Tailwind CSS is configured and working  
**And** the project structure follows Next.js best practices  
**And** basic configuration files (package.json, tsconfig.json, tailwind.config.js) are set up correctly

**Prerequisites:** None (this is the first story)

**Technical Notes:**
- Use `create-next-app` with TypeScript template
- Configure Tailwind CSS following Next.js documentation
- Set up project structure: `app/`, `components/`, `lib/`, `public/`
- Configure ESLint and Prettier (optional but recommended)
- Set up environment variables structure

---

### Story 1.2: 数据库设计和初始化

As a **developer**,  
I want **to design and initialize the PostgreSQL database schema**,  
So that **I can store users, articles, comments, and other data**.

**Acceptance Criteria:**

**Given** PostgreSQL is installed and running  
**When** I run the database initialization script  
**Then** the database is created  
**And** all required tables are created (users, articles, categories, tags, comments, etc.)  
**And** indexes are created for performance  
**And** foreign key relationships are properly set up  
**And** database migration system is configured

**Prerequisites:** Story 1.1

**Technical Notes:**
- Design database schema based on PRD requirements
- Use migration tool (Prisma, TypeORM, or raw SQL migrations)
- Create tables: users, articles, categories, tags, article_tags, comments
- Set up indexes on frequently queried columns (user_id, article_id, published_at, etc.)
- Configure database connection pooling
- Set up database environment variables

---

### Story 1.3: 数据库连接和 ORM 配置

As a **developer**,  
I want **to configure database connection and ORM (Object-Relational Mapping)**,  
So that **I can interact with the database from the application**.

**Acceptance Criteria:**

**Given** the database schema is initialized  
**When** I configure the ORM  
**Then** the database connection is established  
**And** I can perform CRUD operations on all tables  
**And** type-safe database queries are available  
**And** connection pooling is configured correctly

**Prerequisites:** Story 1.2

**Technical Notes:**
- Choose ORM: Prisma (recommended) or TypeORM
- Configure database connection string
- Set up connection pooling
- Create database client/connection module
- Test database connectivity
- Set up database seed script (optional)

---

### Story 1.4: 部署配置和 CI/CD 基础

As a **developer**,  
I want **to configure Vercel deployment and basic CI/CD**,  
So that **I can deploy the application easily**.

**Acceptance Criteria:**

**Given** the project is initialized  
**When** I configure Vercel deployment  
**Then** the project is connected to Vercel  
**And** automatic deployments are set up on git push  
**And** environment variables are configured in Vercel  
**And** the deployment pipeline is working correctly

**Prerequisites:** Story 1.1

**Technical Notes:**
- Connect GitHub repository to Vercel
- Configure build settings (Next.js default)
- Set up environment variables in Vercel dashboard
- Configure production and preview deployments
- Test deployment process
- Set up database connection for production environment

---

### Story 1.5: 存储抽象层实现

As a **developer**,  
I want **to implement a storage abstraction layer**,  
So that **file storage can be easily migrated to cloud storage in the future**.

**Acceptance Criteria:**

**Given** the project is initialized  
**When** I implement the storage abstraction layer  
**Then** I create a storage interface (`lib/storage/interface.ts`)  
**And** I implement local file system storage (`lib/storage/local.ts`)  
**And** the storage interface supports file upload, delete, and list operations  
**And** the storage implementation can be used by other modules  
**When** I upload a file using the storage layer  
**Then** the file is saved to the local file system  
**And** the file path is returned  
**When** I delete a file using the storage layer  
**Then** the file is removed from the local file system  
**When** I list files using the storage layer  
**Then** I get a list of all files with metadata

**Prerequisites:** Story 1.1

**Technical Notes:**
- **创建存储接口 (`lib/storage/interface.ts`):**
  - Define `StorageInterface` interface with methods:
    - `upload(file: File, path?: string): Promise<string>` - Upload file, return file path/URL
    - `delete(path: string): Promise<void>` - Delete file by path
    - `list(prefix?: string): Promise<FileMetadata[]>` - List files, optionally filtered by prefix
    - `getUrl(path: string): Promise<string>` - Get public URL for file
  - Define `FileMetadata` type: `{ path: string, name: string, size: number, mimeType: string, createdAt: Date }`
- **实现本地存储 (`lib/storage/local.ts`):**
  - Implement `LocalStorage` class that implements `StorageInterface`
  - Use Node.js `fs` module for file operations
  - Store files in `public/uploads/` directory
  - Generate unique filenames (UUID or timestamp-based)
  - Create directory structure if it doesn't exist
  - Handle file upload: save to disk, return relative path
  - Handle file deletion: remove from disk
  - Handle file listing: read directory, return file metadata
  - Handle URL generation: return `/uploads/{filename}` for public access
- **创建存储工厂函数:**
  - Create `getStorage()` function that returns storage instance
  - Use environment variable to determine storage type (default: local)
  - For future: support switching to cloud storage via config
- **错误处理:**
  - Handle file system errors (permissions, disk full, etc.)
  - Validate file operations
  - Return meaningful error messages
- **测试:**
  - Test file upload, delete, and list operations
  - Test error handling
  - Ensure files are stored in correct location

---

## Epic 2: 用户认证和授权（User Authentication & Authorization）

实现用户注册、登录、角色管理和权限控制，为博客系统提供用户身份验证和授权功能。

### Story 2.1: 用户注册功能（邮箱注册）

As a **visitor**,  
I want **to register an account using my email address**,  
So that **I can access the blog features that require authentication**.

**Acceptance Criteria:**

**Given** I am on the registration page  
**When** I enter a valid email address and password  
**And** I submit the registration form  
**Then** my account is created in the database  
**And** I receive a confirmation (optional email verification)  
**And** I am automatically logged in  
**And** I am redirected to the appropriate page

**Prerequisites:** Epic 1 (all stories)

**Technical Notes:**
- Create registration API endpoint
- Implement email validation
- Implement password hashing using bcrypt
- Store user data in database
- Generate JWT token after registration
- Set up email verification (optional for MVP)
- Handle registration errors (duplicate email, invalid input)

---

### Story 2.2: OAuth 登录集成（GitHub 和 Google）

As a **visitor**,  
I want **to log in using my GitHub or Google account**,  
So that **I can quickly access the blog without creating a new account**.

**Acceptance Criteria:**

**Given** I am on the login page  
**When** I click the "Login with GitHub" or "Login with Google" button  
**Then** I am redirected to the OAuth provider  
**And** after authorizing, I am redirected back to the blog  
**And** my account is created or logged in automatically  
**And** I receive a JWT token  
**And** I am logged in successfully

**Prerequisites:** Story 2.1

**Technical Notes:**
- Set up OAuth apps in GitHub and Google
- Configure OAuth callback URLs
- Implement OAuth flow (authorization code flow)
- Store OAuth user data in database
- Link OAuth accounts to existing email accounts (if email matches)
- Generate JWT token after OAuth login
- Handle OAuth errors

---

### Story 2.3: 用户登录功能（邮箱密码登录）

As a **registered user**,  
I want **to log in using my email and password**,  
So that **I can access my account and blog features**.

**Acceptance Criteria:**

**Given** I have a registered account  
**When** I enter my email and password on the login page  
**And** I submit the login form  
**Then** my credentials are validated  
**And** I receive a JWT token  
**And** I am logged in successfully  
**And** I am redirected to the appropriate page  
**And** my login state persists across page refreshes

**Prerequisites:** Story 2.1

**Technical Notes:**
- Create login API endpoint
- Validate email and password
- Compare password hash using bcrypt
- Generate JWT token with user information
- Set JWT token in httpOnly cookie
- Implement token expiration and refresh mechanism
- Handle login errors (invalid credentials, account not found)

---

### Story 2.4: JWT 认证中间件

As a **developer**,  
I want **to implement JWT authentication middleware**,  
So that **protected routes can verify user authentication**.

**Acceptance Criteria:**

**Given** a user makes a request to a protected route  
**When** the request includes a valid JWT token  
**Then** the user is authenticated  
**And** the user information is available in the request context  
**And** the request proceeds normally  
**When** the request includes an invalid or expired token  
**Then** the request is rejected with 401 Unauthorized  
**And** the user is redirected to login

**Prerequisites:** Story 2.3

**Technical Notes:**
- Create JWT verification middleware
- Extract token from httpOnly cookie or Authorization header
- Verify token signature and expiration
- Attach user information to request context
- Handle token refresh (if token is expired but refresh token is valid)
- Protect API routes and pages that require authentication

---

### Story 2.5: 用户角色和权限管理

As a **developer**,  
I want **to implement user roles and permission system**,  
So that **different users have different access levels**.

**Acceptance Criteria:**

**Given** users exist in the database  
**When** a user is created  
**Then** the user is assigned a default role (user or admin)  
**And** role-based permissions are enforced  
**And** admin users can access admin features  
**And** regular users cannot access admin features  
**When** an admin tries to access admin features  
**Then** access is granted  
**When** a regular user tries to access admin features  
**Then** access is denied with 403 Forbidden

**Prerequisites:** Story 2.4

**Technical Notes:**
- Add role field to users table (enum: 'user', 'admin')
- Create permission check middleware/function
- Protect admin routes with role check
- Set up first admin user (seed script or manual)
- Implement role-based UI rendering (show/hide admin links)
- Test permission enforcement

---

### Story 2.6: 用户资料管理

As a **registered user**,  
I want **to manage my profile information (avatar, bio)**,  
So that **other users can see my profile details**.

**Acceptance Criteria:**

**Given** I am logged in  
**When** I navigate to my profile page  
**Then** I can see my current profile information  
**When** I update my avatar  
**Then** the avatar is uploaded and saved  
**And** the new avatar is displayed  
**When** I update my bio  
**Then** the bio is saved to the database  
**And** the updated bio is displayed

**Prerequisites:** Story 2.5

**Technical Notes:**
- Create profile API endpoints (GET, PUT)
- Implement avatar upload (local storage with abstract layer)
- Store avatar path in database
- Create profile page UI
- Implement profile update form
- Add validation for profile fields
- Display profile information in comments and other places

---

## Epic 3: 内容创作和管理（Content Creation & Management）

实现文章的创建、编辑、发布、删除、草稿管理以及分类和标签管理功能。

### Story 3.1: 文章数据模型和基础 API

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

### Story 3.2: Tiptap 编辑器集成

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

### Story 3.3: 文章创建功能

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

### Story 3.4: 文章编辑功能

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

### Story 3.5: 文章删除功能

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

### Story 3.6: 文章分类管理

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

### Story 3.7: 文章标签管理

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

### Story 3.8: 媒体管理功能

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

## Epic 4: 内容展示（Content Display）

实现前台文章列表、详情页、分类筛选、标签筛选和分页功能。

### Story 4.1: 文章列表页面（首页）

As a **reader**,  
I want **to see a list of published articles on the homepage**,  
So that **I can discover and browse blog content**.

**Acceptance Criteria:**

**Given** I visit the homepage  
**When** the page loads  
**Then** I see a list of published articles  
**And** each article shows title, excerpt, publish date, category, and tags  
**And** articles are sorted by publish date (newest first or oldest first based on user preference)  
**And** articles are paginated (reasonable number per page)  
**And** the page is responsive (works on desktop, tablet, mobile)

**Prerequisites:** Story 3.7

**Technical Notes:**
- Create homepage component/page
- Fetch published articles from API
- Implement article list UI (cards or list view)
- Add pagination component
- Implement responsive design with Tailwind CSS
- Add loading states
- Handle empty state (no articles)

---

### Story 4.2: 文章详情页面

As a **reader**,  
I want **to view the full content of an article**,  
So that **I can read the complete blog post**.

**Acceptance Criteria:**

**Given** I am on the homepage or article list  
**When** I click on an article  
**Then** I am taken to the article detail page  
**And** I see the full article content  
**And** I see the article title, publish date, category, and tags  
**And** the content is well-formatted and readable  
**And** the page is responsive  
**And** images in the article are displayed correctly

**Prerequisites:** Story 4.1

**Technical Notes:**
- Create article detail page/component
- Fetch article by slug or ID from API
- Render article content (HTML from Tiptap)
- Display article metadata (title, date, category, tags)
- Implement responsive typography and layout
- Handle article not found errors
- Add SEO meta tags (title, description)

---

### Story 4.3: 分类筛选功能

As a **reader**,  
I want **to filter articles by category**,  
So that **I can find articles on specific topics**.

**Acceptance Criteria:**

**Given** I am on the homepage or article list  
**When** I click on a category (技术、生活、旅行)  
**Then** I see only articles in that category  
**And** the URL reflects the filter (e.g., /category/技术)  
**And** I can see how many articles are in this category  
**When** I click "All" or remove the filter  
**Then** I see all articles again

**Prerequisites:** Story 4.2

**Technical Notes:**
- Create category filter component
- Implement category page/route
- Filter articles by category in API
- Update URL with category parameter
- Show active filter state
- Display article count per category
- Add "All" option to show all articles

---

### Story 4.4: 标签筛选功能

As a **reader**,  
I want **to filter articles by tag**,  
So that **I can discover related content**.

**Acceptance Criteria:**

**Given** I am viewing an article or article list  
**When** I click on a tag  
**Then** I see all articles with that tag  
**And** the URL reflects the filter (e.g., /tag/javascript)  
**And** I can see how many articles have this tag  
**When** I click "All" or remove the filter  
**Then** I see all articles again

**Prerequisites:** Story 4.3

**Technical Notes:**
- Create tag filter component
- Implement tag page/route
- Filter articles by tag in API
- Update URL with tag parameter
- Show active filter state
- Display article count per tag
- Make tags clickable throughout the site

---

### Story 4.5: 分页功能

As a **reader**,  
I want **to navigate through multiple pages of articles**,  
So that **I can browse all blog content**.

**Acceptance Criteria:**

**Given** there are more articles than fit on one page  
**When** I view the article list  
**Then** I see pagination controls  
**And** I can see the current page number and total pages  
**When** I click "Next"  
**Then** I see the next page of articles  
**When** I click "Previous"  
**Then** I see the previous page of articles  
**When** I click a specific page number  
**Then** I see that page of articles  
**And** the URL reflects the current page

**Prerequisites:** Story 4.1

**Technical Notes:**
- Implement pagination component
- Add page parameter to API queries
- Calculate total pages based on article count
- Update URL with page parameter
- Handle edge cases (first page, last page)
- Show page numbers with ellipsis for many pages
- Make pagination responsive

---

## Epic 5: 读者互动（Reader Interaction）

实现留言、回复和留言管理功能，让读者可以与博主和其他读者互动。

### Story 5.1: 留言功能

As a **reader**,  
I want **to leave a comment on an article**,  
So that **I can share my thoughts and interact with the author**.

**Acceptance Criteria:**

**Given** I am viewing an article  
**When** I scroll to the comments section  
**Then** I see a comment form  
**When** I enter my name (or it's auto-filled if logged in) and comment text  
**And** I submit the comment  
**Then** my comment is saved to the database  
**And** my comment appears in the comments list  
**And** I see a success message  
**And** the comment shows my name, comment text, and timestamp

**Prerequisites:** Epic 4 (all stories)

**Technical Notes:**
- Create comments table (id, article_id, user_id, content, created_at, parent_id for replies)
- Create comment API endpoint (POST)
- Create comment form component
- Display comments list on article detail page
- Handle logged-in vs anonymous users
- Add input validation
- Show success/error messages
- Implement comment moderation (optional for MVP)

---

### Story 5.2: 留言回复功能

As a **reader**,  
I want **to reply to comments**,  
So that **I can engage in discussions with other readers and the author**.

**Acceptance Criteria:**

**Given** I am viewing an article with comments  
**When** I click "Reply" on a comment  
**Then** a reply form appears  
**When** I enter my reply text  
**And** I submit the reply  
**Then** my reply is saved to the database  
**And** my reply appears nested under the original comment  
**And** the reply shows my name, reply text, and timestamp

**Prerequisites:** Story 5.1

**Technical Notes:**
- Add parent_id field to comments table for nested replies
- Create reply API endpoint
- Implement nested comment display (indentation or threading)
- Add "Reply" button to each comment
- Show reply form inline or in modal
- Limit nesting depth (optional, e.g., 2-3 levels)
- Display reply count on parent comments

---

### Story 5.3: 留言管理功能（博主）

As a **blog author**,  
I want **to manage comments (delete, moderate)**,  
So that **I can maintain a healthy discussion environment**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**And** comments exist on articles  
**When** I view an article with comments  
**Then** I see delete buttons on each comment  
**When** I click delete on a comment  
**Then** I see a confirmation dialog  
**When** I confirm the deletion  
**Then** the comment is removed from the database  
**And** the comment disappears from the page  
**And** any replies to that comment are also deleted (cascade)

**Prerequisites:** Story 5.2

**Technical Notes:**
- Add delete button to comments (visible only to admins)
- Create delete comment API endpoint
- Implement delete confirmation dialog
- Handle cascading deletes (delete replies when parent is deleted)
- Validate user has permission to delete (admin only)
- Show success/error messages
- Optionally implement comment moderation (approve/reject before showing)

---

## Epic 6: 后台管理界面（Admin Dashboard）

实现博主后台管理界面，让博主可以方便地管理文章、查看统计等。

### Story 6.1: 后台管理界面基础结构

As a **blog author**,  
I want **to access an admin dashboard**,  
So that **I can manage my blog content**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**When** I navigate to /admin  
**Then** I see the admin dashboard  
**And** I see a navigation menu with admin sections  
**And** the dashboard is protected (non-admins are redirected)  
**And** the dashboard has a clean, professional layout

**Prerequisites:** Story 2.5

**Technical Notes:**
- Create /admin route/page
- Implement admin layout component
- Add admin navigation menu
- Protect admin routes with authentication and role check
- Redirect non-admins to homepage with error message
- Design admin UI with Tailwind CSS
- Add logout functionality

---

### Story 6.2: 文章管理列表

As a **blog author**,  
I want **to see a list of all my articles in the admin dashboard**,  
So that **I can quickly find and manage articles**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**When** I navigate to /admin/articles  
**Then** I see a list of all articles (published and drafts)  
**And** each article shows title, status, publish date, and actions (edit, delete)  
**And** I can filter articles by status (all, published, drafts)  
**And** I can search articles by title  
**And** I can click "New Article" to create a new article

**Prerequisites:** Story 6.1

**Technical Notes:**
- Create admin articles list page
- Fetch all articles from API (admin only)
- Display articles in a table or card layout
- Add status filter (all, published, drafts)
- Implement search functionality
- Add "New Article" button linking to article creation
- Add edit and delete buttons for each article
- Show article statistics (total, published, drafts)

---

### Story 6.3: 后台文章编辑集成

As a **blog author**,  
I want **to create and edit articles from the admin dashboard**,  
So that **I can manage my content efficiently**.

**Acceptance Criteria:**

**Given** I am logged in as an admin  
**When** I click "New Article" in the admin dashboard  
**Then** I am taken to the article creation page  
**And** I can create articles using the Tiptap editor  
**When** I click "Edit" on an existing article  
**Then** I am taken to the article edit page  
**And** I can edit the article using the Tiptap editor  
**And** changes are saved correctly

**Prerequisites:** Story 6.2, Story 3.3, Story 3.4

**Technical Notes:**
- Integrate article creation page into admin dashboard
- Integrate article edit page into admin dashboard
- Ensure Tiptap editor works in admin context
- Add navigation back to articles list
- Show save status (saving, saved, error)
- Add draft/publish toggle in admin interface

---

## Epic 7: SEO 和性能优化（SEO & Performance）

实现 SEO 优化（元标签、sitemap、结构化数据）和性能优化（图片优化、懒加载、代码分割）。

### Story 7.1: SEO 元标签优化

As a **blog owner**,  
I want **each article page to have proper SEO meta tags**,  
So that **my blog can be discovered through search engines**.

**Acceptance Criteria:**

**Given** an article exists  
**When** I view the article page  
**Then** the page has proper meta tags (title, description, keywords)  
**And** Open Graph tags are present for social sharing  
**And** Twitter Card tags are present  
**And** the meta tags are unique for each article  
**And** the meta tags are properly formatted

**Prerequisites:** Story 4.2

**Technical Notes:**
- Use Next.js Metadata API or next/head
- Generate dynamic meta tags for each article
- Add Open Graph tags (og:title, og:description, og:image, og:url)
- Add Twitter Card tags
- Use article title and excerpt for meta description
- Add default meta tags for homepage
- Test with social media debuggers (Facebook, Twitter)

---

### Story 7.2: Sitemap 生成

As a **blog owner**,  
I want **the website to have a sitemap.xml**,  
So that **search engines can discover all my articles**.

**Acceptance Criteria:**

**Given** articles exist in the database  
**When** I visit /sitemap.xml  
**Then** I see a valid XML sitemap  
**And** all published articles are listed  
**And** each article has a URL, last modified date, and priority  
**And** the sitemap follows XML sitemap standards

**Prerequisites:** Story 7.1

**Technical Notes:**
- Create sitemap.xml route/page
- Generate sitemap dynamically from database
- Include all published articles
- Add lastmod date (article updated_at)
- Set appropriate priority and changefreq
- Follow XML sitemap protocol
- Submit sitemap to search engines (Google Search Console)

---

### Story 7.3: 结构化数据（Schema.org）

As a **blog owner**,  
I want **article pages to include structured data**,  
So that **search engines can better understand my content**.

**Acceptance Criteria:**

**Given** an article exists  
**When** I view the article page source  
**Then** I see JSON-LD structured data  
**And** the structured data includes article information (title, author, publish date, content)  
**And** the structured data follows Schema.org Article schema  
**And** the structured data is valid

**Prerequisites:** Story 7.2

**Technical Notes:**
- Add JSON-LD script to article pages
- Use Schema.org Article type
- Include required fields: headline, author, datePublished, articleBody
- Optionally include image, category, tags
- Validate structured data with Google Rich Results Test
- Add structured data to homepage (Blog or Website schema)

---

### Story 7.4: 图片优化和懒加载

As a **blog owner**,  
I want **images to be optimized and lazy-loaded**,  
So that **the website loads quickly and performs well**.

**Acceptance Criteria:**

**Given** an article contains images  
**When** I view the article page  
**Then** images are optimized (WebP/AVIF format when supported)  
**And** images are lazy-loaded (load as user scrolls)  
**And** images have proper alt text  
**And** page load time is improved

**Prerequisites:** Story 4.2

**Technical Notes:**
- Use Next.js Image component
- Configure image optimization (WebP, AVIF)
- Implement lazy loading for images
- Add proper alt text to all images
- Optimize image sizes (responsive images)
- Use placeholder images (blur or color)
- Monitor Core Web Vitals (LCP improvement)

---

### Story 7.5: 代码分割和性能优化

As a **blog owner**,  
I want **the website to load quickly**,  
So that **readers have a good experience**.

**Acceptance Criteria:**

**Given** I visit the website  
**When** the page loads  
**Then** the First Contentful Paint (FCP) is < 1.8 seconds  
**And** the Largest Contentful Paint (LCP) is < 2.5 seconds  
**And** the First Input Delay (FID) is < 100ms  
**And** JavaScript is code-split appropriately  
**And** unused code is not loaded

**Prerequisites:** Story 7.4

**Technical Notes:**
- Use Next.js automatic code splitting
- Implement dynamic imports for heavy components
- Optimize bundle size
- Use React.lazy for component lazy loading
- Minimize JavaScript execution time
- Optimize CSS (remove unused styles)
- Monitor performance with Lighthouse
- Implement caching strategies

---

### Story 7.6: 响应式设计完善

As a **blog owner**,  
I want **the website to work well on all devices**,  
So that **all readers can access my content comfortably**.

**Acceptance Criteria:**

**Given** I access the website on desktop (1920x1080)  
**Then** the layout is optimized for desktop  
**Given** I access the website on tablet (768px-1024px)  
**Then** the layout adapts appropriately  
**Given** I access the website on mobile (320px-767px)  
**Then** the layout is mobile-friendly  
**And** all features work correctly on all devices  
**And** text is readable without zooming  
**And** touch targets are appropriately sized

**Prerequisites:** Story 7.5

**Technical Notes:**
- Test on multiple screen sizes
- Use Tailwind CSS responsive utilities
- Implement mobile-first design
- Test touch interactions
- Ensure navigation works on mobile
- Optimize images for different screen sizes
- Test form inputs on mobile
- Verify readability on all devices

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
