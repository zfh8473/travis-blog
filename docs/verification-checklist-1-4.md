# Story 1-4 验证检查清单

## 接受标准验证

### AC-1.4.1: GitHub 仓库已连接到 Vercel 项目

**验证方法：**
- [ ] 在 Vercel Dashboard 中打开项目
- [ ] 进入 Settings → Git
- [ ] 确认 GitHub 仓库显示为：`zfh8473/travis-blog`
- [ ] 确认连接状态为 "Connected"

**验证结果：** ⬜ 待验证

---

### AC-1.4.2: Vercel 自动部署已配置（main 分支推送触发）

**验证方法：**
- [ ] 在 Vercel Dashboard 中查看 Deployments
- [ ] 确认有来自 main 分支的部署记录
- [ ] 确认部署状态为 "Ready"（绿色）
- [ ] 可选：推送一个小改动到 main，验证自动触发部署

**验证结果：** ⬜ 待验证

---

### AC-1.4.3: Preview 部署已配置（Pull Request 触发）

**验证方法：**
- [ ] 在 Vercel Dashboard 中查看 Deployments
- [ ] 确认有 Preview 部署（如果有 PR）
- [ ] 或创建一个测试 PR 验证预览部署自动创建
- [ ] 确认预览部署状态为 "Ready"

**验证结果：** ⬜ 待验证（可选，如果没有 PR）

---

### AC-1.4.4: 必需的环境变量已在 Vercel Dashboard 配置

**验证方法：**
- [ ] 在 Vercel Dashboard → Settings → Environment Variables
- [ ] 确认以下变量已配置：
  - [ ] `DATABASE_URL` (Production, Preview)
  - [ ] `NEXTAUTH_SECRET` (Production, Preview)
  - [ ] `NEXTAUTH_URL` (Production)
  - [ ] `STORAGE_TYPE` (可选，Production, Preview)

**验证结果：** ⬜ 待验证

---

### AC-1.4.5: 生产环境构建成功（无错误）

**验证方法：**
- [ ] 在 Vercel Dashboard 中打开最新部署
- [ ] 查看 Build Logs，确认：
  - [ ] ✅ npm install 成功
  - [ ] ✅ prisma generate 成功（postinstall 脚本）
  - [ ] ✅ TypeScript 编译成功（无类型错误）
  - [ ] ✅ Next.js 构建成功
  - [ ] ✅ 部署完成，状态为 "Ready"

**验证结果：** ⬜ 待验证

**构建日志检查点：**
```
✓ Installing dependencies
✓ Running "postinstall" script
✓ Generating Prisma Client
✓ Compiled successfully
✓ Generating static pages
✓ Build completed
```

---

### AC-1.4.6: 生产环境数据库连接正常

**验证方法：**
- [ ] 访问生产环境的测试 API：`https://your-domain.vercel.app/api/test-db`
- [ ] 确认返回成功响应
- [ ] 检查响应内容包含数据库连接成功信息
- [ ] 查看 Vercel Function Logs 确认无数据库连接错误

**验证结果：** ⬜ 待验证

---

## 验证步骤

### 步骤 1: 创建测试 API 端点

需要创建一个测试端点来验证生产环境的数据库连接。

### 步骤 2: 部署测试端点

将测试端点推送到 main 分支，触发自动部署。

### 步骤 3: 验证所有接受标准

按照上述清单逐一验证每个接受标准。

---

## 验证完成后

- [ ] 所有接受标准已验证
- [ ] 更新故事文件记录验证结果
- [ ] 标记故事为 "done"（如果所有验证通过）

