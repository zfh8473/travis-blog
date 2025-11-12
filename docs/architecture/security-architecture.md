# Security Architecture

## Authentication

**NextAuth.js Configuration:**
- Providers: GitHub OAuth, Google OAuth, Credentials (email/password)
- Session strategy: JWT
- Token storage: httpOnly cookies
- Token expiration: Configurable (default 30 days)
- Refresh tokens: Supported

## Authorization

**Role-Based Access Control:**
- Roles: `USER` (default), `ADMIN`
- Admin routes: Protected with middleware
- Admin actions: Check role before execution

## Data Protection

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

## Security Headers

**Next.js Security Headers:**
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

---
