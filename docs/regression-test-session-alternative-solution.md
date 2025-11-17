# 会话管理问题 - 替代解决方案

**问题状态：** 🔴 未解决  
**最后测试时间：** 2025-01-XX  
**环境：** Vercel 生产环境

---

## 问题总结

### 当前问题
- 客户端组件中的 `fetch` 请求返回 401 未授权错误
- 尽管用户已登录（页面布局正常显示用户名），但 API 请求失败
- 已尝试的修复均未成功：
  1. ✅ 添加 `credentials: "include"` 到所有 fetch 请求
  2. ✅ 修复 cookie secure 配置
  3. ✅ 添加中间件调试日志
  4. ❌ 尝试添加 `trustHost: true`（但该选项在 v4.24 中不支持）

---

## 替代解决方案

### 方案 1: 使用 Server Components 获取数据（推荐）

**优势：**
- Server Components 在服务器端运行，可以直接访问 session
- 不需要通过 cookie 传递认证信息
- 性能更好（减少客户端 JavaScript）

**实现方式：**
1. 将 `app/admin/articles/page.tsx` 改为 Server Component
2. 使用 `getServerSession` 获取 session
3. 直接从数据库获取数据（使用 Prisma）
4. 将数据传递给 Client Component 进行交互

**示例代码：**
```typescript
// app/admin/articles/page.tsx (Server Component)
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db/prisma";
import ArticlesListClient from "./ArticlesListClient";

export default async function ArticlesListPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 直接从数据库获取数据
  const articles = await prisma.article.findMany({
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <ArticlesListClient initialArticles={articles} />;
}
```

**需要修改的文件：**
- `app/admin/articles/page.tsx` - 改为 Server Component
- 创建 `app/admin/articles/ArticlesListClient.tsx` - Client Component 处理交互

---

### 方案 2: 使用 Server Actions

**优势：**
- 保持 Client Component 的交互性
- Server Actions 在服务器端运行，可以访问 session
- 不需要 API 路由

**实现方式：**
1. 创建 Server Actions 来获取数据
2. 在 Client Component 中调用 Server Actions

**示例代码：**
```typescript
// app/admin/articles/actions.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db/prisma";

export async function getArticles() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return await prisma.article.findMany({
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
```

---

### 方案 3: 检查 NEXTAUTH_URL 环境变量

**可能的问题：**
- Vercel 环境变量 `NEXTAUTH_URL` 可能未正确设置
- Cookie 域名可能不匹配

**检查步骤：**
1. 在 Vercel Dashboard 中检查 `NEXTAUTH_URL` 环境变量
2. 确保值设置为 `https://travis-blog.vercel.app`
3. 重新部署

---

### 方案 4: 使用 Authorization Header（不推荐）

**说明：**
- 需要修改客户端和服务器端的认证方式
- 不符合 NextAuth 的标准用法
- 需要大量重构

---

## 推荐方案

**推荐使用方案 1（Server Components）**，因为：
1. 符合 Next.js App Router 的最佳实践
2. 性能更好
3. 不需要处理 cookie 传递问题
4. 代码更简洁

---

## 实施计划

### 步骤 1: 重构文章列表页面
1. 将 `app/admin/articles/page.tsx` 改为 Server Component
2. 创建 `ArticlesListClient.tsx` Client Component
3. 将数据获取逻辑移到 Server Component

### 步骤 2: 测试
1. 部署重构后的代码
2. 测试文章列表加载
3. 测试其他功能（编辑、删除等）

### 步骤 3: 应用到其他页面
- `app/admin/articles/new/page.tsx` - 可能需要部分重构
- `app/admin/articles/[id]/edit/page.tsx` - 可能需要部分重构
- `app/admin/media/page.tsx` - 可能需要部分重构

---

**最后更新：** 2025-01-XX  
**下一步：** 实施方案 1（Server Components）

---

## 重构实施完成

### 实施时间：2025-01-XX

### 实施内容

1. **创建 Client Component**
   - 文件：`app/admin/articles/ArticlesListClient.tsx`
   - 功能：处理客户端交互（筛选、搜索、删除）
   - 接收数据：通过 props 从 Server Component 接收初始数据

2. **重构 Server Component**
   - 文件：`app/admin/articles/page.tsx`
   - 功能：
     - 使用 `getServerSession` 获取 session
     - 直接从数据库获取数据（使用 Prisma）
     - 将数据传递给 Client Component

### 代码结构

```
app/admin/articles/
├── page.tsx (Server Component)
│   ├── 获取 session
│   ├── 权限检查
│   ├── 从数据库获取数据
│   └── 渲染 ArticlesListClient
└── ArticlesListClient.tsx (Client Component)
    ├── 接收 initialArticles prop
    ├── 处理筛选和搜索
    ├── 处理删除操作
    └── 渲染 UI
```

### 优势

- ✅ **解决会话问题**：不需要通过 cookie 传递认证信息
- ✅ **性能提升**：减少客户端 JavaScript，数据在服务器端获取
- ✅ **符合最佳实践**：使用 Next.js App Router 的 Server Components 模式
- ✅ **代码更清晰**：分离关注点（数据获取 vs 交互逻辑）

### 测试计划

1. 部署重构后的代码
2. 测试文章列表加载
3. 测试筛选和搜索功能
4. 测试删除功能
5. 继续执行其他回归测试用例

---

**重构完成时间：** 2025-01-XX  
**等待部署和测试**

