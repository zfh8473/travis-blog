# 修复文章阅读数计数问题

**问题日期：** 2025-11-17  
**状态：** 🔴 调查中

---

## 📋 问题描述

**问题表现：**
- 文章详情页面显示阅读数，但点击多次后阅读数仍然是 0
- 阅读数不会随着页面访问而增加

**自动化测试结果：**
1. ✅ API 路由存在：`/api/articles/[slug]/views`
2. ❌ API 请求没有被触发（测试中 `viewCountRequest` 为 null）
3. ❌ `[data-article-views]` 元素未找到
4. ❌ API 调用次数为 0
5. ❌ 直接调用 API 返回 500 Internal Server Error

---

## 🔍 问题分析

### 1. API 路由问题

**测试结果：**
```bash
curl -X POST http://localhost:3000/api/articles/server-printer/views
# 返回: Internal Server Error
```

**可能原因：**
- Next.js 动态路由参数解析问题
- Prisma 查询失败
- 数据库连接问题

### 2. 客户端组件问题

**测试结果：**
- `ArticleViewCounter` 组件没有触发 API 调用
- 组件可能没有正确渲染

**可能原因：**
- Client Component 在 Server Component 中的渲染问题
- `useEffect` 没有正确执行
- 组件被 Suspense 边界阻止

### 3. DOM 元素问题

**测试结果：**
- `[data-article-views]` 元素未找到

**可能原因：**
- `data-article-views` 属性没有正确添加到 DOM
- 元素选择器不正确

---

## 🔧 修复方案

### 方案 1: 修复 API 路由参数解析

**问题：** Next.js 15 中动态路由参数是 Promise

**修复：**
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params; // ✅ 正确：await params
  // ...
}
```

### 方案 2: 确保 Client Component 正确渲染

**问题：** Client Component 可能被 Suspense 阻止

**修复：**
- 将 `ArticleViewCounter` 移到 Suspense 边界外
- 或者确保它在正确的渲染位置

### 方案 3: 添加调试日志

**添加详细的日志：**
- API 路由中添加请求日志
- 客户端组件中添加执行日志
- 测试中添加网络请求监控

---

## 📝 测试计划

### 自动化测试

1. ✅ 创建 E2E 测试：`tests/e2e/article-view-count.spec.ts`
2. ✅ 测试 API 路由是否可访问
3. ✅ 测试客户端组件是否触发 API 调用
4. ✅ 测试 DOM 元素是否正确显示
5. ✅ 测试阅读数是否正确增加

### 手动测试

1. 打开浏览器开发者工具
2. 访问文章详情页面
3. 检查 Network 标签页是否有 `/api/articles/[slug]/views` 请求
4. 检查 Console 是否有错误或日志
5. 检查阅读数是否更新

---

## 🎯 下一步

1. **修复 API 路由 500 错误**
   - 检查服务器日志
   - 修复参数解析问题
   - 测试 API 路由

2. **修复客户端组件**
   - 确保组件正确渲染
   - 添加调试日志
   - 测试 API 调用

3. **验证修复**
   - 运行自动化测试
   - 手动测试阅读数功能
   - 确认阅读数正确增加

---

---

## ✅ 修复记录

### 2025-11-17: 修复中间件拦截问题

**问题：**
- `/api/articles/[slug]/views` 被中间件拦截，返回 401 错误
- 中间件配置中 `/api/articles` 需要管理员权限，但阅读数端点是公开的

**修复：**
- 在 `getMatchingRule` 函数中添加特殊处理，排除 `/api/articles/[slug]/views` 路径
- 使用正则表达式匹配动态路由：`/^\/api\/articles\/[^/]+\/views$/`

**代码变更：**
```typescript
// middleware.ts
// Special case: exclude /api/articles/[slug]/views (public endpoint for view counting)
if (pathname.match(/^\/api\/articles\/[^/]+\/views$/)) {
  continue;
}
```

**最后更新：** 2025-11-17  
**负责人：** Dev

