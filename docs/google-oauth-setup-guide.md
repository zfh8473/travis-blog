# Google OAuth 设置指南

**创建日期：** 2025-01-20  
**目的：** 指导如何在 Google Cloud Console 中创建 OAuth 2.0 客户端并获取 Client ID 和 Client Secret

---

## 📋 前置条件

1. 拥有 Google 账号
2. 可以访问 [Google Cloud Console](https://console.cloud.google.com/)

---

## 🚀 步骤 1: 创建或选择 Google Cloud 项目

### 1.1 访问 Google Cloud Console
1. 打开浏览器，访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用您的 Google 账号登录

### 1.2 创建新项目（如果还没有项目）
1. 点击页面顶部的项目选择器（显示当前项目名称）
2. 点击 **"新建项目"**（New Project）
3. 输入项目名称，例如：`travis-blog`
4. 点击 **"创建"**（Create）
5. 等待项目创建完成（通常几秒钟）

### 1.3 选择现有项目（如果已有项目）
1. 点击页面顶部的项目选择器
2. 从列表中选择要使用的项目

---

## 🔧 步骤 2: 启用 Google+ API（如果需要）

**注意：** 对于 OAuth 2.0 登录，通常不需要单独启用 API，但为了确保功能正常，建议启用以下 API：

1. 在左侧菜单中，点击 **"API 和服务"**（APIs & Services）> **"库"**（Library）
2. 搜索 **"Google+ API"** 或 **"People API"**
3. 点击进入，然后点击 **"启用"**（Enable）

---

## 🔑 步骤 3: 配置 OAuth 同意屏幕

### 3.1 进入 OAuth 同意屏幕
1. 在左侧菜单中，点击 **"API 和服务"**（APIs & Services）> **"OAuth 同意屏幕"**（OAuth consent screen）

### 3.2 选择用户类型
- **外部**（External）- 如果您的应用面向所有 Google 用户（推荐）
- **内部**（Internal）- 如果您的应用仅面向组织内用户（需要 Google Workspace）

点击 **"创建"**（Create）继续

### 3.3 填写应用信息
填写以下必填信息：

**应用信息：**
- **应用名称**（App name）：`Travis Blog`（或您喜欢的名称）
- **用户支持电子邮件**（User support email）：选择您的邮箱地址
- **应用徽标**（App logo）：可选，可以上传您的博客 Logo

**应用主页链接：**
- **应用主页链接**（Application home page）：`https://travis-blog.vercel.app`

**应用隐私政策链接：**
- **隐私政策链接**（Privacy policy link）：`https://travis-blog.vercel.app/privacy`（如果有）
- 如果没有隐私政策页面，可以暂时使用主页链接

**应用服务条款链接：**
- **服务条款链接**（Terms of service link）：可选

**已获授权的网域：**
- **已获授权的网域**（Authorized domains）：`vercel.app`（Vercel 的域名）

**开发者联系信息：**
- **开发者联系电子邮件**（Developer contact information）：您的邮箱地址

### 3.4 配置作用域（Scopes）
1. 点击 **"添加或移除作用域"**（Add or Remove Scopes）
2. 在弹出窗口中，选择以下作用域：
   - ✅ `.../auth/userinfo.email` - 查看您的电子邮件地址
   - ✅ `.../auth/userinfo.profile` - 查看您的个人资料信息
3. 点击 **"更新"**（Update）

### 3.5 添加测试用户（如果应用处于测试状态）
如果应用处于 **"测试"**（Testing）状态：
1. 在 **"测试用户"**（Test users）部分，点击 **"添加用户"**（Add Users）
2. 输入要测试的 Google 账号邮箱地址
3. 点击 **"添加"**（Add）
4. 可以添加多个测试用户

**注意：** 只有测试用户列表中的账号才能使用 OAuth 登录。如果希望所有用户都能使用，需要将应用发布到生产环境。

### 3.6 保存配置
1. 滚动到页面底部
2. 点击 **"保存并继续"**（Save and Continue）
3. 完成所有步骤后，点击 **"返回到信息中心"**（Back to Dashboard）

---

## 🔐 步骤 4: 创建 OAuth 2.0 客户端 ID

### 4.1 进入凭据页面
1. 在左侧菜单中，点击 **"API 和服务"**（APIs & Services）> **"凭据"**（Credentials）

### 4.2 创建 OAuth 客户端 ID
1. 点击页面顶部的 **"+ 创建凭据"**（+ CREATE CREDENTIALS）
2. 选择 **"OAuth 客户端 ID"**（OAuth client ID）

### 4.3 配置 OAuth 客户端
如果这是第一次创建 OAuth 客户端，系统会提示您配置 OAuth 同意屏幕。如果已经配置过，直接进入下一步。

**应用类型：**
- 选择 **"Web 应用"**（Web application）

**名称：**
- 输入一个描述性名称，例如：`Travis Blog Web Client`

**已获授权的 JavaScript 来源：**
点击 **"+ 添加 URI"**（+ ADD URI），添加以下 URL：
- `http://localhost:3000`（开发环境）
- `https://travis-blog.vercel.app`（生产环境）

**已获授权的重定向 URI：**
点击 **"+ 添加 URI"**（+ ADD URI），添加以下 URL：
- `http://localhost:3000/api/auth/callback/google`（开发环境）
- `https://travis-blog.vercel.app/api/auth/callback/google`（生产环境）

**重要提示：**
- 确保 URL 格式完全正确（包括协议 `http://` 或 `https://`）
- 不要有多余的空格或斜杠
- 生产环境的 URL 必须与您的实际域名匹配

### 4.4 创建并获取凭据
1. 点击 **"创建"**（Create）
2. 系统会显示一个弹出窗口，包含：
   - **客户端 ID**（Client ID）- 这就是 `GOOGLE_CLIENT_ID`
   - **客户端密钥**（Client secret）- 这就是 `GOOGLE_CLIENT_SECRET`

### 4.5 保存凭据
**重要：** 请立即复制并保存这两个值，因为客户端密钥只会显示一次！

1. 复制 **客户端 ID**（Client ID）
   - 格式类似：`123456789-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - 保存到安全的地方

2. 复制 **客户端密钥**（Client secret）
   - 格式类似：`GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 保存到安全的地方

3. 点击 **"确定"**（OK）关闭窗口

---

## 📝 步骤 5: 配置环境变量

### 5.1 本地开发环境（.env.local）

在项目根目录的 `.env.local` 文件中添加：

```bash
GOOGLE_CLIENT_ID=你的客户端ID
GOOGLE_CLIENT_SECRET=你的客户端密钥
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=你的NextAuth密钥（随机字符串）
```

**示例：**
```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

**注意：** 请将 `your-client-id-here` 和 `your-client-secret-here` 替换为您从 Google Cloud Console 获取的实际值。

### 5.2 生产环境（Vercel）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `travis-blog`
3. 进入 **Settings** > **Environment Variables**
4. 添加以下环境变量：

**GOOGLE_CLIENT_ID**
- Key: `GOOGLE_CLIENT_ID`
- Value: 您的客户端 ID
- Environment: Production, Preview, Development（全选）

**GOOGLE_CLIENT_SECRET**
- Key: `GOOGLE_CLIENT_SECRET`
- Value: 您的客户端密钥
- Environment: Production, Preview, Development（全选）

**NEXTAUTH_URL**
- Key: `NEXTAUTH_URL`
- Value: `https://travis-blog.vercel.app`
- Environment: Production, Preview, Development（全选）

**NEXTAUTH_SECRET**
- Key: `NEXTAUTH_SECRET`
- Value: 一个随机字符串（可以使用 `openssl rand -base64 32` 生成）
- Environment: Production, Preview, Development（全选）

5. 点击 **"Save"** 保存每个变量
6. **重要：** 添加环境变量后，需要重新部署应用才能生效

---

## ✅ 步骤 6: 验证配置

### 6.1 本地测试
1. 确保 `.env.local` 文件已正确配置
2. 重启开发服务器（如果正在运行）
3. 访问 `http://localhost:3000/login`
4. 点击 "Sign in with Google"
5. 应该会重定向到 Google 登录页面

### 6.2 生产环境测试
1. 确保 Vercel 环境变量已正确配置
2. 重新部署应用（Vercel 会自动部署，或手动触发）
3. 访问 `https://travis-blog.vercel.app/login`
4. 点击 "Sign in with Google"
5. 应该会重定向到 Google 登录页面

---

## 🔍 常见问题

### Q1: 找不到 OAuth 客户端 ID 页面
**A:** 确保您已经：
1. 创建了 Google Cloud 项目
2. 配置了 OAuth 同意屏幕
3. 在正确的项目中操作

### Q2: 客户端密钥丢失了怎么办？
**A:** 
1. 进入 Google Cloud Console > APIs & Services > Credentials
2. 找到您的 OAuth 客户端 ID
3. 点击编辑（铅笔图标）
4. 在 "客户端密钥" 部分，点击 "重置密钥"（Reset Secret）
5. 复制新的密钥并更新环境变量

### Q3: 重定向 URI 不匹配错误
**A:** 确保：
1. Google Cloud Console 中的重定向 URI 与 NextAuth 使用的 URI 完全匹配
2. 包括协议（`http://` 或 `https://`）
3. 包括完整路径（`/api/auth/callback/google`）
4. 没有多余的空格或斜杠

### Q4: 应用处于测试状态，如何让所有用户使用？
**A:** 
1. 确保 OAuth 同意屏幕已完整配置
2. 在 OAuth 同意屏幕页面，点击 "发布应用"（Publish App）
3. 注意：发布到生产环境可能需要 Google 审核，特别是如果您的应用请求敏感作用域

### Q5: 如何查看已创建的 OAuth 客户端？
**A:**
1. 进入 Google Cloud Console > APIs & Services > Credentials
2. 在 "OAuth 2.0 客户端 ID" 部分，您会看到所有已创建的客户端
3. 点击客户端名称可以查看和编辑配置

---

## 📚 相关资源

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider 文档](https://next-auth.js.org/providers/google)
- [Vercel Environment Variables 文档](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🔒 安全提示

1. **永远不要**将 `GOOGLE_CLIENT_SECRET` 提交到 Git 仓库
2. 确保 `.env.local` 文件在 `.gitignore` 中
3. 定期轮换客户端密钥（如果怀疑泄露）
4. 使用强密码生成器生成 `NEXTAUTH_SECRET`
5. 在生产环境中，只允许 HTTPS 连接

---

## 📝 检查清单

完成以下所有项目后，Google OAuth 应该可以正常工作：

- [ ] Google Cloud 项目已创建
- [ ] OAuth 同意屏幕已配置
- [ ] OAuth 2.0 客户端 ID 已创建
- [ ] 已获授权的 JavaScript 来源已配置（开发和生产）
- [ ] 已获授权的重定向 URI 已配置（开发和生产）
- [ ] 客户端 ID 和密钥已复制并保存
- [ ] 本地 `.env.local` 文件已配置
- [ ] Vercel 环境变量已配置
- [ ] 应用已重新部署（如果修改了环境变量）
- [ ] 本地测试通过
- [ ] 生产环境测试通过

---

**完成以上步骤后，您应该能够成功使用 Google OAuth 登录功能！** 🎉

