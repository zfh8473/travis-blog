# 代码语法高亮功能测试指南

**创建日期：** 2025-01-XX  
**功能：** Shiki 语法高亮  
**测试环境：** Vercel 生产环境

---

## 🎯 测试目标

验证文章中的代码块是否正确显示语法高亮效果。

---

## 📋 测试步骤

### 1. 等待 Vercel 部署完成

- 访问 Vercel Dashboard 确认部署状态
- 等待部署完成（通常需要 2-3 分钟）

### 2. 测试现有文章

**步骤：**
1. 访问包含代码块的文章
2. 检查代码块是否显示语法高亮
3. 验证不同语言的代码块是否正确高亮

**预期结果：**
- ✅ 代码块有语法高亮（不同语法元素有不同颜色）
- ✅ 代码块背景为深色（GitHub Dark 主题）
- ✅ 代码可读性提升

### 3. 创建新文章测试

**步骤：**
1. 登录管理后台
2. 创建新文章，包含以下代码块：

```markdown
# 测试代码高亮

## JavaScript 示例

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

const message = greet("World");
console.log(message);
```

## TypeScript 示例

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
```

## Python 示例

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

result = fibonacci(10)
print(f"Fibonacci(10) = {result}")
```

## Go 示例

```go
package main

import "fmt"

func main() {
    message := "Hello, Go!"
    fmt.Println(message)
}
```
```

3. 保存并发布文章
4. 查看文章详情页面
5. 验证代码块是否显示语法高亮

**预期结果：**
- ✅ JavaScript 代码有语法高亮
- ✅ TypeScript 代码有语法高亮
- ✅ Python 代码有语法高亮
- ✅ Go 代码有语法高亮

### 4. 测试不同语言

测试以下语言的语法高亮：

- [ ] JavaScript / TypeScript
- [ ] JSX / TSX
- [ ] Python
- [ ] Go / Rust
- [ ] Java / C / C++
- [ ] SQL
- [ ] YAML / JSON
- [ ] HTML / CSS
- [ ] Bash / Shell
- [ ] Markdown

### 5. 测试边界情况

- [ ] **无语言标识的代码块**
  ```markdown
  ```
  普通代码
  ```
  ```
  预期：显示为普通代码块（无语法高亮）

- [ ] **不支持的语言**
  ```markdown
  ```unknown-language
  some code
  ```
  ```
  预期：回退到普通代码块

- [ ] **空代码块**
  ```markdown
  ```javascript
  ```
  ```
  预期：显示空的代码块容器

- [ ] **包含特殊字符的代码**
  ```markdown
  ```javascript
  const str = "<div>Hello & World</div>";
  ```
  ```
  预期：特殊字符正确转义和显示

---

## 🔍 验证要点

### 视觉检查

1. **颜色对比**
   - 关键字（如 `function`, `const`, `import`）应该有特定颜色
   - 字符串应该有不同颜色
   - 注释应该有灰色调
   - 变量名应该有特定颜色

2. **背景和边框**
   - 代码块应该有深色背景（GitHub Dark 主题）
   - 应该有圆角和边框
   - 应该有适当的 padding

3. **字体**
   - 应该使用等宽字体（monospace）
   - 字体大小应该合适

### 功能检查

1. **性能**
   - 页面加载时间应该合理
   - 代码块渲染不应该阻塞页面

2. **兼容性**
   - 应该支持所有主流浏览器
   - 移动端显示应该正常

---

## 🐛 问题排查

### 问题 1：代码块没有语法高亮

**可能原因：**
- Shiki 初始化失败
- 代码块格式不正确
- 语言标识不正确

**排查步骤：**
1. 检查浏览器控制台是否有错误
2. 检查代码块 HTML 结构
3. 验证语言标识是否正确

### 问题 2：某些语言没有高亮

**可能原因：**
- 语言不在支持列表中
- 语言标识拼写错误

**解决方案：**
- 检查支持的语言列表
- 使用正确的语言标识

### 问题 3：样式不正确

**可能原因：**
- CSS 冲突
- Shiki 生成的样式被覆盖

**解决方案：**
- 检查 CSS 优先级
- 确保 Shiki 的内联样式生效

---

## 📊 测试结果记录

### 测试日期：___________

### 测试环境
- **URL：** https://travis-blog.vercel.app
- **浏览器：** ___________
- **设备：** ___________

### 测试结果

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 现有文章代码高亮 | ⬜ | |
| JavaScript 高亮 | ⬜ | |
| TypeScript 高亮 | ⬜ | |
| Python 高亮 | ⬜ | |
| Go 高亮 | ⬜ | |
| 无语言标识代码块 | ⬜ | |
| 特殊字符处理 | ⬜ | |
| 页面加载性能 | ⬜ | |

### 发现的问题

1. _______________________________________
2. _______________________________________
3. _______________________________________

---

## ✅ 验收标准

功能验收需要满足以下条件：

1. ✅ **基本功能**
   - 代码块显示语法高亮
   - 支持主要编程语言
   - 样式正确显示

2. ✅ **性能**
   - 页面加载时间 < 3 秒
   - 代码块渲染不阻塞页面

3. ✅ **兼容性**
   - 主流浏览器正常显示
   - 移动端显示正常

4. ✅ **用户体验**
   - 代码可读性提升
   - 视觉效果专业

---

**最后更新：** 2025-01-XX  
**负责人：** UX Designer

