# 需求差距分析：留言功能和权限控制

**创建日期：** 2025-11-12  
**分析人员：** 产品经理、架构师、开发人员  
**目的：** 对比用户需求与 PRD 文档，识别差距并制定修复方案

---

## 用户提出的三个需求点

### 需求 1：未登录用户留言
**用户要求：**
- 未登录用户可以浏览文章
- 未登录用户可以留言
- 留言内容要被系统识别为"访客留言"

### 需求 2：登录普通用户留言
**用户要求：**
- 登录的普通用户可以在留言中显示用户名
- "发布文章"按钮对于普通用户不可见

### 需求 3：管理员权限
**用户要求：**
- 管理员用户可以看到"发布文章"按钮

---

## PRD 文档中的相关定义

### FR-4.1 留言功能
**PRD 定义：**
- 读者可以发表留言
- 留言显示在文章下方
- 留言包含作者、内容、时间
- **支持未登录用户留言（可选）** ✅

### FR-1.3 用户角色管理
**PRD 定义：**
- **普通用户：可以注册、登录、留言** ✅
- **管理员（博主）：可以注册、登录、留言、编辑文章、管理后台** ✅
- 角色权限控制正确

### FR-4.1 留言功能（详细）
**PRD 接受标准：**
- 读者可以发表留言 ✅
- 留言显示在文章下方 ✅
- 留言包含作者、内容、时间 ✅
- **支持未登录用户留言（可选）** ✅

---

## 现有实现检查

### ✅ 已实现的功能

#### 1. 未登录用户留言功能
- **实现状态：** ✅ 已实现
- **证据：**
  - `lib/actions/comment.ts:183` - 支持 `userId = null` 的匿名留言
  - `lib/validations/comment.ts:41-45` - 验证 schema 支持 `authorName`（匿名用户）
  - `components/comment/CommentForm.tsx:147-156` - 未登录用户显示姓名输入框
  - `components/comment/CommentItem.tsx:60` - 显示 `authorName` 或 `user.name`
  - `prisma/schema.prisma:170` - Comment 模型包含 `authorName` 字段

#### 2. 登录用户留言功能
- **实现状态：** ✅ 已实现
- **证据：**
  - `lib/actions/comment.ts:183` - 支持 `userId` 的登录用户留言
  - `components/comment/CommentForm.tsx:74` - 登录用户自动填充姓名
  - `components/comment/CommentItem.tsx:60` - 显示 `user.name`（登录用户）
  - `components/comment/CommentItem.tsx:63` - 显示 `user.image`（登录用户头像）

#### 3. "发布文章"按钮权限控制
- **实现状态：** ✅ 已实现
- **证据：**
  - `components/layout/NavigationBarClient.tsx:203` - 只有 `isAuthenticated && isAdmin` 时显示完整按钮
  - `components/layout/NavigationBarClient.tsx:210-218` - 非管理员用户看到禁用状态的按钮（`opacity-75`）
  - `components/layout/NavigationBar.tsx:23` - 服务器端检查 `session?.user?.role === Role.ADMIN`

---

## ❌ 发现的差距

### 差距 1：访客留言标识不明确

**问题描述：**
- 用户要求未登录用户的留言应该被明确标识为"访客留言"
- 当前实现：未登录用户留言显示 `authorName`（用户输入的姓名），但没有明确标识为"访客"
- **位置：** `components/comment/CommentItem.tsx:60`

**当前实现：**
```typescript
const authorName = comment.user?.name || comment.authorName || "匿名用户";
```

**用户期望：**
- 未登录用户的留言应该显示为"访客：{用户输入的姓名}" 或 "访客留言"
- 或者使用更明确的标识，如"访客"标签

**影响：**
- **严重程度：** 中
- **用户体验：** 用户无法明确区分访客留言和登录用户留言
- **业务影响：** 可能影响留言的可信度和互动体验

---

### 差距 2："发布文章"按钮对普通用户可见性

**问题描述：**
- 用户要求："发布文章"按钮对于普通用户**不可见**
- 当前实现：普通用户可以看到"发布文章"按钮，但处于禁用状态（`opacity-75`）
- **位置：** `components/layout/NavigationBarClient.tsx:210-218`

**当前实现：**
```typescript
) : (
  <Link
    href={isAuthenticated ? "/admin/articles/new" : "/login?callbackUrl=/admin/articles/new"}
    className="... opacity-75"
    title={!isAuthenticated ? "请先登录" : !isAdmin ? "需要管理员权限" : ""}
  >
    发布文章
  </Link>
)
```

**用户期望：**
- 普通用户（非管理员）不应该看到"发布文章"按钮
- 只有管理员用户才应该看到"发布文章"按钮

**影响：**
- **严重程度：** 高
- **用户体验：** 普通用户看到无法使用的功能，造成困惑
- **业务影响：** 不符合权限控制的最佳实践

---

## 修复方案

### 修复 1：访客留言标识

**方案 A：在留言显示中添加"访客"标签（推荐）**

**实现：**
1. 修改 `components/comment/CommentItem.tsx`
2. 在未登录用户留言时，显示"访客"标签或"访客：{姓名}"

**代码修改：**
```typescript
// 在 CommentItem.tsx 中
const isGuest = !comment.user && comment.authorName;
const displayName = isGuest 
  ? `访客：${comment.authorName}` 
  : (comment.user?.name || "匿名用户");
```

**方案 B：使用视觉标识（如徽章）**

**实现：**
1. 在留言项中添加"访客"徽章
2. 使用不同的样式区分访客留言和登录用户留言

**推荐：** 方案 A（简单直接，符合用户期望）

---

### 修复 2："发布文章"按钮可见性

**方案：条件渲染（推荐）**

**实现：**
1. 修改 `components/layout/NavigationBarClient.tsx`
2. 只有管理员用户才渲染"发布文章"按钮
3. 普通用户完全不显示该按钮

**代码修改：**
```typescript
{/* 发布文章按钮 - 仅管理员可见 */}
{isAuthenticated && isAdmin && (
  <Link
    href="/admin/articles/new"
    className="..."
  >
    发布文章
  </Link>
)}
```

**影响：**
- 简化代码逻辑
- 符合权限控制最佳实践
- 提升用户体验（不显示无法使用的功能）

---

## 实施计划

### 优先级

1. **高优先级：** 修复"发布文章"按钮可见性（差距 2）
   - 影响用户体验和权限控制
   - 实施简单，风险低

2. **中优先级：** 访客留言标识（差距 1）
   - 提升用户体验
   - 实施简单，风险低

### 实施步骤

1. **架构师审查：** 确认修复方案符合架构设计
2. **开发人员实施：** 按照修复方案修改代码
3. **测试验证：** 确保修复后功能正常
4. **产品经理验收：** 确认符合用户需求

---

## 结论

**PRD 文档覆盖情况：**
- ✅ PRD 文档中已定义未登录用户留言功能（FR-4.1）
- ✅ PRD 文档中已定义用户角色和权限（FR-1.3）
- ⚠️ PRD 文档中**未明确**要求访客留言的标识方式
- ⚠️ PRD 文档中**未明确**要求"发布文章"按钮对普通用户不可见

**建议：**
1. **立即修复：** "发布文章"按钮可见性问题（高优先级）
2. **尽快修复：** 访客留言标识问题（中优先级）
3. **更新 PRD：** 在 PRD 文档中明确这些细节要求，避免后续误解

---

**下一步：**
1. 产品经理确认修复方案
2. 架构师审查技术方案
3. 开发人员实施修复
4. 测试验证
5. 更新 PRD 文档（如需要）

