# Google OAuth 登录问题诊断指南

**创建日期：** 2025-01-XX  
**状态：** 📋 诊断中

---

## 🔍 诊断步骤

### 1. 检查环境变量

**本地开发环境：**
```bash
# 检查 .env.local 文件
cat .env.local | grep GOOGLE

# 应该包含：
# GOOGLE_CLIENT_ID=your-client-id
# GOOGLE_CLIENT_SECRET=your-client-secret
```

**生产环境（Vercel）：**
1. 登录 Vercel Dashboard
2. 进入项目设置
3. 检查 Environment Variables
4. 确认 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 已设置

---

### 2. 验证 Google Cloud Console 配置

**检查项目：**
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择正确的项目
3. 导航到 "APIs & Services" > "Credentials"

**检查 OAuth 2.0 Client：**
- ✅ Client ID 和 Client Secret 是否与环境变量匹配
- ✅ Application type 是否为 "Web application"
- ✅ Authorized JavaScript origins 是否包含：
  - 开发环境：`http://localhost:3000`
  - 生产环境：`https://travis-blog.vercel.app`
- ✅ Authorized redirect URIs 是否包含：
  - 开发环境：`http://localhost:3000/api/auth/callback/google`
  - 生产环境：`https://travis-blog.vercel.app/api/auth/callback/google`

---

### 3. 检查 NextAuth 配置

**文件：** `app/api/auth/[...nextauth]/route.ts`

**检查点：**
- ✅ GoogleProvider 是否正确导入
- ✅ 环境变量检查逻辑是否正确
- ✅ Callback URL 配置是否正确

**当前配置：**
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
})
```

---

### 4. 测试 OAuth 流程

**步骤：**
1. 访问登录页面：`/login`
2. 点击 "Sign in with Google"
3. 观察浏览器控制台和网络请求
4. 检查 Vercel 日志

**常见错误：**

**错误 1：`redirect_uri_mismatch`**
- **原因：** 回调 URL 未在 Google Cloud Console 中配置
- **解决：** 在 Google Cloud Console 中添加正确的回调 URL

**错误 2：`invalid_client`**
- **原因：** Client ID 或 Client Secret 不正确
- **解决：** 检查环境变量是否与 Google Cloud Console 中的值匹配

**错误 3：`access_denied`**
- **原因：** 用户拒绝了授权
- **解决：** 这是正常情况，用户可以选择不授权

**错误 4：`OAuthSignin` 或 `OAuthCallback`**
- **原因：** NextAuth 处理 OAuth 回调时出错
- **解决：** 检查服务器日志，查看具体错误信息

---

### 5. 添加详细日志

**在 `app/api/auth/[...nextauth]/route.ts` 中添加：**

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // 添加调试信息
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
})
```

**在 signIn callback 中添加日志：**
```typescript
async signIn({ user, account, profile }) {
  console.log("[OAuth] SignIn callback", {
    provider: account?.provider,
    email: user.email,
    hasAccount: !!account,
  });
  // ... existing code
}
```

---

### 6. 检查网络请求

**在浏览器开发者工具中：**
1. 打开 Network 标签
2. 点击 "Sign in with Google"
3. 检查请求：
   - `/api/auth/signin/google` - 应该重定向到 Google
   - Google 授权页面
   - `/api/auth/callback/google` - 回调处理

**检查点：**
- 请求状态码（应该是 200 或 302）
- 请求 URL 是否正确
- 响应内容

---

## 🛠️ 常见修复方案

### 修复 1: 更新回调 URL
如果回调 URL 不匹配，在 Google Cloud Console 中添加：
- 开发：`http://localhost:3000/api/auth/callback/google`
- 生产：`https://travis-blog.vercel.app/api/auth/callback/google`

### 修复 2: 重新生成 Client Secret
如果 Client Secret 泄露或丢失：
1. 在 Google Cloud Console 中删除旧的 OAuth Client
2. 创建新的 OAuth Client
3. 更新环境变量

### 修复 3: 检查 OAuth Consent Screen
确保 OAuth Consent Screen 已正确配置：
1. 用户类型（External 或 Internal）
2. 应用信息（名称、邮箱等）
3. 测试用户（如果需要）

---

## 📝 诊断清单

- [ ] 环境变量已正确设置（本地和生产）
- [ ] Google Cloud Console OAuth Client 已创建
- [ ] 回调 URL 已正确配置
- [ ] JavaScript origins 已正确配置
- [ ] OAuth Consent Screen 已配置
- [ ] NextAuth 配置正确
- [ ] 网络请求正常
- [ ] 服务器日志无错误

---

## 🔗 相关资源

- [NextAuth.js Google Provider 文档](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

