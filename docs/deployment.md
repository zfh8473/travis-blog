# 部署文档

本文档描述了 travis-blog 项目的部署流程和配置。

## 部署平台

**Vercel** - 官方推荐的 Next.js 部署平台

## 前置要求

1. **GitHub 仓库**
   - 项目必须推送到 GitHub 仓库
   - 仓库必须是公开的或已授权 Vercel 访问

2. **Vercel 账号**
   - 创建 Vercel 账号（如果还没有）
   - 使用 GitHub 账号登录 Vercel

3. **环境变量**
   - 准备生产环境所需的环境变量（见下方）

## 部署步骤

### 1. 连接 GitHub 仓库到 Vercel

#### 方法 1: 通过 Vercel Dashboard（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择 GitHub 仓库 `travis-blog`
4. 配置项目设置：
   - **Framework Preset**: Next.js（自动检测）
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npm run build`（自动检测）
   - **Output Directory**: `.next`（自动检测）
   - **Install Command**: `npm install`（自动检测）

#### 方法 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目根目录链接项目
vercel link

# 按照提示选择或创建项目
```

### 2. 配置环境变量

在 Vercel Dashboard 中配置以下环境变量：

**必需的环境变量：**

- `DATABASE_URL` - PostgreSQL 数据库连接字符串
  - 格式：`postgresql://user:password@host:port/database?sslmode=require`
  - 生产环境使用 Neon 或其他 PostgreSQL 服务

- `NEXTAUTH_SECRET` - NextAuth.js 密钥
  - 生成命令：`openssl rand -base64 32`
  - 用于加密 JWT token

- `NEXTAUTH_URL` - 应用 URL
  - 生产环境：`https://your-domain.vercel.app`
  - Preview 环境：自动设置为预览 URL

**可选的环境变量：**

- `STORAGE_TYPE` - 存储类型（默认：`local`）
  - 当前使用本地存储
  - 未来可迁移到云存储（S3、Cloudinary 等）

**配置步骤：**

1. 在 Vercel Dashboard 中打开项目
2. 进入 "Settings" → "Environment Variables"
3. 为每个环境变量添加：
   - **Key**: 变量名（如 `DATABASE_URL`）
   - **Value**: 变量值
   - **Environment**: 选择适用的环境（Production、Preview、Development）
4. 点击 "Save"

**环境变量配置建议：**

- **Production**: 配置所有必需变量
- **Preview**: 配置所有必需变量（可以使用测试数据库）
- **Development**: 通常不需要（使用本地 `.env.local`）

### 3. 自动部署配置

Vercel 默认配置：

- **Production 部署**: 推送到 `main` 分支时自动触发
- **Preview 部署**: 创建 Pull Request 时自动触发

**验证自动部署：**

1. 推送到 `main` 分支
2. 在 Vercel Dashboard 中查看部署状态
3. 确认部署成功完成

### 4. 构建过程

Vercel 构建过程：

1. **安装依赖**: `npm install`
2. **生成 Prisma Client**: `npm run postinstall`（自动执行 `prisma generate`）
3. **TypeScript 类型检查**: Next.js 自动执行
4. **Next.js 构建**: `npm run build`
5. **部署**: 将构建产物部署到 Vercel Edge Network

**构建日志：**

- 在 Vercel Dashboard 中查看构建日志
- 如果构建失败，检查日志中的错误信息

### 5. 验证部署

**验证步骤：**

1. **检查部署状态**
   - 在 Vercel Dashboard 中确认部署成功（绿色状态）

2. **访问生产环境**
   - 打开生产 URL（如 `https://travis-blog.vercel.app`）
   - 验证页面正常加载

3. **验证数据库连接**
   - 访问需要数据库的页面
   - 检查是否出现数据库连接错误
   - 查看 Vercel 函数日志确认数据库查询成功

4. **验证环境变量**
   - 确认所有必需的环境变量都已配置
   - 检查应用功能是否正常工作

## 故障排除

### 构建失败

**常见问题：**

1. **Prisma Client 生成失败**
   - 确保 `postinstall` 脚本在 `package.json` 中
   - 检查 `DATABASE_URL` 是否正确配置
   - 查看构建日志中的 Prisma 错误

2. **TypeScript 编译错误**
   - 运行 `npm run build` 本地测试
   - 修复所有 TypeScript 错误
   - 确保 `tsconfig.json` 配置正确

3. **依赖安装失败**
   - 检查 `package.json` 中的依赖版本
   - 确保所有依赖都是有效的 npm 包
   - 查看构建日志中的 npm 错误

### 数据库连接问题

**常见问题：**

1. **连接超时**
   - 检查 `DATABASE_URL` 是否正确
   - 确认数据库服务允许来自 Vercel 的连接
   - 检查数据库防火墙设置

2. **SSL 连接失败**
   - 确保 `DATABASE_URL` 包含 `?sslmode=require`
   - 检查数据库服务是否支持 SSL

3. **认证失败**
   - 验证数据库用户名和密码
   - 确认数据库用户有正确的权限

### 环境变量问题

**常见问题：**

1. **环境变量未设置**
   - 在 Vercel Dashboard 中检查环境变量配置
   - 确认环境变量名称拼写正确
   - 确保环境变量已保存

2. **环境变量值错误**
   - 检查环境变量值是否正确
   - 确认没有多余的空格或换行
   - 验证特殊字符是否正确转义

## 持续集成/持续部署 (CI/CD)

### 自动部署流程

1. **开发流程**:
   - 在功能分支开发
   - 创建 Pull Request
   - Vercel 自动创建 Preview 部署

2. **代码审查**:
   - 在 Preview 部署中测试功能
   - 代码审查通过后合并到 `main`

3. **生产部署**:
   - 合并到 `main` 分支
   - Vercel 自动触发生产部署
   - 部署完成后自动上线

### Preview 部署

- 每个 Pull Request 自动创建 Preview 部署
- Preview URL 格式：`https://travis-blog-git-{branch}-{username}.vercel.app`
- Preview 部署使用独立的环境变量配置
- Preview 部署可以用于测试和演示

## 监控和日志

### Vercel Dashboard

- **Deployments**: 查看所有部署历史和状态
- **Analytics**: 查看访问统计和性能指标
- **Logs**: 查看函数执行日志和错误日志

### 查看日志

1. 在 Vercel Dashboard 中打开项目
2. 进入 "Deployments" 标签
3. 点击特定部署查看详情
4. 查看 "Build Logs" 和 "Function Logs"

## 回滚部署

如果新部署出现问题，可以快速回滚：

1. 在 Vercel Dashboard 中打开项目
2. 进入 "Deployments" 标签
3. 找到之前成功的部署
4. 点击 "..." → "Promote to Production"

## 自定义域名

1. 在 Vercel Dashboard 中打开项目
2. 进入 "Settings" → "Domains"
3. 添加自定义域名
4. 按照提示配置 DNS 记录

## 参考文档

- [Vercel 部署文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
- [架构文档 - 部署架构](./architecture/deployment-architecture.md)

---

_最后更新：2025-11-12_

