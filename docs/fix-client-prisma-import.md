# 修复客户端组件导入 Prisma 的问题

**问题日期：** 2025-11-17  
**状态：** ✅ 已修复

---

## 📋 问题描述

媒体管理页面 (`/admin/media`) 显示错误："Application error: a client-side exception has occurred"，控制台显示 "DATABASE_URL environment variable is not set"。

**根本原因：**
- `app/admin/media/page.tsx` 是一个 Client Component（`"use client"`）
- 它导入了 `formatFileSize` 和 `isImage` 从 `@/lib/utils/media.ts`
- `lib/utils/media.ts` 在顶层导入了 `prisma`：
  ```typescript
  import { prisma } from "@/lib/db/prisma";
  ```
- Next.js 在打包客户端代码时，会尝试解析所有导入，即使客户端组件只使用了部分导出
- 这导致 Prisma 被包含在客户端 bundle 中
- Prisma 在初始化时需要 `DATABASE_URL` 环境变量，但客户端无法访问服务器端环境变量
- 因此客户端抛出错误："DATABASE_URL environment variable is not set"

---

## 🔧 解决方案

### 1. 创建客户端安全的工具文件

创建 `lib/utils/media-client.ts`，包含客户端安全的工具函数：

```typescript
/**
 * Client-side media utility functions.
 * 
 * These functions are safe to use in Client Components as they don't
 * import any server-side dependencies like Prisma.
 */

export function formatFileSize(bytes: number): string {
  // ... 实现
}

export function isImage(mimeType: string): boolean {
  // ... 实现
}
```

### 2. 更新客户端组件导入

更新 `app/admin/media/page.tsx`：

```typescript
// 之前
import { formatFileSize, isImage } from "@/lib/utils/media";

// 之后
import { formatFileSize, isImage } from "@/lib/utils/media-client";
```

### 3. 添加警告注释

在 `lib/utils/media.ts` 添加警告注释：

```typescript
/**
 * ⚠️ WARNING: This file contains server-side functions that use Prisma.
 * 
 * Do NOT import this file in Client Components. Use `lib/utils/media-client.ts`
 * for client-safe utility functions like `formatFileSize` and `isImage`.
 */
```

### 4. 更新测试文件

更新 `tests/__tests__/unit/media-library.test.tsx` 使用新的导入路径。

---

## ✅ 修复结果

- ✅ 客户端组件不再导入包含 Prisma 的模块
- ✅ Prisma 不会被包含在客户端 bundle 中
- ✅ 客户端不再尝试初始化 Prisma
- ✅ 媒体管理页面应该可以正常加载

---

## 📝 相关文件

- `lib/utils/media-client.ts` - 新建，客户端安全的工具函数
- `app/admin/media/page.tsx` - 更新导入路径
- `lib/utils/media.ts` - 添加警告注释
- `tests/__tests__/unit/media-library.test.tsx` - 更新测试 mock

---

## 🎯 最佳实践

### 避免在客户端组件中导入服务器端代码

1. **分离客户端和服务器端工具函数**
   - 创建 `*-client.ts` 文件用于客户端安全的函数
   - 服务器端函数保留在原始文件中

2. **使用明确的命名约定**
   - `*-client.ts` - 客户端安全
   - 原始文件 - 服务器端（可能包含 Prisma 等）

3. **添加警告注释**
   - 在服务器端文件中添加警告，提醒不要从客户端组件导入

4. **代码审查检查**
   - 检查 Client Components 是否导入了包含 Prisma 的模块
   - 使用 ESLint 规则或代码审查工具检查

---

**最后更新：** 2025-11-17  
**负责人：** Dev

