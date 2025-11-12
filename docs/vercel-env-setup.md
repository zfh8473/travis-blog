# Vercel 环境变量配置指南

## 快速配置步骤

### 1. 生成 NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

**已生成的密钥（请保存）：**
```
muHsNCbwL/X6waFfiKEaWS+ACAbF268F4mwL0aYnOmo=
```

### 2. 在 Vercel Dashboard 中配置环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `travis-blog`（如果还没有，先连接 GitHub 仓库）
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：

#### 必需变量（Production + Preview）

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | 生产数据库连接字符串（Neon 或其他 PostgreSQL 服务） |
| `NEXTAUTH_SECRET` | `muHsNCbwL/X6waFfiKEaWS+ACAbF268F4mwL0aYnOmo=` | NextAuth.js 密钥（使用上面生成的） |
| `NEXTAUTH_URL` | `https://travis-blog.vercel.app` | 生产环境 URL（部署后会自动生成） |

#### 可选变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `STORAGE_TYPE` | `local` | 存储类型（默认：local） |

### 3. 环境变量配置说明

**Production 环境：**
- 用于生产部署（main 分支）
- 使用生产数据库 URL
- NEXTAUTH_URL 设置为生产域名

**Preview 环境：**
- 用于 PR 预览部署
- 可以使用测试数据库
- NEXTAUTH_URL 会自动设置为预览 URL

**Development 环境：**
- 通常不需要（使用本地 `.env.local`）

## 数据库连接字符串格式

**Neon PostgreSQL 示例：**
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

**重要：**
- 必须包含 `?sslmode=require` 参数
- 确保数据库允许来自 Vercel 的连接

## 验证配置

配置完成后，触发一次部署并检查：
1. 构建日志中无错误
2. 数据库连接成功
3. 应用正常运行

