# Vercel 配置检查清单

## ✅ 已完成的配置

- [x] `package.json` 已添加 `postinstall` 脚本
- [x] `vercel.json` 配置文件已创建
- [x] 部署文档已创建
- [x] GitHub 仓库已连接：`https://github.com/zfh8473/travis-blog.git`

## 📋 待完成的配置步骤

### 步骤 1: 安装 Vercel CLI（可选，但推荐）

```bash
npm i -g vercel
```

### 步骤 2: 连接项目到 Vercel

**选项 A: 通过 Vercel Dashboard（最简单）**

1. 访问 https://vercel.com/dashboard
2. 点击 "Add New..." → "Project"
3. 选择 GitHub 仓库：`zfh8473/travis-blog`
4. 确认项目设置（通常自动检测）：
   - Framework: Next.js ✅
   - Build Command: `npm run build` ✅
   - Output Directory: `.next` ✅
5. 点击 "Deploy"（可以先跳过环境变量，稍后配置）

**选项 B: 通过 Vercel CLI**

```bash
# 登录 Vercel
vercel login

# 链接项目
vercel link

# 按照提示选择或创建项目
```

### 步骤 3: 配置环境变量

**必需的环境变量：**

1. **DATABASE_URL**
   - 值：你的生产数据库连接字符串
   - 格式：`postgresql://user:password@host:port/database?sslmode=require`
   - 环境：Production, Preview

2. **NEXTAUTH_SECRET**
   - 值：`muHsNCbwL/X6waFfiKEaWS+ACAbF268F4mwL0aYnOmo=`
   - 说明：已为你生成的密钥
   - 环境：Production, Preview

3. **NEXTAUTH_URL**
   - 值：`https://travis-blog.vercel.app`（或你的自定义域名）
   - 说明：部署后 Vercel 会自动提供 URL
   - 环境：Production（Preview 会自动设置）

**可选的环境变量：**

4. **STORAGE_TYPE**
   - 值：`local`
   - 环境：Production, Preview（可选）

**配置方法：**

在 Vercel Dashboard 中：
1. 打开项目
2. Settings → Environment Variables
3. 为每个变量添加：
   - Key: 变量名
   - Value: 变量值
   - Environment: 选择适用的环境
4. 点击 "Save"

### 步骤 4: 触发首次部署

**方法 1: 通过 Git Push（推荐）**

```bash
# 提交当前更改
git add .
git commit -m "feat: configure Vercel deployment"
git push origin main
```

**方法 2: 通过 Vercel Dashboard**

- 在项目页面点击 "Redeploy"

**方法 3: 通过 Vercel CLI**

```bash
vercel --prod
```

### 步骤 5: 验证部署

1. **检查构建日志**
   - Vercel Dashboard → Deployments → 最新部署
   - 查看 Build Logs，确认：
     - ✅ npm install 成功
     - ✅ prisma generate 成功
     - ✅ TypeScript 编译成功
     - ✅ Next.js 构建成功

2. **访问应用**
   - 打开生产 URL
   - 验证页面正常加载

3. **验证数据库连接**
   - 访问需要数据库的页面
   - 检查是否正常工作

## 🔍 配置验证命令

```bash
# 检查 Vercel CLI 是否安装
vercel --version

# 检查项目是否已链接
vercel ls

# 查看环境变量（需要先链接）
vercel env ls
```

## 📚 参考文档

- [快速开始指南](./vercel-quick-start.md)
- [环境变量配置](./vercel-env-setup.md)
- [完整部署文档](./deployment.md)

## 🆘 需要帮助？

如果遇到问题，请检查：
1. 构建日志中的错误信息
2. 环境变量是否正确配置
3. 数据库连接字符串格式是否正确
4. 数据库是否允许来自 Vercel 的连接

