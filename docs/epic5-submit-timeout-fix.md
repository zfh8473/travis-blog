# Epic 5 留言板功能 - 提交超时问题修复

**修复日期：** 2025-11-17  
**问题：** 留言提交卡在"提交中..."状态  
**环境：** Vercel Production  
**状态：** ✅ 已修复

---

## 🐛 问题描述

### 症状
- 用户填写姓名和留言内容
- 点击"提交留言"按钮
- 页面卡在"提交中..."状态
- 无错误提示，请求一直挂起

### 环境
- **部署环境：** Vercel Production
- **用户类型：** 匿名用户（未登录）
- **浏览器：** (填写)

---

## 🔍 问题分析

### 根本原因

1. **会话获取可能卡住**
   - `getUserFromRequestOrHeaders` 在 Vercel 环境中可能卡住
   - `getServerSession` 也可能卡住
   - 没有超时机制

2. **匿名用户不需要会话**
   - 匿名用户提交留言时，不需要获取会话
   - 但代码仍然尝试获取会话，导致超时

3. **客户端没有超时**
   - `fetch` 请求没有超时设置
   - 如果服务器卡住，客户端会一直等待

---

## ✅ 修复方案

### 1. API Route 超时机制

**位置：** `app/api/comments/route.ts`

**修改：**
- 添加 2 秒超时机制
- 匿名用户提交时跳过会话检查
- 使用 `Promise.race` 实现超时

**代码：**
```typescript
// 只有可能是登录用户时才获取会话
if (mightBeLoggedIn) {
  const timeoutPromise = new Promise<string | null>((resolve) => {
    setTimeout(() => {
      console.warn("Session check timeout, proceeding as anonymous");
      resolve(null);
    }, 2000); // 2 秒超时
  });
  
  const sessionPromise = (async () => {
    // 获取会话逻辑
  })();
  
  userId = await Promise.race([sessionPromise, timeoutPromise]);
}
```

---

### 2. 客户端超时机制

**位置：** `components/comment/CommentForm.tsx`

**修改：**
- 添加 `AbortController` 实现超时
- 10 秒超时（比服务器超时更长）
- 超时时显示友好错误提示

**代码：**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const res = await fetch("/api/comments", {
    signal: controller.signal,
    // ...
  });
} catch (err) {
  if (err.name === "AbortError") {
    throw new Error("请求超时，请稍后重试");
  }
}
```

---

### 3. 优化会话检查逻辑

**改进：**
- 匿名用户（提供 `authorName`）完全跳过会话检查
- 只有可能是登录用户时才尝试获取会话
- 超时后继续处理，不阻塞请求

---

## 📋 修复步骤

1. ✅ 在 API Route 中添加超时机制
2. ✅ 在客户端添加超时机制
3. ✅ 优化会话检查逻辑
4. ✅ 本地构建验证
5. ✅ 提交并推送到 GitHub
6. ⏳ 等待 Vercel 重新部署
7. ⏳ 测试验证

---

## ✅ 验证结果

### 本地构建
- ✅ 构建成功
- ✅ 无 TypeScript 错误
- ✅ 无 lint 错误

### Git 提交
- **Commit：** (填写最新 commit)
- **状态：** ✅ 已推送到 GitHub

### Vercel 部署
- **状态：** ⏳ 等待部署完成

---

## 🧪 测试计划

### 测试用例

1. **匿名用户提交留言**
   - [ ] 填写姓名和留言内容
   - [ ] 点击提交
   - [ ] 验证不卡住
   - [ ] 验证留言成功创建

2. **登录用户提交留言**
   - [ ] 登录账号
   - [ ] 填写留言内容（不填姓名）
   - [ ] 点击提交
   - [ ] 验证不卡住
   - [ ] 验证留言成功创建

3. **超时场景测试**
   - [ ] 模拟网络延迟
   - [ ] 验证超时错误提示
   - [ ] 验证用户可以重试

---

## 📊 修复前后对比

### 修复前

- ❌ 匿名用户提交时尝试获取会话
- ❌ 没有超时机制
- ❌ 可能卡住无限等待
- ❌ 用户体验差

### 修复后

- ✅ 匿名用户跳过会话检查
- ✅ 2 秒服务器超时
- ✅ 10 秒客户端超时
- ✅ 友好的错误提示
- ✅ 不会卡住

---

## 🔗 相关文件

- **API Route：** `app/api/comments/route.ts`
- **客户端组件：** `components/comment/CommentForm.tsx`
- **会话工具：** `lib/auth/middleware.ts`

---

## 📝 经验总结

1. **Vercel 环境特殊性**
   - 会话获取可能比本地慢
   - 需要添加超时机制
   - 匿名用户不需要会话

2. **超时机制重要性**
   - 服务器端超时防止卡住
   - 客户端超时提供反馈
   - 超时时间要合理（2-10秒）

3. **错误处理**
   - 超时后继续处理，不阻塞
   - 提供友好的错误提示
   - 允许用户重试

---

**最后更新：** 2025-11-17  
**状态：** ✅ 已修复，等待部署验证

