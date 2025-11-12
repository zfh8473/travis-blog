# BMad BMM 标准指令参考

**项目：** travis-blog  
**工作流轨道：** BMad Method  
**最后更新：** 2025-11-12

---

## 📋 标准指令格式

BMad BMM 工作流使用以下标准指令格式：

### 格式 1: 完整路径格式（推荐）

```
/bmad:bmm:workflows:{workflow-id}
```

### 格式 2: 简化格式

```
{workflow-id}
```

---

## 🔄 工作流阶段指令

### Phase 0: Discovery（发现阶段）

| 工作流 ID | 指令 | Agent | 说明 |
|-----------|------|-------|------|
| `brainstorm-project` | `/bmad:bmm:workflows:brainstorm-project` | analyst | 项目头脑风暴 |
| `research` | `/bmad:bmm:workflows:research` | analyst | 领域研究 |
| `product-brief` | `/bmad:bmm:workflows:product-brief` | analyst | 产品简介 |

---

### Phase 1: Planning（规划阶段）

| 工作流 ID | 指令 | Agent | 说明 |
|-----------|------|-------|------|
| `prd` | `/bmad:bmm:workflows:prd` | pm | 创建产品需求文档 |
| `validate-prd` | `/bmad:bmm:workflows:validate-prd` | pm | 验证 PRD |
| `create-design` | `/bmad:bmm:workflows:create-design` | ux-designer | 创建 UX 设计 |

---

### Phase 2: Solutioning（解决方案阶段）

| 工作流 ID | 指令 | Agent | 说明 |
|-----------|------|-------|------|
| `create-architecture` | `/bmad:bmm:workflows:create-architecture` | architect | 创建架构文档 |
| `validate-architecture` | `/bmad:bmm:workflows:validate-architecture` | architect | 验证架构文档 |
| `solutioning-gate-check` | `/bmad:bmm:workflows:solutioning-gate-check` | architect | 解决方案门检查 |

---

### Phase 3: Implementation（实施阶段）

| 工作流 ID | 指令 | Agent | 说明 |
|-----------|------|-------|------|
| `sprint-planning` | `/bmad:bmm:workflows:sprint-planning` | sm | Sprint 规划 |
| `epic-tech-context` | `/bmad:bmm:workflows:epic-tech-context` | dev | Epic 技术上下文 |
| `create-story` | `/bmad:bmm:workflows:create-story` | sm | 创建故事文件 |
| `story-context` | `/bmad:bmm:workflows:story-context` | dev | 故事上下文 |
| `dev-story` | `/bmad:bmm:workflows:dev-story` | dev | 开发故事 |
| `story-ready` | `/bmad:bmm:workflows:story-ready` | sm | 故事就绪检查 |
| `story-done` | `/bmad:bmm:workflows:story-done` | sm | 故事完成检查 |
| `code-review` | `/bmad:bmm:workflows:code-review` | sm | 代码审查 |

---

### 通用工作流

| 工作流 ID | 指令 | Agent | 说明 |
|-----------|------|-------|------|
| `workflow-init` | `workflow-init` | analyst | 初始化工作流 |
| `workflow-status` | `workflow-status` | any | 查看工作流状态 |

---

## 🎯 当前项目下一步指令

### 立即可用

**1. 开始 Epic 2 的技术上下文**
```
/bmad:bmm:workflows:epic-tech-context
```
- **Agent:** dev
- **说明:** 为 Epic 2 创建技术规范文档
- **前置条件:** Epic 2 需要在 epics.md 中定义

**2. 创建故事文件**
```
/bmad:bmm:workflows:create-story
```
- **Agent:** sm
- **说明:** 为 Epic 2 的第一个故事创建故事文件
- **前置条件:** Epic 2 需要先有技术上下文

**3. 查看工作流状态**
```
workflow-status
```
- **Agent:** any
- **说明:** 查看当前工作流进度

---

## 📝 使用示例

### 示例 1: 开始下一个工作流

如果你想开始 Epic 2 的技术上下文：

```
/bmad:bmm:workflows:epic-tech-context
```

系统会提示你选择 Epic 2。

### 示例 2: 查看状态

```
workflow-status
```

会显示当前工作流进度和下一步建议。

### 示例 3: 创建故事

```
/bmad:bmm:workflows:create-story
```

系统会提示你选择要创建的故事。

---

## 🔍 工作流查找

如果不知道工作流 ID，可以：

1. **查看工作流状态**
   ```
   workflow-status
   ```
   会显示下一个工作流和对应的指令。

2. **查看工作流路径文件**
   - 文件：`.bmad/bmm/workflows/workflow-status/paths/method-greenfield.yaml`
   - 包含所有工作流的定义

3. **查看工作流目录**
   - 目录：`.bmad/bmm/workflows/`
   - 包含所有可用的工作流

---

## 💡 提示

1. **Agent 切换**
   - 某些工作流需要特定的 agent
   - 可以在新对话中加载对应的 agent
   - 或直接使用工作流指令（系统会自动处理）

2. **工作流顺序**
   - 按照 BMad Method 的阶段顺序执行
   - 某些工作流有前置条件
   - 使用 `workflow-status` 查看下一步建议

3. **简化指令**
   - 可以直接使用工作流 ID（如 `workflow-status`）
   - 或使用完整路径格式（如 `/bmad:bmm:workflows:epic-tech-context`）

---

## 📚 参考文档

- [BMad BMM 工作流文档](.bmad/bmm/workflows/)
- [工作流状态文件](docs/bmm-workflow-status.yaml)
- [Sprint 状态文件](.bmad-ephemeral/sprint-status.yaml)

---

_最后更新：2025-11-12_

