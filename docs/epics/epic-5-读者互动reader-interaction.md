# Epic 5: 读者互动（Reader Interaction）

实现留言、回复和留言管理功能，让读者可以与博主和其他读者互动。

---

## ⚠️ 当前状态：功能暂时禁用

**状态：** ⏸️ 暂时禁用  
**原因：** 调查 Vercel 部署问题时暂时移除  
**代码状态：** 代码已实现但 UI 未显示  
**详细说明：** 参见 `docs/epic5-comment-feature-status.md`

**影响：**
- 文章详情页面不显示留言区域
- 留言功能在 UI 上不可见
- 后端代码和数据库结构仍然完整

**恢复计划：** 待核心功能稳定后恢复，参见状态文档中的恢复步骤。

---

## Story 5.1: 留言功能

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

## Story 5.2: 留言回复功能

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

## Story 5.3: 留言管理功能（博主）

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
