# Technology Stack Details

## Core Technologies

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

## Integration Points

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
