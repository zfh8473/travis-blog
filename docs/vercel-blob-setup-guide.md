# Vercel Blob Storage 配置指南

本指南将帮助您在 Vercel Dashboard 中配置 Vercel Blob Storage 环境变量。

## 📋 前置条件

- ✅ 已创建名为 `travis-blog` 的 Blob Store
- ✅ 已登录 Vercel Dashboard
- ✅ 项目已连接到 Vercel

## 🔧 配置步骤

### 步骤 1: 获取 Blob Read/Write Token

1. **登录 Vercel Dashboard**
   - 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - 使用您的账号登录

2. **进入项目设置**
   - 在 Dashboard 中找到并点击 `travis-blog` 项目

3. **导航到 Storage**
   - 在项目页面顶部，点击 **Storage** 标签
   - 或者点击左侧菜单中的 **Storage**

4. **选择 Blob Store**
   - 在 Storage 页面中，找到 `travis-blog` Blob Store
   - 点击进入该 Store 的详情页面

5. **获取 Token**
   - 在 Store 详情页面中，找到 **Tokens** 或 **API Tokens** 部分
   - 找到 **Read/Write Token**（读写令牌）
   - 点击 **Copy** 或 **Show** 按钮复制 Token
   - ⚠️ **重要**：请妥善保存此 Token，它只显示一次

### 步骤 2: 配置环境变量

1. **进入环境变量设置**
   - 在项目页面，点击顶部菜单中的 **Settings**
   - 在左侧菜单中，点击 **Environment Variables**

2. **添加环境变量**

   按照以下顺序添加以下环境变量：

   #### 变量 1: STORAGE_TYPE
   - **Key**: `STORAGE_TYPE`
   - **Value**: `vercel-blob`
   - **Environment**: 选择 **Production**、**Preview** 和 **Development**（如果需要本地测试）
   - 点击 **Save**

   #### 变量 2: BLOB_READ_WRITE_TOKEN
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: 粘贴您在第 1 步中复制的 Read/Write Token
   - **Environment**: 选择 **Production**、**Preview** 和 **Development**（如果需要本地测试）
   - 点击 **Save**

   #### 变量 3: BLOB_STORE_NAME（可选）
   - **Key**: `BLOB_STORE_NAME`
   - **Value**: `travis-blog`
   - **Environment**: 选择 **Production**、**Preview** 和 **Development**（如果需要本地测试）
   - 点击 **Save**
   - ⚠️ **注意**：如果您的 Blob Store 名称是 `travis-blog`，此变量可以省略（代码中已设置默认值）

### 步骤 3: 验证配置

1. **检查环境变量列表**
   - 在 Environment Variables 页面，确认以下变量已添加：
     - ✅ `STORAGE_TYPE` = `vercel-blob`
     - ✅ `BLOB_READ_WRITE_TOKEN` = `vercel_blob_xxx...`
     - ✅ `BLOB_STORE_NAME` = `travis-blog`（可选）

2. **触发重新部署**
   - 环境变量配置后，需要重新部署才能生效
   - 方法 1：推送代码到 GitHub（如果已连接）
   - 方法 2：在 Vercel Dashboard 中，进入 **Deployments** 页面
   - 找到最新的部署，点击右侧的 **...** 菜单
   - 选择 **Redeploy**

3. **检查部署日志**
   - 部署开始后，进入部署详情页面
   - 查看构建日志，确认没有错误
   - 特别检查是否有关于 `BLOB_READ_WRITE_TOKEN` 的错误

## 🧪 测试配置

部署完成后，测试图片上传功能：

1. **登录管理员账号**
   - 访问 `https://travis-blog.vercel.app/login`
   - 使用管理员账号登录

2. **测试图片上传**
   - 访问 `https://travis-blog.vercel.app/admin/articles/new`
   - 在 Markdown 编辑器中，尝试拖拽或粘贴一张图片
   - 验证图片是否成功上传并显示

3. **检查图片 URL**
   - 上传成功后，图片应该显示在编辑器中
   - 右键点击图片，选择"复制图片地址"
   - 验证 URL 是否为 Vercel Blob Storage 的 URL（格式类似：`https://[store].public.blob.vercel-storage.com/...`）

## ❌ 常见问题

### 问题 1: "BLOB_READ_WRITE_TOKEN environment variable is required"

**原因**：环境变量未正确配置或未重新部署

**解决方案**：
1. 检查 Vercel Dashboard 中的环境变量是否正确添加
2. 确认环境变量已应用到正确的环境（Production/Preview）
3. 重新部署项目

### 问题 2: "Blob store not found"

**原因**：Blob Store 名称不匹配或 Token 没有访问权限

**解决方案**：
1. 确认 Blob Store 名称是 `travis-blog`
2. 检查 Token 是否有正确的权限（Read/Write）
3. 确认 Token 是从正确的 Blob Store 复制的

### 问题 3: 图片上传失败

**原因**：可能是认证问题或存储配置问题

**解决方案**：
1. 检查浏览器控制台是否有错误信息
2. 检查 Vercel 部署日志中的错误
3. 确认 `STORAGE_TYPE` 环境变量设置为 `vercel-blob`

## 📝 环境变量总结

| 变量名 | 值 | 必需 | 说明 |
|--------|-----|------|------|
| `STORAGE_TYPE` | `vercel-blob` | ✅ 是 | 指定使用 Vercel Blob Storage |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_xxx...` | ✅ 是 | Blob Store 的读写令牌 |
| `BLOB_STORE_NAME` | `travis-blog` | ❌ 否 | Blob Store 名称（默认值） |

## 🔗 相关链接

- [Vercel Blob Storage 文档](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [项目环境变量配置](https://vercel.com/docs/projects/environment-variables)

---

**配置完成后，请重新部署项目以应用新的环境变量。**

