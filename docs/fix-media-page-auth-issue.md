# 修复媒体管理页面认证问题

**问题日期：** 2025-11-17  
**状态：** ✅ 已修复

---

## 📋 问题描述

媒体管理页面 (`/admin/media`) 点击后提示"请先登录"，即使管理员用户已登录。

**问题表现：**
- 管理员用户登录后访问 `/admin/media`
- 页面显示"请先登录"错误提示
- API 请求返回 401 Unauthorized

---

## 🔍 问题分析

### 根本原因

1. **中间件在 Edge Runtime 中运行**
   - Next.js 中间件默认在 Edge Runtime 中运行
   - `getToken` 在 Vercel 的 Edge Runtime 中可能无法正常工作
   - 这导致中间件无法正确验证用户身份

2. **与 `/api/upload` 相同的问题**
   - 之前 `/api/upload` 也遇到了相同的问题
   - 解决方案是将路由从中间件保护中移除，让 API 路由自己处理认证

3. **API 路由已实现认证**
   - `app/api/media/route.ts` 已使用 `getUserFromRequestOrHeaders` 和 `getServerSession` 作为后备
   - API 路由在 Node.js 运行时中运行（`export const runtime = "nodejs"`）
   - Node.js 运行时中 `getServerSession` 可以正常工作

---

## 🔧 解决方案

### 1. 从中间件保护中移除 `/api/media`

更新 `middleware.ts`：

```typescript
const apiProtectionRules: ApiProtectionRule[] = [
  // ... 其他规则
  // Note: /api/upload and /api/media are handled in the API routes themselves, not in middleware
  // This avoids Edge Runtime limitations with getToken
  // { prefix: "/api/upload", requiresAdmin: true },
  // { prefix: "/api/media", requiresAdmin: true },
];
```

### 2. API 路由自行处理认证

`app/api/media/route.ts` 已实现完整的认证逻辑：

```typescript
export async function GET(request: NextRequest) {
  // Try multiple methods to get user information
  // 1. First try getUserFromRequestOrHeaders (handles headers and token reading)
  let user = await getUserFromRequestOrHeaders(request, request.headers);
  
  // 2. If that fails, try getServerSession as fallback
  if (!user) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        };
      }
    } catch (error) {
      console.error("Error getting session in GET /api/media:", error);
    }
  }

  // Check if user is authenticated and has ADMIN role
  const adminError = requireAdmin(user);
  if (adminError) {
    return adminError;
  }
  
  // ... 处理请求
}
```

### 3. 确保 Node.js 运行时

API 路由已配置为在 Node.js 运行时中运行：

```typescript
export const runtime = "nodejs";
```

---

## ✅ 修复结果

- ✅ 中间件不再拦截 `/api/media` 请求
- ✅ API 路由在 Node.js 运行时中处理认证
- ✅ `getServerSession` 可以正常工作
- ✅ 管理员用户可以正常访问媒体管理页面

---

## 📝 相关文件

- `middleware.ts` - 从保护规则中移除 `/api/media`
- `app/api/media/route.ts` - 已实现完整的认证逻辑
- `app/api/media/[path]/route.ts` - 已实现完整的认证逻辑

---

## 🎯 最佳实践

### 处理 Edge Runtime 限制

1. **识别需要 Prisma/数据库的 API 路由**
   - 如果 API 路由需要访问数据库，应该在 Node.js 运行时中运行
   - 使用 `export const runtime = "nodejs"` 确保 Node.js 运行时

2. **从中间件保护中移除**
   - 如果中间件在 Edge Runtime 中无法正确验证，从中间件保护中移除
   - 让 API 路由自己处理认证

3. **在 API 路由中实现认证**
   - 使用 `getUserFromRequestOrHeaders` 和 `getServerSession` 作为后备
   - 确保认证逻辑在 Node.js 运行时中执行

---

## 🔗 相关修复

- `/api/upload` - 使用了相同的解决方案
- 会话管理问题修复 - 使用 Server Components 和 Server Actions

---

**最后更新：** 2025-11-17  
**负责人：** Dev

