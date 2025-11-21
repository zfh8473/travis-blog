# 邮件服务集成计划

**日期：** 2025-01-20  
**负责人：** Winston (Architect) + Amelia (DEV)  
**状态：** 🚧 进行中

---

## 📋 任务概述

集成邮件服务以完成找回密码功能的邮件发送功能。

**当前状态：**
- ✅ 忘记密码页面已创建
- ✅ 密码重置页面已创建
- ✅ API 端点已创建
- ✅ 数据库字段已添加
- ⏳ 邮件发送功能待实现（当前仅记录到控制台）

---

## 🎯 目标

1. 选择并集成邮件服务（推荐 Resend）
2. 实现密码重置邮件发送功能
3. 测试完整流程
4. 更新文档

---

## 🔍 邮件服务选项评估

### 选项 1: Resend（推荐）⭐

**优势：**
- 专为开发者设计，API 简单易用
- 免费额度：每月 3,000 封邮件
- 支持 React Email 模板
- 良好的 Next.js 集成
- 快速设置

**劣势：**
- 相对较新的服务（但稳定）

**定价：**
- 免费：3,000 封/月
- 付费：$20/月起（50,000 封/月）

**文档：**
- [Resend 文档](https://resend.com/docs)
- [Resend Next.js 集成](https://resend.com/docs/send-with-nextjs)

---

### 选项 2: SendGrid

**优势：**
- 成熟稳定
- 免费额度：每月 100 封邮件
- 功能丰富

**劣势：**
- API 相对复杂
- 免费额度较少

---

### 选项 3: AWS SES

**优势：**
- 成本低（$0.10/1000 封）
- 高可靠性

**劣势：**
- 设置复杂
- 需要 AWS 账户

---

## ✅ 推荐方案：Resend

**理由：**
1. 简单易用，快速集成
2. 免费额度足够初期使用
3. 良好的 Next.js 支持
4. 适合小型项目

---

## 📝 实施计划

### 步骤 1: 安装 Resend SDK

```bash
npm install resend
```

---

### 步骤 2: 创建 Resend 客户端

**文件：** `lib/email/resend.ts`

```typescript
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
```

---

### 步骤 3: 创建邮件模板

**文件：** `lib/email/templates/password-reset.tsx`

```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface PasswordResetEmailProps {
  resetUrl: string;
  userName?: string;
}

export function PasswordResetEmail({
  resetUrl,
  userName,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={title}>重置您的密码</Text>
          <Text style={paragraph}>
            {userName ? `您好，${userName}` : '您好'}，
          </Text>
          <Text style={paragraph}>
            我们收到了您重置密码的请求。请点击下面的按钮来重置您的密码：
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              重置密码
            </Button>
          </Section>
          <Text style={paragraph}>
            如果按钮无法点击，请复制以下链接到浏览器中打开：
          </Text>
          <Text style={link}>{resetUrl}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            此链接将在 24 小时后过期。如果您没有请求重置密码，请忽略此邮件。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// 样式定义
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const title = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  margin: '0 0 20px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#484848',
  margin: '0 0 15px',
};

const buttonContainer = {
  padding: '27px 0 27px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  width: '200px',
  margin: '0 auto',
};

const link = {
  fontSize: '14px',
  color: '#2563eb',
  wordBreak: 'break-all' as const,
  margin: '0 0 15px',
};

const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
};
```

---

### 步骤 4: 实现邮件发送功能

**文件：** `lib/email/send-password-reset.ts`

```typescript
import { resend } from './resend';
import { PasswordResetEmail } from './templates/password-reset';

interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
  userName?: string;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName,
}: SendPasswordResetEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Travis Blog <noreply@yourdomain.com>',
      to,
      subject: '重置您的密码 - Travis Blog',
      react: PasswordResetEmail({ resetUrl, userName }),
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    return data;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    throw error;
  }
}
```

---

### 步骤 5: 更新忘记密码 API

**文件：** `app/api/auth/forgot-password/route.ts`

在生成 token 后，调用邮件发送函数：

```typescript
import { sendPasswordResetEmail } from '@/lib/email/send-password-reset';

// ... existing code ...

// 生成重置 URL
const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

// 发送邮件
try {
  await sendPasswordResetEmail({
    to: user.email,
    resetUrl,
    userName: user.name || undefined,
  });
  console.log('Password reset email sent successfully');
} catch (error) {
  console.error('Failed to send password reset email:', error);
  // 即使邮件发送失败，也返回成功（安全考虑）
  // 但记录错误以便排查
}
```

---

### 步骤 6: 配置环境变量

**本地开发（.env.local）：**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Travis Blog <noreply@yourdomain.com>
```

**Vercel 生产环境：**
1. 登录 Vercel Dashboard
2. 进入项目 Settings > Environment Variables
3. 添加：
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`

---

## 📋 实施 checklist

- [ ] 安装 Resend SDK
- [ ] 创建 Resend 客户端
- [ ] 安装 React Email 组件（如果需要）
- [ ] 创建邮件模板
- [ ] 实现邮件发送函数
- [ ] 更新忘记密码 API
- [ ] 配置环境变量（本地）
- [ ] 配置环境变量（Vercel）
- [ ] 测试邮件发送（本地）
- [ ] 测试邮件发送（生产）
- [ ] 测试完整流程
- [ ] 更新文档

---

## 🔒 安全考虑

1. **API 密钥安全：**
   - 永远不要将 API 密钥提交到 Git
   - 使用环境变量存储
   - 定期轮换密钥

2. **邮件内容安全：**
   - 不包含敏感信息
   - Token 有效期限制（24 小时）
   - 一次性使用 Token

3. **错误处理：**
   - 即使邮件发送失败，也返回成功（防止邮件枚举）
   - 记录错误日志以便排查

---

## 📚 相关资源

- [Resend 文档](https://resend.com/docs)
- [Resend Next.js 集成](https://resend.com/docs/send-with-nextjs)
- [React Email](https://react.email/)

---

## ⏱️ 预计时间

- 安装和配置：30 分钟
- 实现邮件模板：1 小时
- 实现发送功能：30 分钟
- 测试和调试：1 小时
- **总计：** 约 3 小时

---

**下一步：** 开始实施步骤 1-6

