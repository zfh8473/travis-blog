# Story 1-4 完整验证指南

## 📋 验证概述

虽然部署已成功，但需要验证所有 6 个接受标准（AC-1.4.1 到 AC-1.4.6）才能将故事标记为完成。

## ✅ 验证步骤

### 步骤 1: 验证 GitHub 连接 (AC-1.4.1)

**操作：**
1. 访问 https://vercel.com/dashboard
2. 打开 `travis-blog` 项目
3. 进入 **Settings** → **Git**
4. 确认显示：`zfh8473/travis-blog`

**验证结果：** ⬜ 待验证

---

### 步骤 2: 验证自动部署 (AC-1.4.2)

**操作：**
1. Vercel Dashboard → **Deployments**
2. 查看最新部署
3. 确认：
   - 来源：main 分支
   - 状态：Ready（绿色）
   - 触发方式：Git Push

**验证结果：** ⬜ 待验证

---

### 步骤 3: 验证环境变量 (AC-1.4.4)

**操作：**
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. 确认以下变量存在：

| 变量名 | Production | Preview | 验证 |
|--------|-----------|---------|------|
| DATABASE_URL | ✅ | ✅ | ⬜ |
| NEXTAUTH_SECRET | ✅ | ✅ | ⬜ |
| NEXTAUTH_URL | ✅ | - | ⬜ |
| STORAGE_TYPE | ✅ (可选) | ✅ (可选) | ⬜ |

**验证结果：** ⬜ 待验证

---

### 步骤 4: 验证构建成功 (AC-1.4.5)

**操作：**
1. Vercel Dashboard → **Deployments** → 最新部署
2. 点击查看 **Build Logs**
3. 检查以下步骤：

```
✓ Installing dependencies
✓ Running "postinstall" script
✓ Generating Prisma Client
✓ Compiled successfully
✓ Generating static pages
✓ Build completed
```

**检查点：**
- [ ] npm install 成功
- [ ] postinstall 脚本执行（prisma generate）
- [ ] TypeScript 编译无错误
- [ ] Next.js 构建成功
- [ ] 部署状态为 "Ready"

**验证结果：** ⬜ 待验证

---

### 步骤 5: 验证数据库连接 (AC-1.4.6) ⭐ 重要

**操作：**

1. **获取生产环境 URL**
   - 在 Vercel Dashboard 中查看项目 URL
   - 格式：`https://travis-blog.vercel.app` 或自定义域名

2. **测试数据库连接**
   ```bash
   # 访问测试端点
   curl https://your-domain.vercel.app/api/test-db
   ```

   或在浏览器中访问：
   ```
   https://your-domain.vercel.app/api/test-db
   ```

3. **预期成功响应：**
   ```json
   {
     "success": true,
     "message": "Database connection successful!",
     "data": {
       "userCount": 0,
       "articleCount": 0,
       "timestamp": "2025-11-12T...",
       "environment": "production"
     }
   }
   ```

4. **如果失败：**
   - 检查 Vercel Dashboard → **Deployments** → **Function Logs**
   - 查看错误信息
   - 确认 `DATABASE_URL` 环境变量正确
   - 确认数据库允许来自 Vercel 的连接

**验证结果：** ⬜ 待验证

---

## 🔍 验证检查清单

完成验证后，在以下清单中打勾：

- [ ] **AC-1.4.1**: GitHub 仓库连接验证
  - [ ] 仓库显示正确
  - [ ] 连接状态为 Connected

- [ ] **AC-1.4.2**: 自动部署验证
  - [ ] 有来自 main 分支的部署
  - [ ] 部署状态为 Ready

- [ ] **AC-1.4.3**: Preview 部署验证（可选）
  - [ ] 创建测试 PR 验证预览部署

- [ ] **AC-1.4.4**: 环境变量配置验证
  - [ ] DATABASE_URL 已配置
  - [ ] NEXTAUTH_SECRET 已配置
  - [ ] NEXTAUTH_URL 已配置
  - [ ] STORAGE_TYPE 已配置（可选）

- [ ] **AC-1.4.5**: 构建成功验证
  - [ ] 构建日志无错误
  - [ ] Prisma Client 生成成功
  - [ ] TypeScript 编译成功
  - [ ] Next.js 构建成功

- [ ] **AC-1.4.6**: 数据库连接验证 ⭐
  - [ ] 测试端点返回成功响应
  - [ ] 数据库查询成功
  - [ ] 无连接错误

---

## 📝 验证记录

验证完成后，请记录结果：

**验证日期：** _______________

**验证结果：**
- AC-1.4.1: ⬜ 通过 / ⬜ 失败
- AC-1.4.2: ⬜ 通过 / ⬜ 失败
- AC-1.4.3: ⬜ 通过 / ⬜ 跳过
- AC-1.4.4: ⬜ 通过 / ⬜ 失败
- AC-1.4.5: ⬜ 通过 / ⬜ 失败
- AC-1.4.6: ⬜ 通过 / ⬜ 失败

**问题记录：**
（如有失败，记录具体问题）

---

## ✅ 验证完成后

如果所有接受标准都验证通过：
1. 更新故事文件，记录验证结果
2. 将故事状态更新为 "done"
3. 可以继续下一个故事

如果验证失败：
1. 记录失败的具体原因
2. 修复问题
3. 重新验证
4. 更新验证结果

---

## 🆘 需要帮助？

如果遇到验证问题：
1. 查看 [验证步骤指南](./verification-steps-1-4.md)
2. 查看 [故障排除指南](./deployment.md#故障排除)
3. 检查 Vercel Dashboard 中的日志和错误信息

