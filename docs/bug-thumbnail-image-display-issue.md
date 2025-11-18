# 热门文章缩略图显示问题调查

**问题描述：** 当一篇文章中插入图片后，在热门文章的缩略图会无法正常显示。

**发现日期：** 2025-11-17  
**优先级：** 🔴 高  
**状态：** 🔍 调查中

---

## 🔍 问题分析

### 当前实现逻辑

在 `components/layout/Sidebar.tsx` 中，缩略图的显示逻辑如下：

```typescript
const thumbnailUrl = extractFirstImage(article.content || "") || generatePlaceholderThumbnail(article.title, index, popularArticles.length);

{thumbnailUrl.startsWith("data:") ? (
  <img src={thumbnailUrl} alt={article.title} />
) : (
  {thumbnailUrl ? (
    <Image
      src={thumbnailUrl}
      alt={article.title}
      fill
      className="object-cover"
      sizes="64px"
    />
  ) : (
    <span>{firstLetter}</span>
  )}
)}
```

### 可能的问题原因

1. **Next.js Image 组件域名限制**
   - Next.js 的 `Image` 组件默认只允许加载来自同域的图片
   - 如果图片存储在 Vercel Blob Storage，URL 格式为：`https://[store].public.blob.vercel-storage.com/...`
   - 需要在 `next.config.ts` 中配置 `images.remotePatterns` 才能加载外部域名图片

2. **相对路径问题**
   - 如果使用本地存储，`getUrl` 返回相对路径（如 `/uploads/image.jpg`）
   - 相对路径在 Vercel 环境中可能无法正确加载（因为文件存储在 `/tmp`，不是 `public` 文件夹）

3. **图片加载失败无回退**
   - 当 `Image` 组件加载失败时，没有错误处理或回退到占位符
   - 用户只会看到空白或破损的图片图标

4. **Vercel Blob Storage URL 格式**
   - Vercel Blob Storage 返回的 URL 是完整的 HTTPS URL
   - 需要确保 Next.js 配置允许加载这些域名

---

## 🧪 测试结果

### 单元测试

已创建以下测试文件来验证问题：

1. **`tests/__tests__/unit/thumbnail-image-extraction.test.ts`**
   - 测试 `extractFirstImage` 函数的各种场景
   - ✅ 所有测试通过（28/28）

2. **`tests/__tests__/unit/sidebar-thumbnail-display.test.ts`**
   - 测试缩略图选择逻辑
   - 测试各种 URL 格式的处理
   - ✅ 所有测试通过（21/21）

### 测试发现

1. `extractFirstImage` 函数工作正常，能够正确提取图片 URL
2. URL 格式检测逻辑正常（data URI vs 普通 URL）
3. **问题可能在于 Next.js Image 组件的配置或错误处理**

---

## 🔧 解决方案

### 方案 1: 配置 Next.js Image 组件允许外部域名（推荐）

在 `next.config.ts` 中添加 `images.remotePatterns` 配置：

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // ... 其他配置
};
```

### 方案 2: 添加错误处理和回退机制

在 `Sidebar.tsx` 中为 `Image` 组件添加 `onError` 处理，加载失败时回退到占位符：

```typescript
<Image
  src={thumbnailUrl}
  alt={article.title}
  fill
  className="object-cover"
  sizes="64px"
  onError={() => {
    // 回退到占位符
    setThumbnailUrl(generatePlaceholderThumbnail(article.title, index, popularArticles.length));
  }}
/>
```

**注意：** 由于 `Sidebar` 是 Server Component，需要使用 Client Component 来处理错误状态。

### 方案 3: 使用普通 img 标签替代 Image 组件

对于外部图片，使用普通的 `<img>` 标签而不是 Next.js 的 `Image` 组件：

```typescript
{thumbnailUrl.startsWith("data:") || thumbnailUrl.startsWith("http") ? (
  <img
    src={thumbnailUrl}
    alt={article.title}
    className="w-full h-full object-cover"
    onError={(e) => {
      // 加载失败时显示占位符
      e.currentTarget.src = generatePlaceholderThumbnail(article.title, index, popularArticles.length);
    }}
  />
) : (
  <Image
    src={thumbnailUrl}
    alt={article.title}
    fill
    className="object-cover"
    sizes="64px"
  />
)}
```

---

## 📋 实施步骤

1. ✅ 回退首字冲突验证代码
2. ✅ 创建单元测试验证问题
3. ⏳ 检查 `next.config.ts` 配置
4. ⏳ 实施解决方案（配置 Image 组件或添加错误处理）
5. ⏳ 测试验证修复效果

---

## 🔗 相关文件

- `components/layout/Sidebar.tsx` - 缩略图显示逻辑
- `lib/utils/image-extractor.ts` - 图片提取函数
- `next.config.ts` - Next.js 配置
- `lib/storage/vercel-blob.ts` - Vercel Blob Storage 实现
- `tests/__tests__/unit/thumbnail-image-extraction.test.ts` - 单元测试
- `tests/__tests__/unit/sidebar-thumbnail-display.test.ts` - 显示逻辑测试

---

**下一步：** 检查并修复 Next.js Image 组件配置或添加错误处理机制。

