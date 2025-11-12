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
