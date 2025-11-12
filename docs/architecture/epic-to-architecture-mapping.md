# Epic to Architecture Mapping

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
