# Project Structure

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
