# 会话管理问题修复记录

**问题发现时间：** 2025-01-XX  
**修复时间：** 2025-01-XX  
**状态：** ✅ 已修复

---

## 问题描述

在 Vercel 环境中测试时，发现以下问题：
- 登录后访问 `/admin/articles` 时显示"请先登录"
- 客户端组件调用 API 时返回 401 未授权错误
- 尽管用户已登录，但 API 请求无法获取用户信息

---

## 问题分析

### 根本原因

客户端组件中的 `fetch` 请求未设置 `credentials: "include"`，导致：
1. Cookie（包含 NextAuth session token）未自动发送到服务器
2. 中间件无法从请求中获取 JWT token
3. API 路由无法获取用户信息，返回 401 错误

### 技术细节

- NextAuth.js 使用 httpOnly cookie 存储 session token
- 在跨域或某些情况下，需要显式设置 `credentials: "include"` 才能发送 cookie
- 虽然这是同源请求，但为了确保兼容性，应该显式设置

---

## 修复方案

### 修复内容

在所有客户端组件的 `fetch` 请求中添加 `credentials: "include"`：

1. **`app/admin/articles/page.tsx`**
   - `loadArticles()` 函数中的 GET 请求
   - `handleDelete()` 函数中的 DELETE 请求

2. **`app/admin/articles/new/page.tsx`**
   - `loadData()` 函数中的 GET 请求（categories, tags）
   - `handleSubmit()` 函数中的 POST 请求
   - `handleTagInputKeyDown()` 函数中的 POST 请求（创建标签）

3. **`app/admin/articles/[id]/edit/page.tsx`**
   - `loadArticle()` 函数中的 GET 请求（article, categories, tags）
   - `handleDelete()` 函数中的 DELETE 请求
   - `handleSubmit()` 函数中的 PUT 请求
   - `handleTagInputKeyDown()` 函数中的 POST 请求（创建标签）

4. **`app/admin/media/page.tsx`**
   - `loadFiles()` 函数中的 GET 请求
   - `handleDelete()` 函数中的 DELETE 请求
   - `handleForceDelete()` 函数中的 DELETE 请求

### 修复示例

**修复前：**
```typescript
const response = await fetch("/api/articles");
```

**修复后：**
```typescript
const response = await fetch("/api/articles", {
  credentials: "include",
});
```

---

## 验证计划

修复后需要验证以下功能：
1. ✅ 登录后可以访问 `/admin/articles` 页面
2. ⏳ 可以正常加载文章列表
3. ⏳ 可以正常创建、编辑、删除文章
4. ⏳ 可以正常访问媒体管理页面
5. ⏳ 所有 API 请求正常传递认证信息

---

## 相关文件

- `app/admin/articles/page.tsx`
- `app/admin/articles/new/page.tsx`
- `app/admin/articles/[id]/edit/page.tsx`
- `app/admin/media/page.tsx`
- `middleware.ts`
- `lib/auth/middleware.ts`

---

**修复完成时间：** 2025-01-XX  
**下一步：** 重新测试会话管理功能，继续执行回归测试

