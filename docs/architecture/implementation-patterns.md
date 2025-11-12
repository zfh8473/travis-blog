# Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

## Naming Conventions

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

## Code Organization

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

## Code Documentation

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

## Error Handling

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

## Logging Strategy

**Development:**
- Use `console.log`, `console.error` for debugging
- Log level: Verbose

**Production:**
- Structured logging (JSON format)
- Log levels: error, warn, info
- Log to console (Vercel handles log aggregation)

## Date/Time Handling

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
