# Epic 6: 后台管理界面（Admin Dashboard）

实现博主后台管理界面，让博主可以方便地管理文章、查看统计等。

## Story 6.1: 后台管理界面基础结构

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

## Story 6.2: 文章管理列表

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

## Story 6.3: 后台文章编辑集成

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
