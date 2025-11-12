# Deployment Architecture

## Vercel Deployment

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

## Database

**Production Database:**
- PostgreSQL (managed service or Vercel Postgres)
- Connection pooling
- Automated backups

## File Storage

**Current:**
- Local file system (Vercel serverless functions)
- Abstract layer for future migration

**Future Migration:**
- Cloud storage (S3, Cloudinary, Vercel Blob)
- Update storage implementation, no code changes needed

---
