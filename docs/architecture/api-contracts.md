# API Contracts

## Server Actions Pattern

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

## API Routes (for external integrations)

**File Upload:**
- `POST /api/upload` - Upload image/file
- Response: `{ success: true, data: { url: string } }`

**Authentication:**
- NextAuth.js handles: `/api/auth/*`

## Response Format

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
