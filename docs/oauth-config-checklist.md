# OAuth 配置检查清单

## 📋 配置步骤概览

### 第一步：GitHub OAuth App 配置
- [ ] 创建 GitHub OAuth App
- [ ] 获取 Client ID 和 Client Secret
- [ ] 配置本地环境变量
- [ ] 配置 Vercel 环境变量

### 第二步：Google OAuth App 配置
- [ ] 创建 Google Cloud 项目（如果需要）
- [ ] 配置 OAuth Consent Screen
- [ ] 创建 OAuth 2.0 Client
- [ ] 获取 Client ID 和 Client Secret
- [ ] 配置本地环境变量
- [ ] 配置 Vercel 环境变量

### 第三步：测试验证
- [ ] 测试本地开发环境
- [ ] 测试生产环境

---

## 🔧 详细配置步骤

### GitHub OAuth App 配置

#### 步骤 1: 创建 GitHub OAuth App

1. **访问 GitHub Developer Settings**
   - 打开：https://github.com/settings/developers
   - 如果还没有，点击 "New OAuth App"

2. **填写 OAuth App 信息**
   
   **Application name**: `Travis Blog`
   
   **Homepage URL**: 
   - 开发环境：`http://localhost:3000`
   - 生产环境：`https://travis-blog.vercel.app`（或您的实际域名）
   
   **Authorization callback URL**: 
   - 开发环境：`http://localhost:3000/api/auth/callback/github`
   - 生产环境：`https://travis-blog.vercel.app/api/auth/callback/github`
   
   ⚠️ **重要提示**：
   - 如果同时需要开发和生产环境，您需要创建**两个** OAuth App
   - 或者使用一个 App，但需要手动切换 callback URL（不推荐）

3. **点击 "Register application"**

#### 步骤 2: 获取 GitHub OAuth 凭证

创建后，您会看到：
- **Client ID**: 类似 `Iv1.xxxxxxxxxxxxx`
- **Client Secret**: 类似 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **重要**：Client Secret 只显示一次，请立即复制并保存！

#### 步骤 3: 配置本地环境变量

1. 在项目根目录创建或编辑 `.env.local` 文件
2. 添加以下内容：

```env
# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id-here"
GITHUB_CLIENT_SECRET="your-github-client-secret-here"
```

3. 保存文件

#### 步骤 4: 配置 Vercel 环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `travis-blog`
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `GITHUB_CLIENT_ID` | 您的 GitHub Client ID | Production, Preview |
| `GITHUB_CLIENT_SECRET` | 您的 GitHub Client Secret | Production, Preview |

5. 点击 "Save"

---

### Google OAuth App 配置

#### 步骤 1: 创建 Google Cloud 项目（如果需要）

1. **访问 Google Cloud Console**
   - 打开：https://console.cloud.google.com/
   - 如果还没有项目，点击 "Create Project"

2. **创建新项目**
   - 项目名称：`Travis Blog`（或您喜欢的名称）
   - 点击 "Create"

#### 步骤 2: 配置 OAuth Consent Screen

1. **导航到 OAuth Consent Screen**
   - 在左侧菜单：**APIs & Services** → **OAuth consent screen**

2. **选择用户类型**
   - 选择 **External**（除非您有 Google Workspace）
   - 点击 "Create"

3. **填写应用信息**
   - **App name**: `Travis Blog`
   - **User support email**: 选择您的邮箱
   - **Developer contact information**: 输入您的邮箱
   - 其他字段可以留空（对于测试/开发）

4. **Scopes（作用域）**
   - 点击 "Save and Continue"
   - 默认的 scopes 通常足够（email, profile）

5. **Test users（测试用户）**
   - 如果应用还在测试模式，添加测试用户邮箱
   - 点击 "Save and Continue"

6. **Summary（摘要）**
   - 检查信息
   - 点击 "Back to Dashboard"

#### 步骤 3: 创建 OAuth 2.0 Client

1. **导航到 Credentials**
   - 在左侧菜单：**APIs & Services** → **Credentials**

2. **创建 OAuth Client ID**
   - 点击 "Create Credentials" → "OAuth client ID"
   - 如果提示配置 Consent Screen，按照上面的步骤完成

3. **配置 OAuth Client**
   - **Application type**: 选择 **Web application**
   - **Name**: `Travis Blog`

4. **配置 Authorized JavaScript origins**
   点击 "Add URI"，添加：
   - 开发环境：`http://localhost:3000`
   - 生产环境：`https://travis-blog.vercel.app`

5. **配置 Authorized redirect URIs**
   点击 "Add URI"，添加：
   - 开发环境：`http://localhost:3000/api/auth/callback/google`
   - 生产环境：`https://travis-blog.vercel.app/api/auth/callback/google`

6. **点击 "Create"**

#### 步骤 4: 获取 Google OAuth 凭证

创建后，会弹出对话框显示：
- **Client ID**: 类似 `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: 类似 `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`

⚠️ **重要**：请立即复制并保存这些值！

#### 步骤 5: 配置本地环境变量

在 `.env.local` 文件中添加：

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
```

#### 步骤 6: 配置 Vercel 环境变量

在 Vercel Dashboard 中添加：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `GOOGLE_CLIENT_ID` | 您的 Google Client ID | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | 您的 Google Client Secret | Production, Preview |

---

## ✅ 验证配置

### 本地开发环境测试

1. **确保环境变量已配置**
   ```bash
   # 检查 .env.local 文件是否存在且包含 OAuth 变量
   cat .env.local
   ```

2. **重启开发服务器**
   ```bash
   npm run dev
   ```

3. **测试 OAuth 登录**
   - 访问：http://localhost:3000/login
   - 点击 "Sign in with GitHub" 或 "Sign in with Google"
   - 应该重定向到 OAuth provider 授权页面
   - 授权后应该重定向回应用并登录成功

### 生产环境测试

1. **确保 Vercel 环境变量已配置**
   - 在 Vercel Dashboard 中检查所有 OAuth 变量

2. **触发部署**
   - 推送到 main 分支或手动触发部署

3. **测试 OAuth 登录**
   - 访问生产环境的登录页面
   - 测试 GitHub 和 Google OAuth 登录

---

## 🔍 故障排除

### 常见问题

#### 1. "redirect_uri_mismatch" 错误

**原因**：Callback URL 配置不匹配

**解决方法**：
- 检查 OAuth App 中的 callback URL 是否与代码中的完全一致
- 确保 URL 没有多余的斜杠或空格
- 开发环境使用 `http://localhost:3000`
- 生产环境使用 `https://your-domain.vercel.app`

#### 2. OAuth 按钮不显示

**原因**：环境变量未配置或配置错误

**解决方法**：
- 检查 `.env.local` 文件是否存在
- 确认环境变量名称正确（`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET` 等）
- 重启开发服务器

#### 3. "Invalid client" 错误

**原因**：Client ID 或 Client Secret 错误

**解决方法**：
- 检查环境变量值是否正确复制（没有多余空格）
- 确认使用的是正确的 Client ID 和 Secret
- 如果重新生成了 Secret，确保更新环境变量

#### 4. Google OAuth 显示 "Access blocked"

**原因**：OAuth Consent Screen 未正确配置或应用在测试模式

**解决方法**：
- 确保 OAuth Consent Screen 已配置完成
- 如果应用在测试模式，确保添加了测试用户邮箱
- 考虑发布应用（如果准备用于生产）

---

## 📝 配置检查清单

完成配置后，请确认：

- [ ] GitHub OAuth App 已创建
- [ ] GitHub Client ID 和 Secret 已获取
- [ ] GitHub 环境变量已添加到 `.env.local`
- [ ] GitHub 环境变量已添加到 Vercel
- [ ] Google OAuth Client 已创建
- [ ] Google Client ID 和 Secret 已获取
- [ ] Google 环境变量已添加到 `.env.local`
- [ ] Google 环境变量已添加到 Vercel
- [ ] 本地开发环境测试通过
- [ ] 生产环境测试通过

---

## 🔐 安全提示

1. **永远不要提交 `.env.local` 到 Git**
   - 文件已在 `.gitignore` 中
   - 确保不会意外提交

2. **保护 Client Secrets**
   - 不要分享 Client Secret
   - 不要在代码中硬编码
   - 只使用环境变量

3. **定期轮换 Secrets**
   - 如果怀疑泄露，立即重新生成
   - 更新所有环境中的环境变量

4. **使用 HTTPS**
   - 生产环境必须使用 HTTPS
   - Vercel 自动提供 HTTPS

---

## 📚 参考资源

- [GitHub OAuth 文档](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js OAuth 文档](https://next-auth.js.org/providers/github)
- [OAuth 设置指南](./oauth-setup.md)

