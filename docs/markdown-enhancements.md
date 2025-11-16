# Markdown 增强功能说明

**创建日期：** 2025-11-12  
**状态：** ✅ 已完成

---

## 功能概述

为 TiptapEditor 富文本编辑器添加了完整的 Markdown 支持，包括：

1. **Markdown 源码模式** - 支持直接编辑 Markdown 源码
2. **Markdown 预览面板** - 实时预览编辑内容
3. **Markdown 导出功能** - 导出为 `.md` 文件

---

## 新增功能

### 1. Markdown 源码模式 ✅

**功能描述：**
- 点击工具栏的 "Markdown" 按钮切换到源码模式
- 在源码模式下，可以直接编辑 Markdown 格式的文本
- 切换回可视化模式时，Markdown 会自动转换为 HTML 并显示

**使用方法：**
1. 点击工具栏左侧的 "Markdown" 按钮
2. 在文本框中直接输入 Markdown 语法
3. 点击 "可视化" 按钮切换回可视化编辑模式

**支持的 Markdown 语法：**
- 标题：`# H1`, `## H2`, `### H3` 等
- 粗体：`**文本**`
- 斜体：`*文本*`
- 列表：`- 无序列表` 或 `1. 有序列表`
- 链接：`[文本](URL)`
- 图片：`![alt](URL)`
- 代码：`` `行内代码` `` 或 ` ```代码块``` `
- 引用：`> 引用内容`

---

### 2. Markdown 预览面板 ✅

**功能描述：**
- 在可视化编辑模式下，可以开启预览面板
- 预览面板显示编辑内容的实时渲染效果
- 支持分屏显示（左侧编辑，右侧预览）

**使用方法：**
1. 在可视化编辑模式下，点击 "显示预览" 按钮
2. 编辑器会分为两栏：左侧编辑区，右侧预览区
3. 编辑内容会实时在预览区显示
4. 点击 "隐藏预览" 按钮关闭预览面板

**预览特性：**
- 实时同步：编辑内容变化时，预览自动更新
- 样式一致：预览样式与文章最终显示样式一致
- 滚动独立：编辑区和预览区可以独立滚动

---

### 3. Markdown 导出功能 ✅

**功能描述：**
- 可以将当前编辑内容导出为 Markdown 文件
- 支持从可视化模式和源码模式导出
- 导出的文件名为 `article-{timestamp}.md`

**使用方法：**
1. 点击工具栏的 "导出 MD" 按钮
2. 浏览器会自动下载 Markdown 文件
3. 文件包含当前编辑的所有内容（Markdown 格式）

**导出格式：**
- 标题转换为 `#`, `##`, `###` 等
- 粗体转换为 `**文本**`
- 斜体转换为 `*文本*`
- 列表转换为 `-` 或 `1.`
- 链接转换为 `[文本](URL)`
- 图片转换为 `![alt](URL)`

---

## 技术实现

### 依赖包

**新增依赖：**
- `turndown` - HTML 转 Markdown
- `@types/turndown` - TypeScript 类型定义

**已有依赖（devDependencies）：**
- `markdown-it` - Markdown 转 HTML
- `prosemirror-markdown` - ProseMirror Markdown 支持

### 核心文件

1. **`lib/utils/markdown-converter.ts`**
   - `htmlToMarkdown()` - HTML 转 Markdown
   - `markdownToHtml()` - Markdown 转 HTML
   - `isValidMarkdown()` - Markdown 验证

2. **`components/editor/TiptapEditor.tsx`**
   - 添加了 Markdown 模式切换逻辑
   - 添加了预览面板组件
   - 添加了导出功能

### 实现细节

**Markdown 转换：**
- 使用 `TurndownService` 进行 HTML → Markdown 转换
- 使用 `MarkdownIt` 进行 Markdown → HTML 转换
- 自定义图片规则，确保图片正确转换

**状态管理：**
- 使用 `useState` 管理 Markdown 模式状态
- 使用 `useRef` 在 `onUpdate` 回调中访问最新状态
- 自动同步可视化模式和源码模式的内容

**UI 布局：**
- 使用 CSS Grid 实现分屏预览
- 响应式设计，适配不同屏幕尺寸
- 使用 Tailwind CSS 进行样式设计

---

## 使用示例

### 示例 1：在 Markdown 模式下编辑

```markdown
# 文章标题

这是一段**粗体**文本和*斜体*文本。

## 二级标题

- 列表项 1
- 列表项 2
- 列表项 3

[链接文本](https://example.com)

![图片描述](/path/to/image.jpg)
```

### 示例 2：导出 Markdown

1. 在编辑器中输入内容
2. 点击 "导出 MD" 按钮
3. 下载的文件内容：

```markdown
# 文章标题

这是一段**粗体**文本和*斜体*文本。
```

---

## 工具栏按钮说明

| 按钮 | 功能 | 说明 |
|------|------|------|
| **Markdown** | 切换源码模式 | 在可视化编辑和 Markdown 源码之间切换 |
| **显示预览** / **隐藏预览** | 切换预览面板 | 在可视化模式下显示/隐藏预览面板 |
| **导出 MD** | 导出 Markdown | 将当前内容导出为 `.md` 文件 |

---

## 注意事项

1. **模式切换：**
   - 从可视化模式切换到 Markdown 模式时，内容会自动转换为 Markdown
   - 从 Markdown 模式切换回可视化模式时，Markdown 会自动转换为 HTML

2. **内容同步：**
   - 在可视化模式下编辑时，Markdown 内容会自动同步
   - 在 Markdown 模式下编辑时，HTML 内容会自动同步

3. **图片处理：**
   - 图片在 Markdown 中显示为 `![alt](URL)` 格式
   - 导出时图片 URL 会保留

4. **格式限制：**
   - 某些复杂的 HTML 格式可能无法完美转换为 Markdown
   - 建议在 Markdown 模式下编辑以获得最佳兼容性

---

## 测试建议

### 测试场景 1：Markdown 源码编辑
1. 点击 "Markdown" 按钮切换到源码模式
2. 输入 Markdown 语法（如 `# 标题`）
3. 点击 "可视化" 按钮切换回可视化模式
4. 验证内容是否正确显示

### 测试场景 2：预览功能
1. 在可视化模式下输入内容
2. 点击 "显示预览" 按钮
3. 验证预览面板是否正确显示
4. 编辑内容，验证预览是否实时更新

### 测试场景 3：导出功能
1. 输入一些内容（可视化或 Markdown 模式）
2. 点击 "导出 MD" 按钮
3. 验证文件是否正确下载
4. 打开文件，验证内容格式是否正确

---

## 后续优化建议

1. **Markdown 语法高亮：**
   - 在 Markdown 源码模式下添加语法高亮
   - 使用 `react-syntax-highlighter` 或类似库

2. **Markdown 快捷键：**
   - 添加快捷键切换模式（如 `Ctrl+M`）
   - 添加快捷键切换预览（如 `Ctrl+P`）

3. **Markdown 导入：**
   - 支持从 `.md` 文件导入内容
   - 自动检测并转换 Markdown 格式

4. **Markdown 工具栏：**
   - 在 Markdown 模式下添加常用语法快捷按钮
   - 如：插入链接、插入图片等

---

## 总结

✅ **所有 Markdown 增强功能已实现：**
- Markdown 源码模式
- Markdown 预览面板
- Markdown 导出功能

✅ **技术实现：**
- 使用 `turndown` 和 `markdown-it` 进行格式转换
- 状态管理和内容同步逻辑完善
- UI 设计符合用户体验

现在您可以在创建文章时：
- 直接编辑 Markdown 源码
- 实时预览编辑效果
- 导出为 Markdown 文件

享受更灵活的 Markdown 编辑体验！

