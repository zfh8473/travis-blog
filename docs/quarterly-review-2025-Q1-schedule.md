# 季度文档审查计划 - 2025 Q1

**审查日期：** 2025-03-31  
**负责人：** PM  
**状态：** 📅 已计划

---

## 📋 审查准备

### 审查范围

- [ ] `docs/PRD.md`
- [ ] `docs/epics/epic-1-*.md` 到 `epic-7-*.md`
- [ ] `docs/architecture.md`
- [ ] `.bmad-ephemeral/sprint-status.yaml`

### 重点检查项

1. **技术栈一致性**
   - MarkdownEditor vs Tiptap
   - Server Components + Server Actions
   - Shiki 语法高亮

2. **功能描述准确性**
   - 文章创建/编辑流程
   - Markdown 编辑器功能
   - 代码语法高亮功能

3. **架构说明准确性**
   - Server Components 使用
   - Server Actions 使用
   - 数据获取方式

---

## 🔍 审查检查清单

### 技术栈检查

- [ ] PRD 技术栈部分准确
- [ ] Epic 3.2 编辑器说明准确
- [ ] Epic 3.3/3.4 Server Actions 说明完整
- [ ] Epic 4.2 语法高亮说明完整
- [ ] 所有 Tiptap 引用已更新

### 功能描述检查

- [ ] Epic 功能描述与实际一致
- [ ] Story 接受标准准确
- [ ] PRD 功能需求准确

### 架构说明检查

- [ ] 架构文档准确
- [ ] Epic 技术说明准确
- [ ] 数据流描述准确

---

## 📊 审查执行

### 执行步骤

1. **运行自动检查**
   ```bash
   npm run docs:check
   ```

2. **手动审查文档**
   - 逐项检查检查清单
   - 对比文档与实际实现

3. **生成审查报告**
   - 记录发现的问题
   - 制定更新计划

---

## 📝 审查报告

审查完成后，将生成报告：`docs/quarterly-review-2025-Q1.md`

---

**创建日期：** 2025-01-XX  
**负责人：** PM

