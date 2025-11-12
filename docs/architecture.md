# Architecture

## Executive Summary

Travis-blog 采用 Next.js App Router 架构，使用 Prisma ORM 管理 PostgreSQL 数据库，NextAuth.js 处理认证，Server Actions 处理数据操作。架构设计注重模块化、可扩展性和一致性，确保 AI 代理能够一致地实现所有功能。

---

## Project Initialization

**First implementation story should execute:**

```bash
npx create-next-app@latest travis-blog --typescript --tailwind --app --no-src-dir
```

**This establishes the base architecture with these decisions:**
- ✅ TypeScript support
- ✅ Tailwind CSS integration
- ✅ Next.js App Router (app/ directory)
- ✅ ESLint configuration
- ✅ Project structure following Next.js best practices

---

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Project Template** | Next.js Official Starter | Latest | All | 官方支持，最佳实践，与 Vercel 集成好 |
| **ORM** | Prisma | Latest | Epic 1, 2, 3, 5 | 类型安全，与 Next.js 集成好，迁移系统完善 |
| **API Pattern** | Next.js Server Actions + API Routes | Latest | All | Next.js 原生，类型安全，减少样板代码 |
| **Authentication** | NextAuth.js | Latest | Epic 2 | Next.js 生态，支持 OAuth + JWT，开箱即用 |
| **File Storage** | Local Storage (Abstract Layer) | - | Epic 3, 5 | 便于后续迁移到云存储，抽象层设计 |
| **Date/Time** | date-fns | Latest | All | 轻量级，函数式，易于使用 |
| **Error Handling** | Unified Error Format | - | All | 一致性，便于前端处理 |
| **Logging** | Console (Dev) + Structured (Prod) | - | All | 开发简单，生产结构化 |

---

## Project Structure

```
travis-blog/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── admin/                    # Admin dashboard (protected)
│   │   ├── articles/
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   └── layout.tsx
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── articles/
│   │   ├── comments/
│   │   └── upload/
│   ├── category/
│   │   └── [slug]/
│   ├── tag/
│   │   └── [slug]/
│   ├── posts/
│   │   └── [slug]/
│   ├── sitemap.xml.ts
│   ├── layout.tsx
│   └── page.tsx                  # Homepage
├── components/                   # React Components
│   ├── ui/                      # shadcn/ui components
│   ├── article/
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleList.tsx
│   │   └── ArticleDetail.tsx
│   ├── comment/
│   │   ├── CommentForm.tsx
│   │   ├── CommentList.tsx
│   │   └── CommentItem.tsx
│   ├── editor/
│   │   └── TiptapEditor.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
├── lib/                         # Utilities and shared code
│   ├── db/                      # Database
│   │   ├── prisma.ts
│   │   └── seed.ts
│   ├── auth/                    # Authentication
│   │   └── config.ts
│   ├── storage/                 # Storage abstraction layer
│   │   ├── interface.ts
│   │   └── local.ts
│   ├── utils/                   # Utility functions
│   │   ├── date.ts
│   │   └── validation.ts
│   └── constants/               # Constants
│       └── categories.ts
├── prisma/                      # Prisma schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── public/                      # Static assets
│   ├── images/
│   └── uploads/                 # Local file storage
├── types/                       # TypeScript type definitions
│   ├── article.ts
│   ├── user.ts
│   └── comment.ts
├── .env.local                   # Environment variables (gitignored)
├── .env.example                 # Environment variables template
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Epic to Architecture Mapping

| Epic | Architecture Location | Key Components |
|------|----------------------|----------------|
| **Epic 1: Foundation** | `app/`, `prisma/`, `lib/db/` | Project structure, database schema, ORM config |
| **Epic 2: Authentication** | `app/(auth)/`, `lib/auth/`, `app/api/auth/` | NextAuth.js config, login/register pages |
| **Epic 3: Content Management** | `app/admin/`, `components/editor/`, `lib/storage/` | Admin dashboard, Tiptap editor, storage layer |
| **Epic 4: Content Display** | `app/page.tsx`, `app/posts/`, `components/article/` | Homepage, article pages, article components |
| **Epic 5: Reader Interaction** | `components/comment/`, `app/api/comments/` | Comment components, comment API |
| **Epic 6: Admin Dashboard** | `app/admin/`, `components/admin/` | Admin layout, admin components |
| **Epic 7: SEO & Performance** | `app/sitemap.xml.ts`, `next.config.js`, `components/` | Sitemap, metadata, image optimization |

---

## Technology Stack Details

### Core Technologies

**Frontend:**
- **Next.js** (Latest) - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** or **Headless UI** - Component library
- **Tiptap** - Rich text editor
- **date-fns** - Date manipulation library

**Backend:**
- **Next.js Server Actions** - Server-side data mutations
- **Next.js API Routes** - REST API endpoints
- **Prisma** (Latest) - ORM for PostgreSQL
- **NextAuth.js** (Latest) - Authentication library

**Database:**
- **PostgreSQL** - Relational database

**Deployment:**
- **Vercel** - Hosting and deployment platform

**Storage:**
- **Local File System** (with abstract layer) - File storage

### Integration Points

**Database Integration:**
- Prisma Client → Database operations
- Prisma Migrate → Schema migrations
- Connection pooling via Prisma

**Authentication Integration:**
- NextAuth.js → OAuth providers (GitHub, Google)
- NextAuth.js → JWT token management
- NextAuth.js → Session management

**Storage Integration:**
- Storage abstraction layer → Local file system
- Future: Storage abstraction layer → Cloud storage (S3, Cloudinary)

**Editor Integration:**
- Tiptap → Article content editing
- Tiptap → Markdown support
- Storage layer → Image upload

---

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Conventions

**Database:**
- Tables: `snake_case` (e.g., `users`, `articles`, `article_tags`)
- Columns: `snake_case` (e.g., `user_id`, `created_at`, `published_at`)
- Foreign keys: `{table}_id` (e.g., `user_id`, `article_id`)

**API Routes:**
- Routes: `/api/{resource}` (e.g., `/api/articles`, `/api/comments`)
- Route parameters: `[id]` or `[slug]` (Next.js dynamic routes)
- Server Actions: `{action}Action` suffix (e.g., `createArticleAction`)

**Components:**
- Component files: `PascalCase.tsx` (e.g., `ArticleCard.tsx`, `CommentForm.tsx`)
- Component names: `PascalCase` (e.g., `ArticleCard`, `CommentForm`)
- Props interfaces: `{Component}Props` (e.g., `ArticleCardProps`)

**Functions:**
- Functions: `camelCase` (e.g., `getArticles`, `createComment`)
- Server Actions: `camelCase` with `Action` suffix (e.g., `createArticleAction`)

**Constants:**
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`)

### Code Organization

**Component Organization:**
- By feature: `components/article/`, `components/comment/`
- Shared UI: `components/ui/` (shadcn/ui components)
- Layout: `components/layout/`

**File Co-location:**
- Tests: Co-located with source files (e.g., `ArticleCard.test.tsx`)
- Types: Centralized in `types/` directory
- Utilities: Organized in `lib/utils/`

**API Organization:**
- By resource: `app/api/articles/`, `app/api/comments/`
- Route handlers: `route.ts` (Next.js App Router convention)

### Code Documentation

**JSDoc Comment Standards:**

All public functions, public interfaces, classes, and exported types MUST include JSDoc-style comments. This ensures code maintainability, IDE support, and clear API documentation.

**Required JSDoc for Public Functions:**
```typescript
/**
 * Creates a new article in the database.
 * 
 * @param data - The article data including title, content, and metadata
 * @param userId - The ID of the user creating the article
 * @returns Promise resolving to the created article
 * @throws {ValidationError} If the article data is invalid
 * @throws {UnauthorizedError} If the user is not authenticated
 * 
 * @example
 * ```typescript
 * const article = await createArticle({
 *   title: "My First Post",
 *   content: "Article content...",
 *   categoryId: "cat-123"
 * }, "user-456");
 * ```
 */
export async function createArticle(
  data: CreateArticleInput,
  userId: string
): Promise<Article> {
  // Implementation
}
```

**Required JSDoc for Public Interfaces:**
```typescript
/**
 * Represents a storage interface for file operations.
 * 
 * This interface provides an abstraction layer for file storage,
 * allowing easy migration between local and cloud storage backends.
 * 
 * @interface StorageInterface
 */
export interface StorageInterface {
  /**
   * Uploads a file to storage.
   * 
   * @param file - The file to upload
   * @param path - Optional custom path for the file
   * @returns Promise resolving to the file path/URL
   * @throws {StorageError} If the upload fails
   */
  upload(file: File, path?: string): Promise<string>;
  
  /**
   * Deletes a file from storage.
   * 
   * @param path - The path of the file to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {StorageError} If the file doesn't exist or deletion fails
   */
  delete(path: string): Promise<void>;
}
```

**Required JSDoc for React Components:**
```typescript
/**
 * Displays an article card with title, excerpt, and metadata.
 * 
 * @component
 * @param props - Component props
 * @param props.article - The article data to display
 * @param props.onClick - Optional click handler
 * 
 * @example
 * ```tsx
 * <ArticleCard 
 *   article={articleData} 
 *   onClick={() => navigate(`/posts/${articleData.slug}`)}
 * />
 * ```
 */
export function ArticleCard({ article, onClick }: ArticleCardProps) {
  // Implementation
}
```

**Required JSDoc for Server Actions:**
```typescript
/**
 * Server action to create a new article.
 * 
 * This action handles article creation on the server side,
 * including validation, authorization checks, and database operations.
 * 
 * @param formData - Form data containing article information
 * @returns Promise resolving to the created article or an error
 * 
 * @throws {ValidationError} If input validation fails
 * @throws {UnauthorizedError} If user is not authenticated or lacks permission
 * 
 * @example
 * ```typescript
 * const result = await createArticleAction(formData);
 * if (result.success) {
 *   console.log('Article created:', result.data);
 * }
 * ```
 */
export async function createArticleAction(
  formData: FormData
): Promise<ActionResult<Article>> {
  // Implementation
}
```

**JSDoc Requirements:**
- ✅ **All public functions** (exported functions) must have JSDoc comments
- ✅ **All public interfaces** must have JSDoc comments describing their purpose
- ✅ **All public classes** must have JSDoc comments
- ✅ **All exported types** that are part of the public API should have JSDoc comments
- ✅ **@param** tags for all function parameters with descriptions
- ✅ **@returns** tag describing the return value
- ✅ **@throws** tags for all possible errors/exceptions
- ✅ **@example** tags for complex functions (recommended)
- ✅ **@interface**, **@component**, **@class** tags as appropriate

**JSDoc Format Guidelines:**
- Use clear, concise descriptions
- Include parameter types and descriptions
- Document return types and possible return values
- List all possible exceptions/errors
- Provide usage examples for complex functions
- Use proper JSDoc syntax (not TypeScript-only comments)

**Private/Internal Functions:**
- Private functions (not exported) may have simpler comments or no JSDoc
- Internal helper functions should have at least a brief comment explaining their purpose
- Complex private functions should still have JSDoc for maintainability

### Error Handling

**Error Format:**
```typescript
// Success response
{ success: true, data: T }

// Error response
{ success: false, error: { message: string, code: string } }
```

**Error Handling Strategy:**
- Server Actions: Throw errors, catch in error boundaries
- API Routes: Return error responses with status codes
- Client components: Use try-catch and error boundaries
- Log errors: Console in dev, structured logging in prod

### Logging Strategy

**Development:**
- Use `console.log`, `console.error` for debugging
- Log level: Verbose

**Production:**
- Structured logging (JSON format)
- Log levels: error, warn, info
- Log to console (Vercel handles log aggregation)

### Date/Time Handling

**Storage:**
- Store all dates in UTC
- Use PostgreSQL `TIMESTAMP WITH TIME ZONE`

**Display:**
- Convert to user's local timezone using `date-fns`
- Format: ISO 8601 for APIs, localized format for UI

**Library:**
- Use `date-fns` for date manipulation
- Use `date-fns-tz` for timezone handling

---

## Data Architecture

### Database Schema

**Users Table:**
```prisma
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

**Articles Table:**
```prisma
model Article {
  id          String      @id @default(cuid())
  title       String
  content     String      @db.Text
  excerpt     String?
  slug        String      @unique
  status      ArticleStatus @default(DRAFT)
  categoryId  String?
  authorId    String
  publishedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  author      User        @relation(fields: [authorId], references: [id])
  category    Category?   @relation(fields: [categoryId], references: [id])
  tags        ArticleTag[]
  comments    Comment[]
}
```

**Categories Table:**
```prisma
model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  slug      String    @unique
  articles   Article[]
}
```

**Tags Table:**
```prisma
model Tag {
  id        String      @id @default(cuid())
  name      String      @unique
  slug      String      @unique
  articles   ArticleTag[]
}
```

**ArticleTags Table (Junction):**
```prisma
model ArticleTag {
  articleId String
  tagId     String
  article   Article @relation(fields: [articleId], references: [id])
  tag       Tag     @relation(fields: [tagId], references: [id])
  
  @@id([articleId, tagId])
}
```

**Comments Table:**
```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  articleId String
  userId    String?
  parentId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  article   Article  @relation(fields: [articleId], references: [id])
  user      User?    @relation(fields: [userId], references: [id])
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
}
```

### Data Relationships

- User → Articles (One-to-Many)
- User → Comments (One-to-Many)
- Article → Category (Many-to-One)
- Article → Tags (Many-to-Many via ArticleTag)
- Article → Comments (One-to-Many)
- Comment → Comment (Self-referential for replies)

### Indexes

**Performance Indexes:**
- `articles.publishedAt` - For sorting published articles
- `articles.slug` - For article lookup
- `articles.authorId` - For author's articles
- `comments.articleId` - For article comments
- `comments.parentId` - For comment replies

---

## API Contracts

### Server Actions Pattern

**Article Actions:**
```typescript
// Create article
createArticleAction(data: CreateArticleInput): Promise<Article>

// Update article
updateArticleAction(id: string, data: UpdateArticleInput): Promise<Article>

// Delete article
deleteArticleAction(id: string): Promise<void>

// Get article
getArticleAction(slug: string): Promise<Article | null>

// Get articles
getArticlesAction(params: GetArticlesParams): Promise<Article[]>
```

**Comment Actions:**
```typescript
// Create comment
createCommentAction(data: CreateCommentInput): Promise<Comment>

// Get comments
getCommentsAction(articleId: string): Promise<Comment[]>
```

### API Routes (for external integrations)

**File Upload:**
- `POST /api/upload` - Upload image/file
- Response: `{ success: true, data: { url: string } }`

**Authentication:**
- NextAuth.js handles: `/api/auth/*`

### Response Format

**Success:**
```typescript
{ success: true, data: T }
```

**Error:**
```typescript
{ success: false, error: { message: string, code: string } }
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

---

## Security Architecture

### Authentication

**NextAuth.js Configuration:**
- Providers: GitHub OAuth, Google OAuth, Credentials (email/password)
- Session strategy: JWT
- Token storage: httpOnly cookies
- Token expiration: Configurable (default 30 days)
- Refresh tokens: Supported

### Authorization

**Role-Based Access Control:**
- Roles: `USER` (default), `ADMIN`
- Admin routes: Protected with middleware
- Admin actions: Check role before execution

### Data Protection

**Input Validation:**
- Server-side validation for all inputs
- Use Zod or similar for schema validation
- Sanitize user inputs

**SQL Injection Prevention:**
- Prisma parameterized queries (automatic)
- No raw SQL queries

**XSS Prevention:**
- React automatic escaping
- Sanitize HTML content (Tiptap handles this)
- Content Security Policy (CSP) headers

### Security Headers

**Next.js Security Headers:**
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

---

## Performance Considerations

### Code Splitting

**Next.js Automatic Code Splitting:**
- Route-based splitting (automatic)
- Dynamic imports for heavy components
- Lazy load Tiptap editor

### Image Optimization

**Next.js Image Component:**
- Automatic image optimization
- WebP/AVIF format support
- Lazy loading
- Responsive images

### Caching Strategy

**Static Generation:**
- Homepage: ISR (Incremental Static Regeneration)
- Article pages: ISR with revalidation
- Category/Tag pages: ISR

**API Caching:**
- Database query caching (Prisma)
- Response caching for static content

### Database Optimization

**Query Optimization:**
- Use Prisma select to limit fields
- Add database indexes
- Use pagination for large datasets
- Optimize N+1 queries

---

## Deployment Architecture

### Vercel Deployment

**Configuration:**
- Automatic deployments from Git
- Preview deployments for PRs
- Production deployments from main branch

**Environment Variables:**
- Database URL
- NextAuth.js secrets
- OAuth provider credentials
- Storage configuration

**Build Process:**
- Next.js automatic build
- Prisma generate during build
- TypeScript type checking

### Database

**Production Database:**
- PostgreSQL (managed service or Vercel Postgres)
- Connection pooling
- Automated backups

### File Storage

**Current:**
- Local file system (Vercel serverless functions)
- Abstract layer for future migration

**Future Migration:**
- Cloud storage (S3, Cloudinary, Vercel Blob)
- Update storage implementation, no code changes needed

---

## Development Environment

### Prerequisites

- Node.js 18.18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Setup Commands

```bash
# 1. Initialize project
npx create-next-app@latest travis-blog --typescript --tailwind --app --no-src-dir

# 2. Install dependencies
cd travis-blog
npm install

# 3. Install additional dependencies
npm install prisma @prisma/client next-auth date-fns
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-markdown
npm install @radix-ui/react-* # For shadcn/ui components

# 4. Initialize Prisma
npx prisma init

# 5. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and secrets

# 6. Run database migrations
npx prisma migrate dev

# 7. Generate Prisma Client
npx prisma generate

# 8. Start development server
npm run dev
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Next.js App Router

**Decision:** Use Next.js App Router instead of Pages Router

**Rationale:**
- Modern Next.js approach
- Better performance with Server Components
- Improved developer experience
- Better TypeScript support

**Affects:** All epics

---

### ADR-002: Prisma ORM

**Decision:** Use Prisma as the ORM

**Rationale:**
- Type-safe database queries
- Excellent Next.js integration
- Migration system
- Good developer experience

**Affects:** Epic 1, 2, 3, 5

---

### ADR-003: NextAuth.js

**Decision:** Use NextAuth.js for authentication

**Rationale:**
- Next.js ecosystem integration
- Supports OAuth + JWT
- Built-in session management
- Security best practices

**Affects:** Epic 2

---

### ADR-004: Storage Abstraction Layer

**Decision:** Implement storage abstraction layer for file storage

**Rationale:**
- Enables future migration to cloud storage
- No code changes needed when migrating
- Consistent API across storage backends

**Affects:** Epic 3, 5

---

### ADR-005: Server Actions over API Routes

**Decision:** Prefer Server Actions for data mutations

**Rationale:**
- Type-safe by default
- Less boilerplate
- Better integration with React
- API Routes for external integrations only

**Affects:** All epics

---

_Created through collaborative discovery between Travis and AI facilitator._

