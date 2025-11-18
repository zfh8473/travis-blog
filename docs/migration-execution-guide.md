# 数据库迁移执行指南

**创建日期：** 2025-11-17  
**最后更新：** 2025-11-17

---

## 📋 概述

本文档说明如何执行 Prisma 数据库迁移，特别是如何从 `.env.local` 文件中读取 `DATABASE_URL` 并自动执行迁移。

---

## 🔧 本地执行迁移

### 方法 1: 自动从 .env.local 读取（推荐）

```bash
# 从 .env.local 加载 DATABASE_URL 并执行迁移
export $(cat .env.local | grep -E "^DATABASE_URL" | xargs) && npx prisma migrate deploy
```

### 方法 2: 使用 dotenv（如果安装了 dotenv-cli）

```bash
# 安装 dotenv-cli（如果未安装）
npm install -g dotenv-cli

# 执行迁移
dotenv -e .env.local -- npx prisma migrate deploy
```

### 方法 3: 手动指定环境变量

```bash
# 设置环境变量
export DATABASE_URL="your-database-url"

# 执行迁移
npx prisma migrate deploy
```

---

## 🚀 生产环境执行迁移

### Vercel 环境

**选项 A: 使用 Vercel CLI（推荐）**

```bash
# 1. 安装 Vercel CLI（如果未安装）
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 链接项目
vercel link

# 4. 拉取环境变量
vercel env pull .env.local

# 5. 执行迁移
export $(cat .env.local | grep -E "^DATABASE_URL" | xargs) && npx prisma migrate deploy
```

**选项 B: 在 Vercel Dashboard 中执行**

1. 访问 Vercel Dashboard → 项目 → Settings → Environment Variables
2. 复制 `DATABASE_URL` 值
3. 在本地设置环境变量并执行迁移：

```bash
export DATABASE_URL="your-production-database-url"
npx prisma migrate deploy
```

---

## 📝 迁移状态检查

### 检查迁移状态

```bash
# 从 .env.local 加载环境变量
export $(cat .env.local | grep -E "^DATABASE_URL" | xargs)

# 检查迁移状态
npx prisma migrate status
```

**输出说明：**
- `No pending migrations to apply` - 所有迁移已应用
- `Following migration have not yet been applied: ...` - 有未应用的迁移

### 验证数据库结构

```bash
# 检查 views 字段是否存在
export $(cat .env.local | grep -E "^DATABASE_URL" | xargs)
npx prisma db execute --stdin <<< "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'views';"
```

---

## ⚠️ 常见问题

### 问题 1: "Missing required environment variable: DATABASE_URL"

**原因：** 环境变量未加载

**解决方案：**
```bash
# 确保从 .env.local 加载环境变量
export $(cat .env.local | grep -E "^DATABASE_URL" | xargs)
npx prisma migrate deploy
```

### 问题 2: "Could not find the migration file at migration.sql"

**原因：** 迁移目录存在但 migration.sql 文件缺失

**解决方案：**
1. 检查迁移目录：
   ```bash
   ls -la prisma/migrations/
   ```

2. 删除空的迁移目录：
   ```bash
   rm -rf prisma/migrations/空目录名
   ```

3. 重新执行迁移

### 问题 3: "No pending migrations to apply" 但字段不存在

**原因：** 迁移记录在数据库中，但实际字段未创建

**解决方案：**
```bash
# 手动执行 SQL（如果字段不存在）
export $(cat .env.local | grep -E "^DATABASE_URL" | xargs)
npx prisma db execute --stdin <<< "ALTER TABLE \"articles\" ADD COLUMN IF NOT EXISTS \"views\" INTEGER NOT NULL DEFAULT 0;"
```

---

## 🔗 相关文档

- Prisma 迁移文档: https://www.prisma.io/docs/guides/migrate
- Vercel 环境变量: `docs/vercel-env-setup.md`
- 迁移文件: `prisma/migrations/20251117120000_add_article_views/migration.sql`

---

**最后更新：** 2025-11-17  
**负责人：** Dev

