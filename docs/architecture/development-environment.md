# Development Environment

## Prerequisites

- Node.js 18.18 or higher
- PostgreSQL 14 or higher
- npm or yarn

## Setup Commands

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
