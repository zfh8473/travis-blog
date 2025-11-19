# 管理员评论通知功能 - 部署指南

**创建日期：** 2025-01-XX  
**状态：** 🚀 待部署

---

## 📋 部署前检查清单

### 代码检查

- [ ] 所有代码已提交到 Git
- [ ] 代码已通过 TypeScript 编译
- [ ] 代码已通过 ESLint 检查
- [ ] 所有测试用例通过
- [ ] 无已知严重 bug

### 数据库检查

- [ ] 数据库迁移文件已创建
- [ ] 迁移文件已测试（本地或测试环境）
- [ ] 数据库备份已创建
- [ ] 回滚方案已准备

### 环境配置

- [ ] Vercel 环境变量已配置
- [ ] DATABASE_URL 已配置
- [ ] NEXTAUTH_SECRET 已配置
- [ ] 其他必需环境变量已配置

---

## 🚀 部署步骤

### 步骤 1：推送代码到 GitHub

```bash
# 确认所有更改已提交
git status

# 推送到 main 分支
git push origin main
```

### 步骤 2：Vercel 自动部署

Vercel 会自动检测到新的提交并触发部署：

1. 访问 Vercel Dashboard
2. 查看部署状态
3. 等待构建完成

### 步骤 3：执行数据库迁移

**重要：** 在生产环境执行迁移前，请确保：

1. **备份数据库**
   ```bash
   # 使用 Neon 控制台或 CLI 备份数据库
   # 或使用 pg_dump
   ```

2. **在 Vercel 上执行迁移**
   
   选项 A：使用 Vercel CLI（推荐）
   ```bash
   # 安装 Vercel CLI（如果还没有）
   npm i -g vercel
   
   # 登录 Vercel
   vercel login
   
   # 链接项目
   vercel link
   
   # 执行迁移（使用生产环境变量）
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

   选项 B：使用 Neon 控制台
   - 访问 Neon Dashboard
   - 打开 SQL Editor
   - 执行迁移 SQL：
   ```sql
   -- 从 prisma/migrations/20250120120000_add_comment_read_fields/migration.sql
   ALTER TABLE "comments" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
   ALTER TABLE "comments" ADD COLUMN "readAt" TIMESTAMP(3);
   ALTER TABLE "comments" ADD COLUMN "readBy" TEXT;
   CREATE INDEX "comments_articleId_isRead_idx" ON "comments"("articleId", "isRead");
   CREATE INDEX "comments_isRead_createdAt_idx" ON "comments"("isRead", "createdAt");
   ```

3. **验证迁移成功**
   ```bash
   npx prisma migrate status
   ```

### 步骤 4：验证部署

1. **检查构建日志**
   - 访问 Vercel Dashboard
   - 查看构建日志
   - 确认无错误

2. **检查应用运行**
   - 访问生产环境 URL
   - 验证页面正常加载
   - 验证功能正常

3. **测试新功能**
   - 管理员登录
   - 访问管理后台
   - 验证未读评论功能
   - 创建测试评论
   - 验证评论通知功能

---

## 🔍 部署后验证

### 功能验证

- [ ] 管理后台可访问
- [ ] 未读评论数量正确显示
- [ ] 未读评论列表正确显示
- [ ] 点击评论跳转到文章页面
- [ ] 评论锚点滚动功能正常
- [ ] 标记评论为已读功能正常

### 回归验证

- [ ] 评论创建功能正常
- [ ] 评论回复功能正常
- [ ] 评论删除功能正常
- [ ] 文章创建/编辑功能正常
- [ ] 用户登录/登出功能正常

### 性能验证

- [ ] 页面加载时间正常
- [ ] API 响应时间正常
- [ ] 数据库查询性能正常

---

## 🐛 故障排查

### 问题 1：构建失败

**症状：** Vercel 构建失败

**可能原因：**
- TypeScript 编译错误
- 缺少依赖
- 环境变量未配置

**解决方案：**
1. 检查构建日志
2. 修复编译错误
3. 确认所有依赖已安装
4. 检查环境变量配置

### 问题 2：数据库迁移失败

**症状：** 迁移执行失败

**可能原因：**
- 数据库连接失败
- 表已存在
- 权限不足

**解决方案：**
1. 检查 DATABASE_URL
2. 检查数据库连接
3. 检查迁移 SQL 语法
4. 手动执行迁移（如果自动失败）

### 问题 3：功能不工作

**症状：** 新功能不工作

**可能原因：**
- 数据库迁移未执行
- Prisma Client 未更新
- 环境变量未配置

**解决方案：**
1. 确认迁移已执行
2. 重新生成 Prisma Client
3. 检查环境变量
4. 检查浏览器控制台错误

---

## 🔄 回滚方案

如果部署后发现问题，可以按以下步骤回滚：

### 代码回滚

1. **Git 回滚**
   ```bash
   # 回滚到上一个稳定版本
   git revert <commit-hash>
   git push origin main
   ```

2. **Vercel 回滚**
   - 访问 Vercel Dashboard
   - 找到上一个成功的部署
   - 点击 "Promote to Production"

### 数据库回滚

如果迁移导致问题，需要回滚数据库：

```sql
-- 删除新字段和索引
DROP INDEX IF EXISTS "comments_isRead_createdAt_idx";
DROP INDEX IF EXISTS "comments_articleId_isRead_idx";
ALTER TABLE "comments" DROP COLUMN IF EXISTS "readBy";
ALTER TABLE "comments" DROP COLUMN IF EXISTS "readAt";
ALTER TABLE "comments" DROP COLUMN IF EXISTS "isRead";
```

**注意：** 回滚前请备份数据！

---

## 📊 部署后监控

### 监控指标

- [ ] 错误率
- [ ] API 响应时间
- [ ] 数据库查询性能
- [ ] 用户访问量

### 日志检查

- [ ] Vercel 函数日志
- [ ] 数据库日志
- [ ] 浏览器控制台错误

---

## ✅ 部署完成检查清单

- [ ] 代码已部署到生产环境
- [ ] 数据库迁移已执行
- [ ] 所有功能测试通过
- [ ] 回归测试通过
- [ ] 性能指标正常
- [ ] 无已知 bug
- [ ] 监控已设置

---

**部署状态：** 🚀 待部署

