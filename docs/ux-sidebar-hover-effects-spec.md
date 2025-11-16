# 侧边栏悬停效果设计规范

## 概述
本文档定义了侧边栏中热门文章和标签云的精确悬停效果规范，确保实现与 mockup 完全一致。

## 1. 热门文章悬停效果

### HTML 结构
```html
<a href="#" class="popular-article">
    <div class="popular-article-thumb">N</div>
    <div class="popular-article-content">
        <div class="popular-article-title">Next.js 14 新特性深度解析</div>
        <div class="popular-article-meta">1.2k 阅读</div>
    </div>
</a>
```

### CSS 规范

#### `.popular-article` (容器)
```css
.popular-article {
    display: flex;
    gap: 0.75rem; /* 12px */
    padding: 0.5rem; /* 8px */
    margin: -0.5rem; /* -8px, 用于抵消 padding 的视觉影响 */
    border-radius: 0.5rem; /* 8px */
    text-decoration: none;
    color: inherit;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 与文章卡片相同的流畅过渡 */
    cursor: pointer;
}

.popular-article:hover {
    background-color: #f8fafc; /* slate-50 */
    transform: translateX(4px); /* 向右移动 4px */
}
```

**关键点：**
- 过渡时间：`0.3s` (300ms) - 与文章卡片一致
- 缓动函数：`cubic-bezier(0.4, 0, 0.2, 1)` - 与文章卡片相同的流畅缓动
- 移动距离：`translateX(4px)` (不是 8px 或 16px)
- 背景色：`#f8fafc` (slate-50)
- **设计意图**：与文章卡片的悬停效果保持一致的流畅度和视觉感受

#### `.popular-article-thumb` (缩略图)
```css
.popular-article-thumb {
    flex-shrink: 0;
    width: 4rem; /* 64px */
    height: 4rem; /* 64px */
    border-radius: 0.5rem; /* 8px */
    overflow: hidden;
    background-color: #f1f5f9; /* slate-100 */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem; /* 24px */
    font-weight: 700;
    color: #475569; /* slate-600 */
}

/* 如果有图片，使用 object-cover */
.popular-article-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
```

**关键点：**
- 尺寸：64x64px (4rem)
- 圆角：8px
- 背景色：slate-100
- 文字颜色：slate-600
- 字体大小：24px
- 字体粗细：700

#### `.popular-article-content` (内容容器)
```css
.popular-article-content {
    flex: 1;
    min-width: 0; /* 允许文本截断 */
}
```

#### `.popular-article-title` (标题)
```css
.popular-article-title {
    font-size: 0.875rem; /* 14px */
    font-weight: 500;
    color: #0f172a; /* slate-900 */
    line-height: 1.5;
    margin-bottom: 0.25rem; /* 4px */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease-out;
}

.popular-article:hover .popular-article-title {
    color: #3b82f6; /* blue-600 */
}
```

**关键点：**
- 字体大小：14px
- 字体粗细：500
- 悬停时颜色：blue-600
- 最多显示 2 行，超出部分省略

#### `.popular-article-meta` (元数据)
```css
.popular-article-meta {
    font-size: 0.75rem; /* 12px */
    color: #64748b; /* slate-500 */
    line-height: 1.5;
}
```

**关键点：**
- 字体大小：12px
- 颜色：slate-500
- 悬停时颜色不变

---

## 2. 标签云悬停效果

### HTML 结构
```html
<a href="#" class="tag-cloud-item">
    React (5)
</a>
```

### CSS 规范

#### `.tag-cloud-item` (标签)
```css
.tag-cloud-item {
    display: inline-block;
    padding: 0.375rem 0.75rem; /* 6px 12px */
    background-color: #dbeafe; /* blue-50 */
    color: #1e40af; /* blue-700 */
    border: 1px solid #bfdbfe; /* blue-200 */
    border-radius: 0.5rem; /* 8px */
    font-size: 0.875rem; /* 14px - 从 12px 调大 */
    font-weight: 500; /* 根据文章数量动态调整：bold/semibold/medium */
    text-decoration: none;
    transition: all 0.2s ease-out;
    cursor: pointer;
}

.tag-cloud-item:hover {
    background-color: #2563eb; /* blue-600 */
    color: #ffffff; /* white */
    border-color: #2563eb; /* blue-600 */
}
```

**关键点：**
- 过渡时间：`0.2s` (200ms)
- 缓动函数：`ease-out`
- **字体大小调整**：
  - 文章数量 >= 5：`text-base` (16px) + `font-bold` (700)
  - 文章数量 >= 3：`text-sm` (14px) + `font-semibold` (600)
  - 文章数量 < 3：`text-sm` (14px) + `font-medium` (500)
  - **所有标签最小字体为 14px**（从 12px 调大）
- 默认状态：
  - 背景：`#dbeafe` (blue-50)
  - 文字：`#1e40af` (blue-700)
  - 边框：`#bfdbfe` (blue-200)
- 悬停状态：
  - 背景：`#2563eb` (blue-600)
  - 文字：`#ffffff` (white)
  - 边框：`#2563eb` (blue-600)
- **注意：标签文本不包含 `#` 符号**

---

## 3. 分隔线规范

### CSS 规范
```css
.sidebar-section {
    /* 侧边栏部分容器 */
}

.sidebar-title {
    font-size: 1.125rem; /* 18px */
    font-weight: 700;
    color: #0f172a; /* slate-900 */
    margin-bottom: 1rem; /* 16px */
    display: flex;
    align-items: center;
    gap: 0.5rem; /* 8px */
}

/* 分隔线：标题和内容之间 */
.sidebar-title + .divider,
.sidebar-title::after {
    content: '';
    display: block;
    height: 1px;
    background-color: rgba(226, 232, 240, 0.8); /* slate-200 with 80% opacity */
    margin-bottom: 1rem; /* 16px */
    margin-top: 0;
}
```

**关键点：**
- 分隔线颜色：`rgba(226, 232, 240, 0.8)` (slate-200, 80% 不透明度)
- 分隔线高度：1px
- 分隔线位置：标题下方，内容上方
- 分隔线上下间距：各 16px (mb-4)

---

## 4. 实现检查清单

### 热门文章
- [x] 使用 `popular-article` 类名
- [x] 悬停时向右移动 `translateX(4px)`
- [x] 过渡时间 `0.3s`，缓动函数 `cubic-bezier(0.4, 0, 0.2, 1)` - 与文章卡片一致
- [x] 悬停时背景色变为 `slate-50`
- [x] 标题悬停时颜色变为 `blue-600`
- [x] 缩略图尺寸 64x64px
- [x] 标题最多显示 2 行

### 标签云
- [x] 标签文本不包含 `#` 符号
- [x] 悬停时背景色变为 `blue-600`
- [x] 悬停时文字颜色变为 `white`
- [x] 悬停时边框颜色变为 `blue-600`
- [x] 过渡时间 `0.2s`，缓动函数 `ease-out`
- [x] 字体大小调大：最小 `text-sm` (14px)，根据文章数量动态调整粗细

### 分隔线
- [ ] 每个部分标题和内容之间都有分隔线
- [ ] 分隔线颜色 `rgba(226, 232, 240, 0.8)`
- [ ] 分隔线高度 1px

---

## 5. Tailwind CSS 等价类

### 热门文章
```tsx
<Link className="popular-article flex gap-3 p-2 -m-2 rounded-lg transition-all duration-200 ease-out hover:bg-slate-50 hover:translate-x-1">
  <div className="popular-article-thumb flex-shrink-0 w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600">
    {/* 缩略图或首字母 */}
  </div>
  <div className="popular-article-content flex-1 min-w-0">
    <div className="popular-article-title text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
      {title}
    </div>
    <div className="popular-article-meta text-xs text-slate-500">
      {meta}
    </div>
  </div>
</Link>
```

**注意：** `hover:translate-x-1` 在 Tailwind 中是 4px，符合规范。

### 标签云
```tsx
<Link className="tag-cloud-item inline-block px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg transition-all duration-200 ease-out hover:bg-blue-600 hover:text-white hover:border-blue-600">
  {tagName}
  <span className="ml-1 text-xs opacity-75">({count})</span>
</Link>
```

---

## 6. 测试验证

### 视觉测试
1. 打开浏览器开发者工具
2. 悬停在热门文章上，检查：
   - 是否向右移动 4px
   - 背景色是否变为 slate-50
   - 标题颜色是否变为 blue-600
   - 过渡动画是否流畅（200ms）
3. 悬停在标签上，检查：
   - 背景色是否变为 blue-600
   - 文字颜色是否变为 white
   - 边框颜色是否变为 blue-600
   - 过渡动画是否流畅（200ms）

### 代码检查
- [ ] 所有类名与 mockup HTML 结构一致
- [ ] CSS 过渡时间统一为 200ms
- [ ] 缓动函数统一为 `ease-out`
- [ ] 移动距离精确为 4px (`translateX(4px)` 或 `translate-x-1`)

