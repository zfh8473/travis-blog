# Data Architecture

## Database Schema

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

## Data Relationships

- User → Articles (One-to-Many)
- User → Comments (One-to-Many)
- Article → Category (Many-to-One)
- Article → Tags (Many-to-Many via ArticleTag)
- Article → Comments (One-to-Many)
- Comment → Comment (Self-referential for replies)

## Indexes

**Performance Indexes:**
- `articles.publishedAt` - For sorting published articles
- `articles.slug` - For article lookup
- `articles.authorId` - For author's articles
- `comments.articleId` - For article comments
- `comments.parentId` - For comment replies

---
