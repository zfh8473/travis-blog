# Markdown 渲染改进实施计划

**创建日期：** 2025-01-XX  
**负责人：** UX Designer + Dev  
**状态：** 🟡 待实施

---

## 📋 问题总结

### 当前问题

1. **代码块渲染失败** 🔴
   - 代码块被显示为普通文本
   - 缺少代码块样式（背景、边框、等宽字体）
   - 没有语法高亮

2. **样式不够现代化** ⚠️
   - 缺少 Tailwind Typography 插件支持
   - 排版间距不够优化
   - 视觉层次不够清晰

3. **缺少现代特性** ⚠️
   - 没有代码语法高亮
   - 没有目录导航
   - 代码块没有复制功能

---

## 🎯 改进目标

### 短期目标（P0/P1）
1. ✅ 修复代码块渲染问题
2. ✅ 安装并配置 Tailwind Typography 插件
3. ✅ 增强样式配置，提升视觉效果
4. ✅ 添加代码语法高亮

### 长期目标（P2）
5. ⏳ 添加目录导航（长文章）
6. ⏳ 添加代码复制功能
7. ⏳ 优化表格样式

---

## 🛠️ 实施步骤

### 步骤 1：安装 Tailwind Typography 插件

```bash
npm install @tailwindcss/typography
```

### 步骤 2：配置 Tailwind CSS v4

由于项目使用 Tailwind CSS v4（CSS-first 配置），需要在 `app/globals.css` 中导入 Typography 插件。

### 步骤 3：增强 ArticleDetail 组件样式

更新 `components/article/ArticleDetail.tsx`，使用更完善的 prose 类配置。

### 步骤 4：添加代码语法高亮

选择方案：
- **方案 A：Shiki**（推荐）- 服务端渲染，性能好
- **方案 B：Prism.js** - 客户端渲染，功能丰富

### 步骤 5：处理代码块渲染

确保 Markdown 转换时，代码块被正确转换为 `<pre><code>` 标签。

---

## 📝 详细实施计划

### Phase 1: 基础修复（P0）

**任务 1.1：安装 Tailwind Typography**
- 安装 `@tailwindcss/typography` 插件
- 配置 Tailwind CSS v4 使用 Typography 插件

**任务 1.2：修复代码块渲染**
- 检查 `markdownToHtml` 函数是否正确处理代码块
- 确保代码块被转换为 `<pre><code>` 标签
- 测试代码块渲染

**任务 1.3：增强样式配置**
- 更新 ArticleDetail 组件的 prose 类
- 添加更完善的样式配置
- 优化排版间距

### Phase 2: 功能增强（P1）

**任务 2.1：添加代码语法高亮**
- 选择语法高亮库（Shiki 或 Prism.js）
- 集成到 Markdown 渲染流程
- 测试多种语言的语法高亮

**任务 2.2：优化视觉样式**
- 优化标题层级
- 优化段落和列表样式
- 优化链接和引用块样式

### Phase 3: 高级功能（P2）

**任务 3.1：添加目录导航**
- 自动生成文章目录
- 固定侧边栏显示
- 点击目录跳转到对应章节

**任务 3.2：添加代码复制功能**
- 为代码块添加复制按钮
- 实现复制到剪贴板功能

---

## 🎨 样式改进示例

### 当前样式
```tsx
<article
  className="prose prose-lg max-w-none ..."
  dangerouslySetInnerHTML={{ __html: content }}
/>
```

### 改进后样式
```tsx
<article
  className="prose prose-lg prose-slate max-w-none
    prose-headings:font-bold prose-headings:text-gray-900
    prose-headings:mt-8 prose-headings:mb-4
    prose-h1:text-4xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3
    prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4
    prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
    prose-strong:text-gray-900 prose-strong:font-semibold
    prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 
    prose-code:rounded prose-code:font-mono prose-code:text-sm
    prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg 
    prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-gray-800
    prose-blockquote:border-l-blue-500 prose-blockquote:border-l-4 
    prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:bg-blue-50 
    prose-blockquote:py-2 prose-blockquote:rounded-r
    prose-ul:list-disc prose-ul:pl-6 prose-ul:my-6
    prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-6
    prose-li:my-2 prose-li:leading-relaxed
    prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
    prose-table:w-full prose-table:border-collapse
    prose-th:bg-gray-100 prose-th:font-semibold prose-th:p-3
    prose-td:p-3 prose-td:border prose-td:border-gray-200
    prose-hr:border-gray-300 prose-hr:my-8"
  dangerouslySetInnerHTML={{ __html: content }}
/>
```

---

## 📊 预期效果对比

### 改进前
- ❌ 代码块显示为普通文本
- ⚠️ 排版间距不够优化
- ⚠️ 视觉层次不够清晰
- ❌ 没有语法高亮

### 改进后
- ✅ 代码块正确显示（背景、边框、等宽字体）
- ✅ 优化的排版间距
- ✅ 清晰的视觉层次
- ✅ 代码语法高亮
- ✅ 现代化的样式

---

## 🚀 立即行动

**优先级：P0 - 必须立即修复**

1. 安装 `@tailwindcss/typography` 插件
2. 检查并修复代码块渲染问题
3. 增强 ArticleDetail 组件样式

**预计时间：** 1-2 小时

---

**最后更新：** 2025-01-XX  
**负责人：** UX Designer + Dev

