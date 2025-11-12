# Vercel 快速开始指南

## 方法 1: 通过 Vercel Dashboard（推荐）

### 步骤 1: 连接 GitHub 仓库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New..."** → **"Project"**
3. 选择 GitHub 仓库：`zfh8473/travis-blog`
4. 项目设置（通常自动检测）：
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 步骤 2: 配置环境变量

参考 [环境变量配置指南](./vercel-env-setup.md)

### 步骤 3: 部署

点击 **"Deploy"**，Vercel 会自动：
- 安装依赖
- 运行 `postinstall` 脚本（生成 Prisma Client）
- 构建 Next.js 应用
- 部署到生产环境

## 方法 2: 通过 Vercel CLI

### 步骤 1: 安装并登录

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login
```

### 步骤 2: 链接项目

```bash
# 在项目根目录运行
vercel link

# 按照提示：
# - 选择或创建项目
# - 选择开发目录（默认：./）
# - 确认设置
```

### 步骤 3: 配置环境变量

```bash
# 添加环境变量（交互式）
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# 或使用脚本
./scripts/vercel-setup.sh
```

### 步骤 4: 部署

```bash
# 部署到生产环境
vercel --prod

# 或推送到 main 分支（自动触发）
git push origin main
```

## 验证部署

1. **检查部署状态**
   - Vercel Dashboard → Deployments
   - 确认部署成功（绿色 ✓）

2. **访问应用**
   - 打开生产 URL（如 `https://travis-blog.vercel.app`）
   - 验证页面正常加载

3. **检查构建日志**
   - 在部署详情中查看构建日志
   - 确认无错误

4. **验证数据库连接**
   - 访问需要数据库的页面
   - 检查是否正常工作

## 故障排除

### 构建失败

**Prisma Client 生成失败：**
- 确认 `package.json` 中有 `postinstall` 脚本
- 检查 `DATABASE_URL` 是否正确配置

**TypeScript 错误：**
- 本地运行 `npm run build` 检查错误
- 修复所有 TypeScript 错误

### 数据库连接失败

**连接超时：**
- 检查 `DATABASE_URL` 格式
- 确认数据库允许 Vercel IP 访问

**SSL 错误：**
- 确保连接字符串包含 `?sslmode=require`

## 下一步

部署成功后：
- ✅ 自动部署已配置（推送到 main 触发）
- ✅ Preview 部署已配置（PR 自动创建预览）
- ✅ 监控和日志可在 Dashboard 查看

参考完整文档：[部署文档](./deployment.md)

