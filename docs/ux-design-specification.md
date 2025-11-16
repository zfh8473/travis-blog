# travis-blog UX Design Specification

_Created on 2025-11-15 by Travis_  
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

**项目愿景：** travis-blog 是一个个人博客平台，旨在通过完整的开发流程实现学习、分享和建立个人品牌的目标。这是一个实验性学习项目，使用 Next.js + Tailwind CSS + Node.js + PostgreSQL + Vercel 技术栈。

**目标用户：**
- 亲人、朋友、同学：了解 Travis 的当前状态和动态
- 志趣相投的同行：获取有用资讯、学习思考过程，产生共鸣并互动

**核心体验目标：** 舒适阅读 + 情感连接

**平台：** Web 应用（Next.js），响应式设计（桌面、平板、手机）

---

## 1. Design System Foundation

### 1.1 Design System Choice

**选择：** shadcn/ui

**版本：** Latest

**理由：**
- 与 Next.js + Tailwind CSS 技术栈完美匹配
- 组件代码直接复制到项目中，完全可控
- 现代、简洁的设计风格，符合"舒适阅读"目标
- 基于 Radix UI Primitives，可访问性优秀
- 适合学习项目，可以看到组件实现代码
- 社区活跃，文档完善

**提供的组件：**
- Button, Card, Form, Input, Dialog, Navigation Menu, Pagination 等 30+ 核心组件
- 所有组件都可以完全定制

**自定义组件需求：**
- 文章卡片组件（ArticleCard）- 需要定制样式
- 导航栏组件（Header/Navigation）- 需要集成登录和发布按钮
- 留言组件（Comment）- 需要定制交互

---

## 2. Core User Experience

### 2.1 Defining Experience

**定义性体验：** "这是一个可以舒适阅读、产生共鸣的个人博客"

**核心交互：**
1. **浏览文章列表** - 发现感兴趣的内容
2. **阅读文章详情** - 沉浸式阅读体验
3. **留言互动** - 与 Travis 产生连接

**这是标准的内容消费模式，有成熟的 UX 模式可参考。**

### 2.2 Core Experience Principles

**速度：** 快速加载，流畅滚动，即时反馈
- 文章列表快速加载
- 页面切换流畅
- 交互响应即时

**引导：** 清晰的信息架构，直观的导航
- 清晰的导航栏
- 明确的文章分类和标签
- 简单的搜索功能

**灵活性：** 平衡简洁与功能
- 简洁的界面，不干扰阅读
- 必要的功能（登录、发布）易于访问
- 响应式设计，适配各种设备

**反馈：** 适度反馈，不干扰阅读
- 成功操作有明确提示
- 错误信息清晰友好
- 加载状态适当显示

---

## 3. Visual Foundation

### 3.1 Color System

**主题：** 极简科技风

**主色调：**
- **Primary Blue:** `#3b82f6` - 主要操作、链接、强调元素
- **Primary Dark:** `#2563eb` - 悬停状态、激活状态
- **Primary Light:** `#60a5fa` - 次要操作、背景高亮

**语义颜色：**
- **Success Green:** `#10b981` - 成功消息、确认操作
- **Warning Orange:** `#f59e0b` - 警告消息、注意事项
- **Error Red:** `#ef4444` - 错误消息、删除操作
- **Info Purple:** `#6366f1` - 信息提示、次要信息

**中性色：**
- **Text Primary:** `#0f172a` - 主要文本、标题
- **Text Secondary:** `#1e293b` - 正文、次要文本
- **Text Tertiary:** `#64748b` - 辅助文本、占位符
- **Background:** `#f8fafc` - 页面背景
- **Surface:** `#ffffff` - 卡片、面板背景
- **Border:** `#e2e8f0` - 边框、分隔线

**交互式可视化：**
- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)

### 3.2 Typography System

**字体族：**
- **标题和正文：** Inter（圆润友好的无衬线字体，提升阅读体验）
- **代码：** Geist Mono（等宽字体，用于代码显示）
- **中文字体回退：** PingFang SC（macOS）、Microsoft YaHei（Windows）、Hiragino Sans GB（iOS）

**字体大小：**
- **H1：** 2.25rem (36px) - 页面主标题
- **H2：** 1.875rem (30px) - 章节标题
- **H3：** 1.5rem (24px) - 小节标题
- **H4：** 1.25rem (20px) - 小标题
- **正文：** 1rem (16px) - 正文内容
- **小号：** 0.875rem (14px) - 辅助文本、说明
- **极小：** 0.75rem (12px) - 标签、元数据

**字重：**
- **标题：** 700 (Bold)
- **副标题：** 600 (SemiBold)
- **正文：** 400 (Regular)
- **强调：** 500 (Medium)

**行高：**
- **标题：** 1.2
- **正文：** 1.7（确保舒适阅读）
- **小号文本：** 1.5

### 3.3 Spacing and Layout Foundation

**基础单位：** 4px

**间距刻度：**
- **xs：** 0.25rem (4px)
- **sm：** 0.5rem (8px)
- **md：** 1rem (16px)
- **lg：** 1.5rem (24px)
- **xl：** 2rem (32px)
- **2xl：** 3rem (48px)
- **3xl：** 4rem (64px)

**布局网格：**
- **容器最大宽度：** 1280px（桌面）
- **内容区域：** 768px（文章阅读宽度）
- **边距：** 1rem（移动端），2rem（桌面端）

**响应式断点：**
- **移动端：** < 768px
- **平板：** 768px - 1024px
- **桌面：** > 1024px

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**设计方向：** 极简科技风 + 卡片式布局

**布局决策：**
- **导航模式：** 顶部导航栏（包含站点标志、主要导航链接、用户操作入口）
- **内容结构：** 单列为主，侧边栏可选（移动端隐藏）
- **内容组织：** 卡片式布局（文章列表）

**层次决策：**
- **视觉密度：** 平衡（清晰结构，适度留白）
- **标题强调：** 适中（清晰但不突兀）
- **内容焦点：** 文本为主（图片作为辅助）

**交互决策：**
- **主要操作模式：** 内联（发布文章按钮在导航栏）
- **信息展示：** 渐进式（分类和标签可折叠）
- **用户控制：** 灵活（支持多种浏览方式）

**视觉风格决策：**
- **视觉重量：** 极简（充足留白，微妙边框）
- **深度提示：** 微妙（轻微阴影，清晰层次）
- **边框样式：** 微妙（细边框，低对比度）
- **页面背景：** 使用虚化图片/水印布满页面背景（主体内容区域两侧的空白区域），增加视觉层次而不干扰内容阅读

**理由：**
- 符合"舒适阅读 + 情感连接"的目标
- 参考当前流行的博客设计趋势
- 极简设计突出内容，不干扰阅读
- 卡片式布局便于快速浏览和发现内容

---

## 5. User Journey Flows

### 5.1 Critical User Paths

**待完成：** 将在后续步骤中详细设计用户旅程流程

**关键用户旅程：**
1. 浏览文章列表
2. 阅读文章详情
3. 留言互动
4. 发布文章（管理员）

---

## 6. Component Library

### 6.1 Component Strategy

**来自 shadcn/ui 的组件：**
- Button, Card, Form, Input, Dialog, Navigation Menu, Pagination, Alert, Badge 等

**需要定制的组件：**
- **ArticleCard** - 文章卡片组件
  - 显示标题、摘要、发布时间、分类、标签
  - 支持点击跳转到详情页
  - 响应式设计

- **Header/Navigation** - 导航栏组件
  - 站点标志
  - 主要导航链接（首页、分类、标签、关于）
  - 用户操作入口（登录/注册、发布文章）
  - 响应式菜单（移动端汉堡菜单）

- **Comment** - 留言组件
  - 留言表单
  - 留言列表展示
  - 回复功能

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

**待完成：** 将在后续步骤中定义详细的 UX 模式决策

**关键模式类别：**
- 按钮层次（主要、次要、破坏性）
- 反馈模式（成功、错误、加载）
- 表单模式（标签、验证、帮助文本）
- 导航模式（激活状态、返回按钮）
- 空状态模式
- 确认模式（删除、未保存更改）
- 通知模式

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**待完成：** 将在后续步骤中详细定义响应式和可访问性策略

**初步策略：**
- 移动优先设计
- 三个主要断点（移动、平板、桌面）
- 导航栏在移动端转换为汉堡菜单
- 文章列表在移动端单列显示

---

## 9. Implementation Guidance

### 9.1 Completion Summary

**当前状态：** 设计规范进行中

**已完成：**
- ✅ 设计系统选择（shadcn/ui）
- ✅ 核心体验原则定义
- ✅ 视觉基础（颜色、字体、间距）
- ✅ 设计方向选择（极简科技风 + 卡片式布局）
- ✅ 设计方向可视化（HTML mockups）

**待完成：**
- ⏳ 用户旅程流程详细设计
- ⏳ UX 模式决策详细定义
- ⏳ 响应式和可访问性策略详细定义

---

## Appendix

### Related Documents

- Product Requirements: `docs/PRD.md`
- Product Brief: `docs/product-brief-travis-blog-2025-11-12.md`
- Architecture: `docs/architecture.md`

### Core Interactive Deliverables

- **Color Theme Visualizer**: [ux-color-themes.html](./ux-color-themes.html)
  - 交互式 HTML 展示所有颜色主题选项
  - 实际 UI 组件示例
  - 颜色使用说明

- **Design Direction Mockups**: [ux-design-directions.html](./ux-design-directions.html)
  - 主页 mockup（文章列表 + 导航栏）
  - 文章详情页 mockup
  - 导航栏设计（未登录/已登录 + 移动端响应式）
  - 所有 mockups 使用极简科技风配色

### Next Steps & Follow-Up Workflows

**下一步：**
1. 完成用户旅程流程详细设计
2. 定义 UX 模式决策
3. 生成设计方向可视化（HTML mockups）
4. 完成响应式和可访问性策略

**后续工作流：**
- 创建 Story 4.6（导航栏和用户入口）- 基于此设计规范
- 实施前端 UI 改进

---

## Version History

| Date     | Version | Changes                         | Author  |
| -------- | ------- | ------------------------------- | ------- |
| 2025-11-15 | 1.0     | Initial UX Design Specification | Travis  |

---

_This UX Design Specification was created through collaborative design facilitation. All decisions were made with user input and are documented with rationale._

