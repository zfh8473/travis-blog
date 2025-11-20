# Google OAuth 诊断结果

**日期：** 2025-01-20  
**诊断人：** Amelia (DEV)

---

## ✅ 已完成的诊断检查

### 1. 环境变量检查

#### 本地环境（.env.local）
- ✅ `GOOGLE_CLIENT_ID`: 已配置
- ✅ `GOOGLE_CLIENT_SECRET`: 已配置
- ✅ `NEXTAUTH_SECRET`: 已配置
- ⚠️ `NEXTAUTH_URL`: 设置为 `http://localhost:3000`（仅开发环境）

#### 生产环境（Vercel）
**需要手动检查：**
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入项目 `travis-blog`
3. 进入 Settings > Environment Variables
4. 确认以下变量已设置：
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` = `https://travis-blog.vercel.app` ⚠️ **重要**

---

### 2. NextAuth 配置检查

**文件：** `app/api/auth/[...nextauth]/route.ts`

**检查结果：**
- ✅ GoogleProvider 已正确导入
- ✅ 环境变量检查逻辑正确（只有当两个变量都存在时才启用）
- ✅ OAuth 回调处理逻辑完善
- ✅ 已添加详细的日志记录
- ✅ 已添加 `authorization` 参数配置（prompt: "consent"）

**当前配置：**
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code",
    },
  },
})
```

---

### 3. 登录页面检查

**文件：** `app/login/page.tsx`

**检查结果：**
- ✅ Google 登录按钮正确显示
- ✅ `handleOAuthSignIn` 函数正确调用 `signIn("google")`
- ✅ 错误处理逻辑完善
- ✅ 加载状态正确显示

---

## 🔍 需要检查的 Google Cloud Console 配置

### 步骤 1: 访问 Google Cloud Console
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择正确的项目（包含 OAuth 客户端 ID 的项目）

### 步骤 2: 检查 OAuth 2.0 客户端配置
1. 导航到 **APIs & Services** > **Credentials**
2. 找到 OAuth 2.0 Client ID（Client ID 应该以 `.apps.googleusercontent.com` 结尾）
3. 点击编辑，检查以下配置：

#### ✅ Authorized JavaScript origins（授权 JavaScript 来源）
必须包含：
- 开发环境：`http://localhost:3000`
- 生产环境：`https://travis-blog.vercel.app`

#### ✅ Authorized redirect URIs（授权重定向 URI）
必须包含：
- 开发环境：`http://localhost:3000/api/auth/callback/google`
- 生产环境：`https://travis-blog.vercel.app/api/auth/callback/google`

#### ✅ Application type（应用类型）
- 应该是 **Web application**

---

### 步骤 3: 检查 OAuth Consent Screen（OAuth 同意屏幕）
1. 导航到 **APIs & Services** > **OAuth consent screen**
2. 检查以下配置：

#### User Type（用户类型）
- **External**（外部用户）- 如果应用面向所有 Google 用户
- **Internal**（内部用户）- 如果应用仅面向组织内用户

#### App Information（应用信息）
- App name（应用名称）
- User support email（用户支持邮箱）
- Developer contact information（开发者联系信息）

#### Scopes（作用域）
- 至少需要 `email` 和 `profile` 作用域

#### Test users（测试用户）
- 如果应用处于 **Testing** 状态，需要添加测试用户的邮箱地址
- 只有测试用户才能使用 OAuth 登录

#### Publishing Status（发布状态）
- **Testing** - 仅测试用户可以使用
- **In production** - 所有用户都可以使用（需要 Google 审核）

---

## 🐛 常见问题及解决方案

### 问题 1: `redirect_uri_mismatch`
**错误信息：** `Error 400: redirect_uri_mismatch`

**原因：**
- 回调 URL 未在 Google Cloud Console 中配置
- 回调 URL 格式不正确

**解决方案：**
1. 在 Google Cloud Console 中添加正确的回调 URL：
   - 开发：`http://localhost:3000/api/auth/callback/google`
   - 生产：`https://travis-blog.vercel.app/api/auth/callback/google`
2. 确保 URL 格式完全匹配（包括协议、域名、路径）

---

### 问题 2: `invalid_client`
**错误信息：** `Error 401: invalid_client`

**原因：**
- Client ID 或 Client Secret 不正确
- 环境变量未正确设置

**解决方案：**
1. 检查 Vercel 环境变量是否与 Google Cloud Console 中的值匹配
2. 确保环境变量名称正确（`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`）
3. 重新部署应用以应用新的环境变量

---

### 问题 3: `access_denied`
**错误信息：** `Error 403: access_denied`

**原因：**
- 用户拒绝了授权
- 应用处于 Testing 状态，但用户不在测试用户列表中

**解决方案：**
1. 如果是用户拒绝，这是正常情况
2. 如果应用处于 Testing 状态，确保用户邮箱在测试用户列表中
3. 或者将应用发布到生产环境（需要 Google 审核）

---

### 问题 4: `OAuthSignin` 或 `OAuthCallback`
**错误信息：** NextAuth 错误代码 `OAuthSignin` 或 `OAuthCallback`

**原因：**
- NextAuth 处理 OAuth 回调时出错
- 可能是服务器端配置问题

**解决方案：**
1. 检查 Vercel 日志，查看具体错误信息
2. 检查 `NEXTAUTH_URL` 环境变量是否正确设置
3. 检查 `NEXTAUTH_SECRET` 环境变量是否设置
4. 检查数据库连接是否正常

---

## 📋 诊断清单

### 环境变量
- [ ] 本地 `.env.local` 中所有变量已配置
- [ ] Vercel 生产环境中所有变量已配置
- [ ] `NEXTAUTH_URL` 在生产环境中设置为 `https://travis-blog.vercel.app`

### Google Cloud Console
- [ ] OAuth 2.0 客户端已创建
- [ ] Authorized JavaScript origins 已配置（开发和生产）
- [ ] Authorized redirect URIs 已配置（开发和生产）
- [ ] Application type 为 "Web application"
- [ ] OAuth Consent Screen 已配置
- [ ] 如果应用处于 Testing 状态，测试用户列表已添加

### NextAuth 配置
- [ ] GoogleProvider 已正确配置
- [ ] 环境变量检查逻辑正确
- [ ] 回调处理逻辑完善
- [ ] 日志记录已添加

### 测试
- [ ] 本地开发环境测试通过
- [ ] 生产环境测试通过
- [ ] 浏览器控制台无错误
- [ ] 网络请求正常

---

## 🛠️ 下一步行动

### 立即执行
1. **检查 Vercel 环境变量**
   - 登录 Vercel Dashboard
   - 确认所有环境变量已正确设置
   - 特别注意 `NEXTAUTH_URL` 应该设置为 `https://travis-blog.vercel.app`

2. **检查 Google Cloud Console**
   - 验证回调 URL 配置
   - 验证 OAuth Consent Screen 配置
   - 如果应用处于 Testing 状态，添加测试用户

3. **测试 OAuth 流程**
   - 在本地开发环境测试
   - 在生产环境测试
   - 检查浏览器控制台和网络请求
   - 检查 Vercel 日志

### 如果问题仍然存在
1. 查看 Vercel 日志中的详细错误信息
2. 查看浏览器控制台中的错误信息
3. 查看网络请求的响应内容
4. 根据具体错误信息应用相应的解决方案

---

## 📚 相关资源

- [NextAuth.js Google Provider 文档](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 📝 诊断日志

### 代码修改
1. ✅ 添加了 `authorization` 参数配置到 GoogleProvider
2. ✅ 添加了开发环境下的配置状态日志

### 待测试
- [ ] 本地开发环境测试
- [ ] 生产环境测试
