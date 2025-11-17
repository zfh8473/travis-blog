# Epic 4: 内容展示（Content Display）

实现前台文章列表、详情页、分类筛选、标签筛选和分页功能。

## Story 4.1: 文章列表页面（首页）

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

## Story 4.2: 文章详情页面

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
**And** code blocks display with syntax highlighting  
**And** the page is responsive  
**And** images in the article are displayed correctly

**Prerequisites:** Story 4.1

**Technical Notes:**
- Create article detail page as Server Component (`app/articles/[slug]/page.tsx`)
- Fetch article by slug directly from database using Prisma (Server Component)
- **Markdown 渲染增强：**
  - Use custom Typography styles (based on `@tailwindcss/typography` concepts)
  - Implement comprehensive prose classes for headings, paragraphs, links, lists, etc.
  - Create distinct content container with card-like layout
  - Optimize title hierarchy and visual design
  - Apply gradient text effects and decorative elements to main title
- **代码语法高亮：**
  - Integrate Shiki syntax highlighter
  - Use `enhanceHtmlWithSyntaxHighlighting` function to process existing HTML content
  - Support multiple programming languages (JavaScript, TypeScript, Python, Go, Rust, etc.)
  - Use GitHub Dark theme matching existing code block styles
  - Apply syntax highlighting to all code blocks in article content
- Render article content (HTML from MarkdownEditor)
- Display article metadata (title, date, category, tags)
- Implement responsive typography and layout
- Handle article not found errors
- Add SEO meta tags (title, description)
- **架构优势：** Server Component provides better performance and SEO, direct database access eliminates API overhead

---

## Story 4.3: 分类筛选功能

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

## Story 4.4: 标签筛选功能

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

## Story 4.5: 分页功能

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
