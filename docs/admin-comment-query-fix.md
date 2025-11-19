# 管理员未读评论查询修复

**创建日期：** 2025-01-XX  
**问题：** 游客评论未显示在未读评论列表中

---

## 🐛 问题描述

**症状：**
- 游客留言后，管理员登录仪表盘
- 仪表盘显示"所有评论都已阅读"，未显示游客的未读评论

**根本原因：**
查询条件 `userId: { not: user.id }` 无法正确包含游客评论（`userId = null`）。

在 Prisma 中，`{ not: user.id }` 只会排除 `userId = user.id` 的记录，但对于 `null` 值的处理可能不一致。

---

## ✅ 解决方案

**修改查询条件：**
使用 `OR` 条件明确包含：
1. 游客评论（`userId = null`）
2. 其他用户的评论（`userId != admin.id`）

**修改前：**
```typescript
where: {
  isRead: false,
  userId: {
    not: user.id, // 可能无法正确包含 null 值
  },
}
```

**修改后：**
```typescript
where: {
  isRead: false,
  OR: [
    { userId: null }, // Guest comments
    { userId: { not: user.id } }, // Comments from other users (not admin)
  ],
}
```

---

## 📝 修改的文件

1. **`app/api/admin/comments/unread/route.ts`**
   - 修改查询条件，使用 `OR` 包含游客评论和其他用户评论

2. **`app/api/admin/comments/unread-count/route.ts`**
   - 修改计数查询条件，使用 `OR` 包含游客评论和其他用户评论

---

## 🧪 测试验证

**测试场景：**
1. ✅ 游客创建评论 → 管理员应能看到未读评论
2. ✅ 非管理员用户创建评论 → 管理员应能看到未读评论
3. ✅ 管理员创建评论 → 管理员不应看到自己的评论
4. ✅ 混合场景：游客 + 非管理员用户 + 管理员 → 只显示游客和非管理员用户的评论

---

## ✅ 修复验证

- [x] 游客评论能正确显示在未读评论列表中
- [x] 非管理员用户评论能正确显示
- [x] 管理员自己的评论被正确排除
- [x] 未读评论数量准确

---

**修复状态：** ✅ 已完成

