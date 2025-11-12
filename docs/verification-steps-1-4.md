# Story 1-4 验证步骤指南

## 快速验证流程

### 1. 验证 GitHub 连接 (AC-1.4.1)

**操作：**
1. 访问 https://vercel.com/dashboard
2. 打开 `travis-blog` 项目
3. 进入 **Settings** → **Git**
4. 确认 GitHub 仓库连接

**预期结果：**
- ✅ 仓库显示：`zfh8473/travis-blog`
- ✅ 连接状态：Connected

---

### 2. 验证自动部署 (AC-1.4.2)

**操作：**
1. 在 Vercel Dashboard 中查看 **Deployments**
2. 找到最新的部署（应该来自 main 分支）
3. 检查部署状态

**预期结果：**
- ✅ 部署状态：Ready（绿色）
- ✅ 来源：main 分支
- ✅ 部署时间：最近

---

### 3. 验证环境变量 (AC-1.4.4)

**操作：**
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. 检查以下变量是否存在：

| 变量名 | Production | Preview |
|--------|-----------|---------|
| DATABASE_URL | ✅ | ✅ |
| NEXTAUTH_SECRET | ✅ | ✅ |
| NEXTAUTH_URL | ✅ | - |
| STORAGE_TYPE | ✅ (可选) | ✅ (可选) |

**预期结果：**
- ✅ 所有必需变量已配置
- ✅ 变量值正确

---

### 4. 验证构建成功 (AC-1.4.5)

**操作：**
1. 在 Vercel Dashboard 中打开最新部署
2. 点击查看 **Build Logs**
3. 检查构建过程

**预期结果：**
构建日志应包含：
```
✓ Installing dependencies
✓ Running "postinstall" script
✓ Generating Prisma Client
✓ Compiled successfully
✓ Generating static pages
✓ Build completed
```

**检查点：**
- ✅ npm install 成功
- ✅ prisma generate 成功（postinstall 脚本执行）
- ✅ TypeScript 编译无错误
- ✅ Next.js 构建成功
- ✅ 部署状态为 "Ready"

---

### 5. 验证数据库连接 (AC-1.4.6)

**操作：**
1. 获取生产环境 URL（如 `https://travis-blog.vercel.app`）
2. 访问测试端点：`https://your-domain.vercel.app/api/test-db`
3. 检查响应

**预期响应：**
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

**如果失败：**
- 检查 Vercel Function Logs 中的错误信息
- 确认 `DATABASE_URL` 环境变量正确配置
- 确认数据库允许来自 Vercel 的连接

---

## 验证检查清单

完成验证后，在以下清单中打勾：

- [ ] AC-1.4.1: GitHub 仓库连接验证
- [ ] AC-1.4.2: 自动部署验证
- [ ] AC-1.4.3: Preview 部署验证（可选）
- [ ] AC-1.4.4: 环境变量配置验证
- [ ] AC-1.4.5: 构建成功验证
- [ ] AC-1.4.6: 数据库连接验证

---

## 验证完成后

如果所有接受标准都验证通过：
1. 更新故事文件，记录验证结果
2. 可以继续下一个故事

如果验证失败：
1. 记录失败的具体原因
2. 修复问题后重新验证
3. 更新验证结果

