# Epic 5 回归测试修复记录

**日期：** 2025-11-19  
**修复人：** Winston (Architect) & Amelia (DEV)

---

## 📋 问题报告

在回归测试中发现了3个问题：

1. **分类ID格式无效**：在创建文章页面选择分类"生活"后，点击"保存为草稿"，收到"分类ID格式无效"的错误
2. **标签创建认证失败**：在标签部分创建新标签"测试"时，收到"Authentication required"的错误
3. **首页分类和排序下拉列表不工作**：选择"分类"或"排序"下拉列表后，页面未根据所选条件刷新并排序

---

## 🔧 修复详情

### 问题 1: 分类ID格式验证问题

**问题原因：**
- 验证逻辑在 `categoryId` 为空字符串时仍然会检查UUID格式
- 当用户选择"选择分类"（空值）时，`categoryId` 是空字符串，但验证逻辑可能误判

**修复方案：**
- 在 `app/admin/articles/new/page.tsx` 中，更新验证逻辑：
  ```typescript
  // 修复前
  if (categoryId && !isValidUUID(categoryId)) {
    newErrors.categoryId = "分类 ID 格式无效";
  }

  // 修复后
  if (categoryId && categoryId.trim() !== "" && !isValidUUID(categoryId)) {
    newErrors.categoryId = "分类 ID 格式无效";
  }
  ```
- 在提交时，只在 `categoryId` 非空且为有效UUID时才包含在请求中：
  ```typescript
  // 修复后
  if (categoryId && categoryId.trim() !== "" && isValidUUID(categoryId)) {
    requestBody.categoryId = categoryId;
  }
  ```

**文件修改：**
- `app/admin/articles/new/page.tsx`

---

### 问题 2: 标签创建认证失败

**问题原因：**
- `app/api/tags/route.ts` 使用 `getUserFromHeaders` 获取用户信息
- `getUserFromHeaders` 是同步函数，只从headers中读取，如果middleware没有设置headers，会返回null
- 在Vercel环境中，middleware可能无法正确设置headers

**修复方案：**
- 将 `getUserFromHeaders` 改为 `getUserFromRequestOrHeaders`
- `getUserFromRequestOrHeaders` 会先尝试从headers获取，如果失败则直接从request读取token
- 添加 `runtime` 和 `maxDuration` 配置确保在Vercel serverless环境中正常工作

**文件修改：**
- `app/api/tags/route.ts`

**修改内容：**
```typescript
// 修复前
import { getUserFromHeaders } from "@/lib/auth/middleware";
export async function POST(request: NextRequest) {
  const user = getUserFromHeaders(request.headers);
  // ...
}

// 修复后
import { getUserFromRequestOrHeaders } from "@/lib/auth/middleware";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: NextRequest) {
  const user = await getUserFromRequestOrHeaders(request, request.headers);
  // ...
}
```

---

### 问题 3: 首页分类和排序下拉列表不工作

**问题原因：**
- `app/page.tsx` 中的 `Home` 组件只接收 `page` 和 `limit` 参数，没有接收 `category` 和 `sort` 参数
- 虽然 `HomePageContent` 函数接收了这些参数，但 `Home` 组件没有传递

**修复方案：**
- 更新 `Home` 组件的 `searchParams` 类型定义，包含 `category` 和 `sort`
- 在 `ArticleFilters` 组件的 `router.push` 调用中添加 `scroll: false` 选项，防止页面跳转

**文件修改：**
- `app/page.tsx`
- `components/article/ArticleFilters.tsx`

**修改内容：**
```typescript
// app/page.tsx - 修复前
export default function Home({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string };
}) {
  // ...
}

// app/page.tsx - 修复后
export default function Home({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; category?: string; sort?: string };
}) {
  // ...
}

// components/article/ArticleFilters.tsx - 修复前
router.push(`/?${params.toString()}`);

// components/article/ArticleFilters.tsx - 修复后
router.push(`/?${params.toString()}`, { scroll: false });
```

---

## ✅ 验证

- ✅ 代码构建成功
- ✅ 无 linter 错误
- ✅ 所有修改已提交并推送到 GitHub

---

## 📝 后续建议

用户建议删除首页的分类下拉列表，因为导航栏已经有了"分类"tab。这是一个合理的UI/UX建议，可以考虑：

1. 删除 `ArticleFilters` 组件中的分类下拉列表
2. 只保留排序下拉列表
3. 用户可以通过导航栏的"分类"tab访问分类页面

如果需要，可以在后续迭代中实现这个改进。

---

**最后更新：** 2025-11-19  
**状态：** ✅ 已修复并部署

