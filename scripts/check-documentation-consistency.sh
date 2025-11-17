#!/bin/bash

# 文档一致性检查脚本
# 用途：检查文档中的技术栈名称、API 端点等是否一致
# 使用：在 CI/CD 中运行，或在本地执行

set -e

echo "🔍 开始文档一致性检查..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查结果
ERRORS=0
WARNINGS=0

# 检查函数
check_pattern() {
    local pattern=$1
    local description=$2
    local files=$3
    local exclude_pattern=${4:-""}
    
    echo "检查: $description"
    
    # 检查是否在文档中找到过时的引用
    # 排除 legacy 注释和历史文档
    local grep_cmd="grep -r -i \"$pattern\" $files"
    if [ -n "$exclude_pattern" ]; then
        grep_cmd="$grep_cmd | grep -v \"$exclude_pattern\""
    fi
    
    # 排除历史文档、legacy 注释、示例引用、历史报告、审查报告、更新总结、产品简介、审查计划、回归测试、验证报告、测试策略和工作流状态报告
    # 同时排除变更说明中的历史描述
    local results=$(eval "$grep_cmd" 2>/dev/null | grep -v "legacy\|replaced\|brainstorming\|历史\|archive\|implementation-readiness\|markdown-enhancements\|prd-epics-review\|prd-epics-update-summary\|product-brief\|quarterly.*review\|regression-test\|testing-strategy\|validation-report\|workflow-status\|如 Tiptap\|Tiptap →\|提到 Tiptap\|移除 Tiptap\|文档状态\|差异分析\|原：\|变更记录\|记录了从\|不是 Tiptap\|vs Tiptap\|已更新\|更换为\|从.*更换\|变更说明" || true)
    
    if [ -n "$results" ]; then
        echo -e "${RED}❌ 发现过时的引用: $pattern${NC}"
        echo "$results" | head -5
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✅ 未发现过时的引用: $pattern${NC}"
        return 0
    fi
}

# 检查文档目录
DOCS_DIR="docs"
EPICS_DIR="docs/epics"

echo ""
echo "📋 检查技术栈一致性..."

# 检查 Tiptap 引用（应该已全部替换为 MarkdownEditor）
# 排除历史文档和 legacy 注释
if check_pattern "Tiptap" "Tiptap 编辑器引用" "$DOCS_DIR/*.md $EPICS_DIR/*.md" "legacy\|replaced\|brainstorming\|历史"; then
    echo -e "${GREEN}✅ 所有 Tiptap 引用已更新（排除历史文档和 legacy 注释）${NC}"
else
    echo -e "${YELLOW}⚠️  发现 Tiptap 引用，请检查是否需要更新（已排除历史文档）${NC}"
    ((WARNINGS++))
fi

echo ""
echo "📋 检查技术栈名称..."

# 检查关键技术栈名称是否在 PRD 中存在
echo "检查 PRD 中的技术栈..."
if grep -q "@uiw/react-md-editor" "$DOCS_DIR/PRD.md"; then
    echo -e "${GREEN}✅ PRD 中包含 MarkdownEditor${NC}"
else
    echo -e "${RED}❌ PRD 中缺少 MarkdownEditor 引用${NC}"
    ((ERRORS++))
fi

if grep -q "Server Components" "$DOCS_DIR/PRD.md"; then
    echo -e "${GREEN}✅ PRD 中包含 Server Components${NC}"
else
    echo -e "${RED}❌ PRD 中缺少 Server Components 引用${NC}"
    ((ERRORS++))
fi

if grep -q "Shiki" "$DOCS_DIR/PRD.md"; then
    echo -e "${GREEN}✅ PRD 中包含 Shiki${NC}"
else
    echo -e "${YELLOW}⚠️  PRD 中缺少 Shiki 引用（可选）${NC}"
    ((WARNINGS++))
fi

echo ""
echo "📋 检查 Epic 文档..."

# 检查 Epic 3.2 是否包含 MarkdownEditor
if grep -q "MarkdownEditor\|@uiw/react-md-editor" "$EPICS_DIR/epic-3-内容创作和管理content-creation-management.md"; then
    echo -e "${GREEN}✅ Epic 3.2 包含 MarkdownEditor${NC}"
else
    echo -e "${RED}❌ Epic 3.2 缺少 MarkdownEditor 引用${NC}"
    ((ERRORS++))
fi

# 检查 Epic 3.3 和 3.4 是否包含 Server Actions
if grep -q "Server Actions\|createArticleAction" "$EPICS_DIR/epic-3-内容创作和管理content-creation-management.md"; then
    echo -e "${GREEN}✅ Epic 3.3/3.4 包含 Server Actions${NC}"
else
    echo -e "${RED}❌ Epic 3.3/3.4 缺少 Server Actions 引用${NC}"
    ((ERRORS++))
fi

# 检查 Epic 4.2 是否包含语法高亮
if grep -q "Shiki\|语法高亮\|syntax highlighting" "$EPICS_DIR/epic-4-内容展示content-display.md"; then
    echo -e "${GREEN}✅ Epic 4.2 包含语法高亮${NC}"
else
    echo -e "${YELLOW}⚠️  Epic 4.2 缺少语法高亮引用（可选）${NC}"
    ((WARNINGS++))
fi

echo ""
echo "📊 检查结果汇总"
echo "=================="
echo -e "${GREEN}✅ 通过检查${NC}"
echo -e "${RED}❌ 错误: $ERRORS${NC}"
echo -e "${YELLOW}⚠️  警告: $WARNINGS${NC}"

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ 发现 $ERRORS 个错误，请修复后重试${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  发现 $WARNINGS 个警告，建议检查${NC}"
    exit 0
else
    echo ""
    echo -e "${GREEN}✅ 所有检查通过！${NC}"
    exit 0
fi

