# 管理员评论通知功能 - 实施文档

**创建日期：** 2025-01-XX  
**作者：** Amelia (DEV)  
**状态：** 🚧 实施中

---

## 📋 实施进度

### ✅ 已完成

1. **数据库 Schema 修改**
   - ✅ 添加 `isRead`, `readAt`, `readBy` 字段
   - ✅ 添加索引优化查询
   - ⚠️ 需要运行 `prisma migrate dev` 创建迁移

2. **API 端点实现**
   - ✅ `GET /api/admin/comments/unread-count` - 获取未读评论数量
   - ✅ `GET /api/admin/comments/unread` - 获取未读评论列表
   - ✅ `PUT /api/admin/comments/[id]/read` - 标记评论为已读
   - ✅ `POST /api/comments` - 修改创建评论时设置 `isRead = false`

3. **前端组件实现**
   - ✅ `UnreadCommentsBadge` - 未读评论徽章组件
   - ✅ `UnreadCommentsList` - 未读评论列表组件
   - ✅ `CommentScrollHandler` - 评论锚点滚动处理组件

4. **管理后台集成**
   - ✅ 管理后台仪表板集成未读评论列表和徽章
   - ✅ 创建评论管理页面 `/admin/comments`
   - ✅ 管理后台导航添加"评论管理"链接

5. **文章页面集成**
   - ✅ 添加评论锚点滚动处理
   - ✅ 支持 `#comment-[id]` 锚点跳转

### ⚠️ 待完成

1. **数据库迁移**
   - ⚠️ 需要运行 `prisma migrate dev` 创建迁移文件
   - ⚠️ 需要运行 `prisma generate` 生成 Prisma 客户端

2. **测试**
   - ⚠️ 单元测试：评论创建和管理功能测试
   - ⚠️ 集成测试：完整流程测试
   - ⚠️ 回归测试：现有功能验证

---

## 🛠️ 实施步骤

### 步骤 1：数据库迁移

**重要：** 在生产环境执行前，请在测试环境充分测试！

```bash
# 1. 创建迁移文件（不执行）
npx prisma migrate dev --name add_comment_read_fields --create-only

# 2. 检查迁移文件内容
# 文件位置：prisma/migrations/[timestamp]_add_comment_read_fields/migration.sql

# 3. 在测试环境执行迁移
npx prisma migrate dev

# 4. 生成 Prisma 客户端
npx prisma generate
```

**迁移 SQL 内容（预期）：**
```sql
-- AlterTable
ALTER TABLE "comments" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "comments" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "comments" ADD COLUMN "readBy" TEXT;

-- CreateIndex
CREATE INDEX "comments_articleId_isRead_idx" ON "comments"("articleId", "isRead");
CREATE INDEX "comments_isRead_createdAt_idx" ON "comments"("isRead", "createdAt");
```

### 步骤 2：验证构建

```bash
# 验证 TypeScript 编译
npm run build
```

### 步骤 3：测试

**单元测试：**
```bash
npm test -- comment
```

**集成测试：**
```bash
npm test -- integration/comments
```

**E2E 测试：**
```bash
npm run test:e2e -- admin-comments
```

---

## 📝 文件清单

### 新增文件

1. `app/api/admin/comments/unread-count/route.ts` - 获取未读评论数量 API
2. `app/api/admin/comments/unread/route.ts` - 获取未读评论列表 API
3. `app/api/admin/comments/[id]/read/route.ts` - 标记评论为已读 API
4. `components/admin/UnreadCommentsBadge.tsx` - 未读评论徽章组件
5. `components/admin/UnreadCommentsList.tsx` - 未读评论列表组件
6. `components/article/CommentScrollHandler.tsx` - 评论锚点滚动处理组件
7. `app/admin/comments/page.tsx` - 评论管理页面

### 修改文件

1. `prisma/schema.prisma` - 添加 `isRead`, `readAt`, `readBy` 字段和索引
2. `app/api/comments/route.ts` - 创建评论时设置 `isRead = false`
3. `app/admin/page.tsx` - 集成未读评论列表和徽章
4. `components/admin/AdminNavigation.tsx` - 添加"评论管理"导航项
5. `app/articles/[slug]/page.tsx` - 添加评论锚点滚动处理

---

## ⚠️ 注意事项

### 数据库迁移

1. **备份数据库**：在执行迁移前，务必备份生产数据库
2. **测试环境验证**：在测试环境充分测试迁移
3. **低峰期执行**：在生产环境低峰期执行迁移
4. **回滚准备**：准备回滚脚本以防万一

### 代码部署

1. **分阶段部署**：
   - 第一步：部署数据库迁移
   - 第二步：部署后端 API
   - 第三步：部署前端组件

2. **功能开关**：可以考虑使用环境变量控制新功能显示

3. **监控**：部署后密切监控错误日志

---

## 🔄 下一步

1. **创建数据库迁移**：运行 `prisma migrate dev`
2. **生成 Prisma 客户端**：运行 `prisma generate`
3. **验证构建**：运行 `npm run build`
4. **编写测试**：创建单元测试和集成测试
5. **回归测试**：验证现有功能不受影响
6. **部署到测试环境**：在测试环境验证
7. **部署到生产环境**：确认无误后部署

---

**实施状态：** 核心功能已实现，等待数据库迁移和测试验证。

