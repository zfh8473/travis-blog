# Epic 5 留言板功能 - 调试指南

**日期：** 2025-11-17  
**问题：** React 错误 #418 持续出现  
**状态：** 🔍 调试中

---

## 🔍 调试步骤

### 1. 查看浏览器控制台

**打开开发者工具：**
1. 按 `F12` 或右键 → "检查"
2. 切换到 "Console" 标签

**查找日志：**
- `[CommentsSection] Raw API response:` - 原始 API 响应
- `[CommentsSection] Sanitized comments:` - 清理后的数据
- `[CommentItem] Rendering comment:` - 每个评论的渲染数据
- `[CommentsSection] Comment X content is not string:` - 非字符串字段警告

---

### 2. 检查网络请求

**步骤：**
1. 切换到 "Network" 标签
2. 刷新页面
3. 找到 `/api/comments?articleId=xxx` 请求
4. 点击查看 "Response" 标签
5. 检查返回的 JSON 数据

**检查项：**
- `content` 字段是否是字符串
- `authorName` 字段是否是字符串或 null
- `createdAt` 字段是否是 ISO 字符串
- `user.name` 字段是否是字符串或 null
- 嵌套的 `replies` 数组中的字段

---

### 3. 检查具体错误位置

**React 错误 #418 堆栈跟踪：**
```
at rK (ee1624d061c32b0f.js:19:45045)
at ee1624d061c32b0f.js:19:140968
```

**可能的位置：**
- CommentItem 组件渲染
- 嵌套 replies 渲染
- 某个字段直接渲染

---

## 📋 常见问题检查清单

### 检查 1: API 响应格式

**问题：** API 返回的数据格式不正确

**检查：**
```javascript
// 在浏览器控制台执行
fetch('/api/comments?articleId=YOUR_ARTICLE_ID')
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data);
    // 检查 data.data 数组中的每个评论
    data.data.forEach((comment, i) => {
      console.log(`Comment ${i}:`, {
        content: comment.content,
        contentType: typeof comment.content,
        authorName: comment.authorName,
        authorNameType: typeof comment.authorName,
      });
    });
  });
```

---

### 检查 2: 嵌套 Replies

**问题：** 嵌套的 replies 可能包含无效数据

**检查：**
```javascript
// 在浏览器控制台执行
// 检查嵌套 replies
const checkReplies = (comment, depth = 0) => {
  console.log(`${'  '.repeat(depth)}Comment:`, {
    id: comment.id,
    content: comment.content,
    contentType: typeof comment.content,
  });
  if (comment.replies && Array.isArray(comment.replies)) {
    comment.replies.forEach(reply => checkReplies(reply, depth + 1));
  }
};

// 获取评论数据
fetch('/api/comments?articleId=YOUR_ARTICLE_ID')
  .then(r => r.json())
  .then(data => {
    data.data.forEach(comment => checkReplies(comment));
  });
```

---

### 检查 3: 组件渲染

**问题：** 组件在数据未准备好时渲染

**检查：**
- 查看 `[CommentItem] Rendering comment:` 日志
- 检查是否有 `undefined` 或 `null` 值
- 检查是否有对象或数组被直接渲染

---

## 🐛 可能的问题和解决方案

### 问题 1: API 返回 null/undefined 值

**症状：** API 响应中某些字段是 `null` 或 `undefined`

**解决方案：**
- 已在 API Route 中添加 `String()` 转换
- 已在客户端添加数据清理

---

### 问题 2: 嵌套 Replies 数据不完整

**症状：** 嵌套的 replies 中某些字段缺失

**解决方案：**
- 已添加递归数据清理
- 已添加数组类型检查

---

### 问题 3: 日期格式化返回非字符串

**症状：** `format()` 函数可能返回非字符串值

**解决方案：**
- 已添加 `safeFormattedDate` 双重检查
- 已添加错误处理

---

### 问题 4: 条件渲染问题

**症状：** 某些条件渲染可能导致非字符串值

**解决方案：**
- 已添加 `safeAuthorName` 检查
- 已确保所有渲染值都是字符串

---

## 🔧 临时解决方案

如果问题持续，可以尝试：

### 方案 1: 禁用留言功能（临时）

在 `app/articles/[slug]/page.tsx` 中注释掉：
```tsx
{/* <CommentsSection articleId={article.id} /> */}
```

### 方案 2: 使用开发模式查看详细错误

**步骤：**
1. 在 Vercel 环境变量中设置 `NODE_ENV=development`
2. 重新部署
3. 查看非最小化的错误信息

---

## 📊 调试信息收集

### 需要收集的信息

1. **浏览器控制台日志**
   - 复制所有 `[CommentsSection]` 和 `[CommentItem]` 日志
   - 复制 React 错误堆栈

2. **网络请求响应**
   - 复制 `/api/comments` 的响应 JSON
   - 检查是否有异常数据

3. **页面状态**
   - 是否有留言显示？
   - 错误发生在什么时候？（页面加载时/提交留言后）

---

## 🚀 下一步

1. **部署最新代码**（已推送）
2. **查看浏览器控制台日志**
3. **检查网络请求响应**
4. **根据日志定位问题**
5. **修复具体问题**

---

**最后更新：** 2025-11-17  
**状态：** 🔍 等待调试信息

