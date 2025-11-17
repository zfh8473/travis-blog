# 代码块渲染测试指南

**测试日期：** 2025-01-XX  
**测试目的：** 验证新文章的代码块是否能正确渲染  
**测试环境：** Vercel 生产环境

---

## 📋 测试步骤

### 步骤 1：登录管理员账户

1. 访问：https://travis-blog.vercel.app/login
2. 使用管理员账户登录：
   - 邮箱：`zfh8473@gmail.com`
   - 密码：`Zfh122431`

### 步骤 2：创建新文章

1. 点击导航栏中的"发布文章"按钮
2. 或直接访问：https://travis-blog.vercel.app/admin/articles/new

### 步骤 3：填写文章信息

1. **标题**：输入 `代码块渲染测试文章`
2. **内容**：在 Markdown 编辑器中输入以下内容：

```markdown
# 代码块渲染测试

这是一篇用于测试代码块渲染效果的文章。

## JavaScript 代码块示例

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return `Welcome to the blog!`;
}

greet("Travis");
```

## Python 代码块示例

```python
def calculate_sum(a, b):
    """计算两个数的和"""
    result = a + b
    print(f"Sum: {result}")
    return result

calculate_sum(10, 20)
```

## TypeScript 代码块示例

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = {
  id: "1",
  name: "Travis",
  email: "travis@example.com"
};

console.log(user);
```

## 行内代码示例

这里有一个 `const x = 10;` 行内代码示例。

## 其他内容

- 列表项 1
- 列表项 2
- 列表项 3

**粗体文本** 和 *斜体文本* 也应该正常显示。
```

3. **状态**：选择"已发布"
4. 点击"发布"按钮

### 步骤 4：验证代码块渲染

1. 发布成功后，系统会跳转到文章列表或文章详情页
2. 如果跳转到文章列表，点击新创建的文章标题
3. 查看文章详情页，检查以下内容：

#### ✅ 预期结果

1. **代码块应该正确显示**：
   - ✅ 代码块应该有深色背景（`bg-gray-900`）
   - ✅ 代码块应该有圆角边框和阴影
   - ✅ 代码块应该有等宽字体
   - ✅ 代码块应该有适当的 padding
   - ✅ 代码块内的代码应该是浅色文字（`text-gray-100`）

2. **行内代码应该正确显示**：
   - ✅ 行内代码应该有浅蓝色背景（`bg-blue-50`）
   - ✅ 行内代码应该是蓝色文字（`text-blue-600`）
   - ✅ 行内代码应该有圆角和 padding

3. **其他内容应该正常显示**：
   - ✅ 标题层级清晰
   - ✅ 段落间距合适
   - ✅ 列表样式正确
   - ✅ 粗体和斜体正常显示

#### ❌ 如果代码块显示为普通文本

如果代码块被渲染为普通段落文本（如 `<p>```javascript ... ```</p>`），说明：

1. **可能的问题**：
   - Markdown 转换时代码块没有被正确解析
   - 保存到数据库的 HTML 内容不正确

2. **需要检查**：
   - 检查浏览器开发者工具中的 HTML 结构
   - 检查是否有 `<pre><code>` 标签
   - 检查代码块的样式类是否正确应用

---

## 🔍 检查方法

### 方法 1：浏览器开发者工具

1. 打开文章详情页
2. 按 `F12` 打开开发者工具
3. 在 Elements/Inspector 中查找代码块
4. 检查 HTML 结构：

**正确的结构应该是：**
```html
<pre class="prose-pre:bg-gray-900 ...">
  <code class="language-javascript">...</code>
</pre>
```

**错误的结构（如果出现问题）：**
```html
<p>```javascript
function test() {
  console.log("Hello");
}
```</p>
```

### 方法 2：检查样式

1. 在开发者工具中选择代码块元素
2. 检查应用的 CSS 类：
   - 应该看到 `prose-pre:bg-gray-900`
   - 应该看到 `prose-pre:text-gray-100`
   - 应该看到 `prose-pre:rounded-lg`
   - 应该看到 `prose-pre:p-4`

---

## 📊 测试结果记录

### 测试结果

- [ ] **代码块渲染**：✅ 正确 / ❌ 失败
- [ ] **行内代码渲染**：✅ 正确 / ❌ 失败
- [ ] **代码块样式**：✅ 正确 / ❌ 失败
- [ ] **其他内容渲染**：✅ 正确 / ❌ 失败

### 问题描述

如果发现问题，请记录：

1. **问题现象**：
   - 代码块显示为普通文本
   - 代码块样式不正确
   - 其他问题

2. **HTML 结构**：
   - 复制实际的 HTML 结构

3. **浏览器信息**：
   - 浏览器类型和版本
   - 操作系统

---

## 🎯 预期改进效果

改进后，代码块应该：

1. ✅ 正确显示为代码块格式（不是普通文本）
2. ✅ 有深色背景和浅色文字
3. ✅ 有圆角边框和阴影
4. ✅ 有适当的 padding 和间距
5. ✅ 支持多种编程语言的代码块
6. ✅ 行内代码有正确的样式

---

**最后更新：** 2025-01-XX  
**负责人：** UX Designer

