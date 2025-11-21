# Next.js 环境变量最佳实践

**日期：** 2025-01-20  
**目的：** 解释为什么使用 `.env.local` 而不是 `.env`

---

## 📋 Next.js 环境变量加载顺序

Next.js 按照以下顺序加载环境变量文件（后面的会覆盖前面的）：

1. `.env` - 所有环境的默认值
2. `.env.local` - 本地覆盖值（**所有环境，但被 Git 忽略**）
3. `.env.development` - 开发环境特定值
4. `.env.development.local` - 开发环境本地覆盖值（**被 Git 忽略**）
5. `.env.production` - 生产环境特定值
6. `.env.production.local` - 生产环境本地覆盖值（**被 Git 忽略**）

---

## 🔍 `.env` vs `.env.local` 的区别

### `.env` 文件

**特点：**
- ✅ 可以提交到 Git 仓库
- ✅ 适合存储**非敏感**的默认配置
- ✅ 团队成员共享的配置
- ⚠️ **不应该包含敏感信息**（API 密钥、密码等）

**使用场景：**
```bash
# .env - 可以提交到 Git
NEXT_PUBLIC_APP_NAME=Travis Blog
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://localhost:5432/travis-blog  # 本地开发默认值
```

---

### `.env.local` 文件

**特点：**
- ✅ **被 Git 忽略**（在 `.gitignore` 中）
- ✅ 适合存储**敏感信息**（API 密钥、密码等）
- ✅ 每个开发者可以有不同的配置
- ✅ 不会意外提交到代码仓库

**使用场景：**
```bash
# .env.local - 不提交到 Git
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx  # 敏感信息
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx  # 敏感信息
NEXTAUTH_SECRET=your-secret-key-here      # 敏感信息
DATABASE_URL=postgresql://user:pass@host/db  # 个人数据库连接
```

---

## 🔒 安全考虑

### 为什么敏感信息要用 `.env.local`？

1. **防止泄露：**
   - `.env.local` 在 `.gitignore` 中，不会被提交到 Git
   - 即使误操作，也不会泄露敏感信息

2. **个人配置：**
   - 每个开发者可以有不同的 API 密钥
   - 不会影响其他团队成员

3. **环境隔离：**
   - 开发、测试、生产环境可以使用不同的配置
   - 避免配置冲突

---

## 📝 最佳实践

### 推荐的文件结构

```
项目根目录/
├── .env                    # 非敏感的默认配置（可以提交）
├── .env.local              # 敏感信息和个人配置（不提交）
├── .env.example            # 配置示例文件（可以提交）
└── .gitignore              # 包含 .env.local
```

### `.env` 文件内容（可以提交到 Git）

```bash
# 应用配置（非敏感）
NEXT_PUBLIC_APP_NAME=Travis Blog
NEXT_PUBLIC_API_URL=http://localhost:3000

# 数据库配置（本地开发默认值，非生产环境）
DATABASE_URL=postgresql://localhost:5432/travis-blog

# 其他非敏感配置
NODE_ENV=development
```

### `.env.local` 文件内容（不提交到 Git）

```bash
# 敏感信息 - 个人配置
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# 个人数据库连接（如果需要）
DATABASE_URL=postgresql://your-personal-db-url

# 其他个人配置
RESEND_FROM_EMAIL=Travis Blog <onboarding@resend.dev>
```

### `.env.example` 文件（可以提交到 Git）

```bash
# 这是一个配置示例文件
# 复制此文件为 .env.local 并填写实际值

# Resend 配置
RESEND_API_KEY=your-resend-api-key-here
RESEND_FROM_EMAIL=Travis Blog <onboarding@resend.dev>

# NextAuth 配置
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 数据库配置
DATABASE_URL=your-database-url-here
```

---

## ✅ 检查您的项目配置

### 1. 检查 `.gitignore`

确保 `.gitignore` 包含：
```
.env*.local
.env.local
.env.development.local
.env.production.local
```

### 2. 检查是否已有 `.env` 文件

如果项目中已有 `.env` 文件：
- ✅ 可以保留，用于非敏感配置
- ✅ 敏感信息应该移到 `.env.local`
- ✅ 确保 `.env.local` 在 `.gitignore` 中

### 3. 创建 `.env.example`（推荐）

创建一个 `.env.example` 文件作为配置模板：
- ✅ 可以提交到 Git
- ✅ 新团队成员可以参考
- ✅ 不包含真实密钥

---

## 🎯 回答您的问题

> "为什么要配置在 `.env.local` 而不是 `.env`？"

**答案：**

1. **安全性：**
   - `.env.local` 在 `.gitignore` 中，不会被提交到 Git
   - 防止 API 密钥等敏感信息泄露

2. **个人配置：**
   - 每个开发者可以有不同的配置
   - 不会影响其他团队成员

3. **最佳实践：**
   - Next.js 官方推荐敏感信息使用 `.env.local`
   - `.env` 用于非敏感的默认配置

---

## 📚 Next.js 官方文档

根据 [Next.js 官方文档](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)：

> **`.env.local`** - 本地覆盖值。在所有环境中加载，除了测试环境。**应该被 Git 忽略**。

> **`.env`** - 所有环境的默认值。**可以提交到 Git**。

---

## 💡 实际使用建议

### 对于您的项目

**推荐配置：**

1. **`.env`**（可以提交到 Git）
   ```bash
   # 非敏感配置
   NEXT_PUBLIC_APP_NAME=Travis Blog
   ```

2. **`.env.local`**（不提交到 Git）
   ```bash
   # 敏感信息
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=Travis Blog <onboarding@resend.dev>
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL=your-database-url
   ```

3. **`.env.example`**（可以提交到 Git）
   ```bash
   # 配置示例，供团队成员参考
   RESEND_API_KEY=your-resend-api-key-here
   # ... 其他配置
   ```

---

## ⚠️ 重要提示

### 如果已经使用了 `.env` 文件

**不要担心！** 您可以：

1. **保留 `.env` 文件** - 用于非敏感配置
2. **创建 `.env.local`** - 将敏感信息移到这里
3. **确保 `.env.local` 在 `.gitignore` 中**

Next.js 会同时加载两个文件，`.env.local` 中的值会覆盖 `.env` 中的值。

---

## ✅ 总结

**为什么使用 `.env.local`：**
- ✅ 更安全（不会被提交到 Git）
- ✅ 适合存储敏感信息
- ✅ 个人配置不会影响团队
- ✅ Next.js 官方推荐的最佳实践

**`.env` 的用途：**
- ✅ 存储非敏感的默认配置
- ✅ 可以提交到 Git 供团队共享
- ✅ 作为配置模板

**推荐做法：**
- 敏感信息 → `.env.local`
- 非敏感配置 → `.env`
- 配置模板 → `.env.example`

---

**需要我帮您检查项目的 `.gitignore` 配置吗？**

