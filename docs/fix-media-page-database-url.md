# 修复媒体管理页面 DATABASE_URL 环境变量问题

**问题描述：** 媒体管理页面 (`/admin/media`) 显示错误："Application error: a client-side exception has occurred"，控制台显示 "DATABASE_URL environment variable is not set"。

**问题原因：** 
- 媒体管理 API 路由 (`/api/media`) 使用 `checkFileUsage` 函数检查文件是否在文章中被使用
- `checkFileUsage` 函数使用 Prisma 查询数据库
- Prisma 在初始化时需要 `DATABASE_URL` 环境变量
- Vercel 环境中可能未配置 `DATABASE_URL` 环境变量

**修复方案：**

## 1. 代码修复（已完成）

### 1.1 更新 API 路由认证方式
- ✅ 更新 `app/api/media/route.ts` 使用 `getUserFromRequestOrHeaders` 和 `getServerSession` 作为后备
- ✅ 更新 `app/api/media/[path]/route.ts` 使用 `getUserFromRequestOrHeaders` 和 `getServerSession` 作为后备

### 1.2 确保 Node.js 运行时
- ✅ 在两个 API 路由中添加 `export const runtime = "nodejs"` 确保在 Node.js 运行时中运行（支持 Prisma）

## 2. Vercel 环境变量配置（需要手动配置）

### 2.1 检查现有环境变量

在 Vercel Dashboard 中检查以下环境变量是否已配置：

1. **DATABASE_URL** - PostgreSQL 数据库连接字符串
   - 格式：`postgresql://user:password@host:port/database?sslmode=require`
   - 这是必需的，用于 Prisma 连接数据库

2. **NEXTAUTH_SECRET** - NextAuth.js 加密密钥
   - 用于 JWT token 加密

3. **NEXTAUTH_URL** - NextAuth.js 回调 URL
   - 格式：`https://travis-blog.vercel.app`

4. **STORAGE_TYPE** - 存储类型
   - 值：`vercel-blob`（如果使用 Vercel Blob Storage）

5. **BLOB_READ_WRITE_TOKEN** - Vercel Blob Storage 读写令牌
   - 从 Vercel Dashboard > Storage > Blob Stores > travis-blog > Settings 获取

6. **BLOB_STORE_NAME** - Blob Store 名称
   - 值：`travis-blog`

### 2.2 配置步骤

1. **登录 Vercel Dashboard**
   - 访问 https://vercel.com/dashboard
   - 选择 `travis-blog` 项目

2. **进入项目设置**
   - 点击项目名称
   - 选择 "Settings" > "Environment Variables"

3. **添加 DATABASE_URL**
   - 点击 "Add New"
   - Name: `DATABASE_URL`
   - Value: 你的 PostgreSQL 数据库连接字符串
   - Environment: 选择 "Production"（以及 "Preview" 和 "Development" 如果需要）
   - 点击 "Save"

4. **验证其他环境变量**
   - 确保所有必需的环境变量都已配置
   - 参考上面的列表检查

5. **重新部署**
   - 配置环境变量后，Vercel 会自动触发重新部署
   - 或者手动触发：Deployments > 选择最新部署 > "Redeploy"

### 2.3 获取 DATABASE_URL

如果你使用的是 Neon PostgreSQL：

1. 登录 Neon Dashboard
2. 选择你的项目
3. 进入 "Connection Details"
4. 复制 "Connection String"
5. 格式：`postgresql://user:password@host:port/database?sslmode=require`

如果你使用的是其他 PostgreSQL 提供商，请参考其文档获取连接字符串。

---

## 3. 验证修复

配置完成后，验证步骤：

1. **等待 Vercel 重新部署完成**
2. **访问媒体管理页面**
   - URL: `https://travis-blog.vercel.app/admin/media`
   - 应该正常显示媒体文件列表，不再出现错误

3. **测试功能**
   - 验证媒体文件列表正常显示
   - 验证图片预览功能
   - 验证删除功能（如果文件未在文章中使用）

---

## 4. 相关文件

- `app/api/media/route.ts` - 媒体文件列表 API
- `app/api/media/[path]/route.ts` - 媒体文件删除 API
- `lib/utils/media.ts` - 文件使用检查函数（使用 Prisma）
- `lib/db/prisma.ts` - Prisma Client 初始化（需要 DATABASE_URL）

---

## 5. 注意事项

- **环境变量安全性：** `DATABASE_URL` 包含敏感信息，不要提交到 Git
- **环境变量作用域：** 确保在正确的环境（Production/Preview/Development）中配置
- **重新部署：** 修改环境变量后需要重新部署才能生效

---

**修复状态：** 
- ✅ 代码修复已完成
- ⏳ 等待 Vercel 环境变量配置

**下一步：** 在 Vercel Dashboard 中配置 `DATABASE_URL` 环境变量，然后重新部署。

