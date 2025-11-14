# OAuth 设置指南

本文档说明如何为 travis-blog 配置 GitHub 和 Google OAuth 登录。

## 概述

OAuth 登录允许用户使用他们的 GitHub 或 Google 账户快速登录，无需创建新账户。本指南将帮助您设置 OAuth 应用程序。

## GitHub OAuth 设置

### 1. 创建 GitHub OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App" 按钮
3. 填写以下信息：
   - **Application name**: `Travis Blog`
   - **Homepage URL**: 
     - 开发环境: `http://localhost:3000`
     - 生产环境: `https://travis-blog.vercel.app` (或您的生产 URL)
   - **Authorization callback URL**: 
     - 开发环境: `http://localhost:3000/api/auth/callback/github`
     - 生产环境: `https://travis-blog.vercel.app/api/auth/callback/github`
4. 点击 "Register application"

### 2. 获取 GitHub OAuth 凭证

1. 创建 OAuth App 后，您将看到 **Client ID** 和 **Client Secret**
2. 复制这些值并保存到安全的地方
3. **重要**: Client Secret 只显示一次，请妥善保存

### 3. 配置环境变量

将以下环境变量添加到您的 `.env.local` 文件：

```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 4. 生产环境配置

在 Vercel 或其他部署平台：

1. 在 GitHub Developer Settings 中，为生产环境创建另一个 OAuth App（或更新现有 App 的 callback URL）
2. 确保生产环境的 callback URL 正确配置
3. 在 Vercel 项目设置中添加环境变量：
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

## Google OAuth 设置

### 1. 创建 Google OAuth 2.0 Client

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API：
   - 导航到 "APIs & Services" > "Library"
   - 搜索 "Google+ API" 并启用
4. 创建 OAuth 2.0 凭证：
   - 导航到 "APIs & Services" > "Credentials"
   - 点击 "Create Credentials" > "OAuth client ID"
   - 如果提示，配置 OAuth consent screen

### 2. 配置 OAuth Consent Screen

1. 选择用户类型（通常是 "External"）
2. 填写应用信息：
   - **App name**: `Travis Blog`
   - **User support email**: 您的邮箱
   - **Developer contact information**: 您的邮箱
3. 保存并继续

### 3. 创建 OAuth Client

1. 应用类型：选择 "Web application"
2. 名称：`Travis Blog`
3. 授权的 JavaScript 源：
   - 开发环境: `http://localhost:3000`
   - 生产环境: `https://travis-blog.vercel.app`
4. 授权的重定向 URI：
   - 开发环境: `http://localhost:3000/api/auth/callback/google`
   - 生产环境: `https://travis-blog.vercel.app/api/auth/callback/google`
5. 点击 "Create"

### 4. 获取 Google OAuth 凭证

1. 创建 OAuth Client 后，您将看到 **Client ID** 和 **Client Secret**
2. 复制这些值并保存

### 5. 配置环境变量

将以下环境变量添加到您的 `.env.local` 文件：

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 6. 生产环境配置

在 Vercel 或其他部署平台：

1. 在 Google Cloud Console 中，确保生产环境的 callback URL 已添加到 OAuth Client
2. 在 Vercel 项目设置中添加环境变量：
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## 测试 OAuth 登录

### 开发环境

1. 确保所有环境变量已正确设置
2. 启动开发服务器：`npm run dev`
3. 访问登录页面：`http://localhost:3000/login`
4. 点击 "Sign in with GitHub" 或 "Sign in with Google"
5. 授权应用程序
6. 验证您被重定向回博客并已登录

### 生产环境

1. 确保 Vercel 环境变量已正确配置
2. 部署应用程序
3. 访问生产登录页面
4. 测试 OAuth 登录流程

## 故障排除

### OAuth 登录失败

1. **检查环境变量**: 确保 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET` 已正确设置
2. **检查 Callback URL**: 确保 OAuth App 中的 callback URL 与应用程序中的 URL 完全匹配
3. **检查 NEXTAUTH_URL**: 确保 `NEXTAUTH_URL` 环境变量正确设置（开发环境: `http://localhost:3000`，生产环境: 您的生产 URL）
4. **查看日志**: 检查服务器日志以获取详细错误信息

### 账户链接问题

- 如果用户使用邮箱注册，然后使用相同邮箱的 OAuth 登录，账户会自动链接
- OAuth 用户没有密码，只能使用 OAuth 登录
- 如果 OAuth 邮箱与现有账户邮箱匹配，系统会自动链接账户

## 安全注意事项

1. **保护 Client Secrets**: 永远不要将 Client Secret 提交到版本控制系统
2. **使用环境变量**: 所有 OAuth 凭证应存储在环境变量中
3. **HTTPS**: 生产环境必须使用 HTTPS
4. **Callback URL 验证**: OAuth providers 会验证 callback URL，确保配置正确

## 参考资源

- [NextAuth.js OAuth 文档](https://next-auth.js.org/providers/github)
- [GitHub OAuth 文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)

