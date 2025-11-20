# 登录/注册功能改进讨论

**日期：** 2025-01-XX  
**参与者：** John (PM), Winston (Architect), Sally (UX Designer), Amelia (DEV)  
**状态：** 📋 讨论中

---

## 📋 问题清单

### 1. 移除 GitHub 登录，只保留 Google
**问题描述：** 用户希望去掉 GitHub 登录选项，只保留 Google OAuth。

**影响范围：**
- 登录页面 UI
- NextAuth 配置
- OAuth 回调处理逻辑

---

### 2. Google 登录功能不好用
**问题描述：** 当前 Google OAuth 登录存在问题，需要诊断和修复。

**可能原因：**
- Google OAuth 配置不正确（Client ID/Secret）
- 回调 URL 配置错误
- 环境变量未正确设置
- NextAuth 配置问题

---

### 3. 注册页面缺少密码确认校验
**问题描述：** 注册页面没有"确认密码"字段，用户可能输入错误的密码。

**影响：**
- 用户体验：用户可能因为输入错误而无法登录
- 数据完整性：没有二次确认机制

---

### 4. 缺少找回密码功能
**问题描述：** 用户忘记密码时无法找回，只能重新注册。

**影响：**
- 用户体验：用户可能因为忘记密码而流失
- 安全性：需要实现安全的密码重置流程

---

## 💡 解决方案讨论

### John (PM) - 产品经理视角

**优先级排序：**
1. **高优先级：** 移除 GitHub 登录（简单，快速完成）
2. **高优先级：** 修复 Google 登录（影响核心功能）
3. **中优先级：** 添加密码确认校验（提升用户体验）
4. **中优先级：** 实现找回密码功能（需要更多开发工作）

**建议实施顺序：**
1. 先移除 GitHub 登录
2. 诊断并修复 Google 登录问题
3. 添加密码确认校验
4. 实现找回密码功能

---

### Sally (UX Designer) - 用户体验视角

**UI/UX 改进建议：**

#### 1. 移除 GitHub 登录
- 简化登录页面，减少用户选择
- 只保留 Google 登录按钮，视觉更清晰

#### 2. Google 登录优化
- 提供清晰的错误提示
- 添加加载状态指示
- 优化按钮样式和位置

#### 3. 密码确认字段
- 添加"确认密码"输入框
- 实时验证两次密码是否一致
- 提供清晰的错误提示
- 密码强度指示器（可选）

#### 4. 找回密码功能
- 在登录页面添加"忘记密码？"链接
- 创建密码重置页面
- 发送密码重置邮件
- 提供清晰的流程指引

**设计建议：**
- 保持表单简洁，避免信息过载
- 使用清晰的错误提示和成功反馈
- 确保移动端体验良好

---

### Winston (Architect) - 架构师视角

**技术方案：**

#### 1. 移除 GitHub 登录
- 从 `app/api/auth/[...nextauth]/route.ts` 移除 GitHubProvider
- 从登录页面移除 GitHub 按钮
- 清理相关的 OAuth 回调处理逻辑

#### 2. Google 登录诊断和修复
**诊断步骤：**
1. 检查环境变量配置
2. 验证 Google Cloud Console 配置
3. 检查回调 URL 是否正确
4. 查看 NextAuth 日志
5. 测试 OAuth 流程

**可能的修复：**
- 更新 GoogleProvider 配置
- 修复回调 URL
- 添加更详细的错误日志
- 优化错误处理

#### 3. 密码确认校验
**实现方案：**
- 在注册表单中添加 `confirmPassword` 字段
- 客户端实时验证
- 服务器端验证（Zod schema）
- 更新 `registrationSchema` 验证规则

#### 4. 找回密码功能
**架构设计：**
- 创建密码重置请求 API (`POST /api/auth/forgot-password`)
- 创建密码重置页面 (`/reset-password`)
- 创建密码重置处理 API (`POST /api/auth/reset-password`)
- 使用 JWT token 或随机 token 进行安全验证
- 实现邮件发送功能（使用 Resend 或类似服务）
- Token 有效期：24 小时
- Token 一次性使用

**数据库变更：**
- 可选：添加 `passwordResetToken` 和 `passwordResetExpires` 字段到 User 模型

**安全考虑：**
- 防止暴力破解（rate limiting）
- Token 加密存储
- 防止邮件枚举攻击

---

### Amelia (DEV) - 开发工程师视角

**实施计划：**

#### Phase 1: 移除 GitHub 登录（快速）
1. 修改 `app/api/auth/[...nextauth]/route.ts` - 移除 GitHubProvider
2. 修改 `app/login/page.tsx` - 移除 GitHub 按钮
3. 清理 OAuth 回调中的 GitHub 相关逻辑
4. 测试：确保 Google 登录仍然工作

**预计时间：** 30 分钟

---

#### Phase 2: 修复 Google 登录（诊断 + 修复）
1. **诊断步骤：**
   - 检查 `.env.local` 中的 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`
   - 验证 Google Cloud Console 配置
   - 检查回调 URL：`/api/auth/callback/google`
   - 添加详细的错误日志
   - 测试 OAuth 流程

2. **修复步骤：**
   - 根据诊断结果修复配置
   - 优化错误处理
   - 添加用户友好的错误提示

**预计时间：** 1-2 小时（取决于问题复杂度）

---

#### Phase 3: 添加密码确认校验（中等复杂度）
1. 修改 `app/register/page.tsx`：
   - 添加 `confirmPassword` 字段到 formData
   - 添加确认密码输入框
   - 实现实时验证逻辑
   - 更新错误处理

2. 修改 `lib/validations/auth.ts`：
   - 更新 `registrationSchema` 添加 `confirmPassword` 字段
   - 添加密码匹配验证

3. 修改 `app/api/auth/register/route.ts`：
   - 添加服务器端密码确认验证

**预计时间：** 1 小时

---

#### Phase 4: 实现找回密码功能（复杂）
1. **数据库迁移（可选）：**
   - 添加 `passwordResetToken` 和 `passwordResetExpires` 字段

2. **API 路由：**
   - `POST /api/auth/forgot-password` - 发送密码重置邮件
   - `POST /api/auth/reset-password` - 处理密码重置

3. **页面：**
   - `/forgot-password` - 忘记密码页面
   - `/reset-password?token=xxx` - 密码重置页面

4. **邮件服务：**
   - 配置邮件发送服务（Resend 或类似）
   - 创建密码重置邮件模板

5. **安全措施：**
   - Rate limiting
   - Token 验证
   - 防止邮件枚举

**预计时间：** 3-4 小时

---

## 📝 实施计划总结

### 立即实施（Phase 1-2）
1. ✅ 移除 GitHub 登录
2. ✅ 诊断并修复 Google 登录

### 短期实施（Phase 3）
3. ✅ 添加密码确认校验

### 中期实施（Phase 4）
4. ✅ 实现找回密码功能

---

## ✅ 团队决策

**一致同意按照以下顺序实施：**
1. Phase 1: 移除 GitHub 登录
2. Phase 2: 修复 Google 登录
3. Phase 3: 添加密码确认校验
4. Phase 4: 实现找回密码功能

**开始实施时间：** 立即

