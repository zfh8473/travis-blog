#!/bin/bash

# Vercel 部署配置辅助脚本
# 此脚本帮助配置 Vercel 部署所需的环境变量和连接

set -e

echo "🚀 Vercel 部署配置助手"
echo "======================"
echo ""

# 检查 Vercel CLI 是否安装
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI 未安装"
    echo "正在安装 Vercel CLI..."
    npm i -g vercel
    echo "✅ Vercel CLI 安装完成"
else
    echo "✅ Vercel CLI 已安装"
fi

echo ""
echo "📋 配置步骤："
echo ""
echo "1. 登录 Vercel"
echo "   运行: vercel login"
echo ""
echo "2. 链接项目到 Vercel"
echo "   运行: vercel link"
echo ""
echo "3. 配置环境变量（在 Vercel Dashboard 中）"
echo "   必需变量："
echo "   - DATABASE_URL"
echo "   - NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL"
echo ""
echo "4. 生成 NEXTAUTH_SECRET："
echo "   运行: openssl rand -base64 32"
echo ""

# 生成 NEXTAUTH_SECRET
echo "🔑 生成 NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo ""
echo "生成的 NEXTAUTH_SECRET:"
echo "$NEXTAUTH_SECRET"
echo ""
echo "⚠️  请将此密钥保存到安全的地方，并配置到 Vercel Dashboard 的环境变量中"
echo ""

# 检查 Git 远程仓库
echo "📦 检查 Git 配置..."
if git remote get-url origin &> /dev/null; then
    GIT_REPO=$(git remote get-url origin)
    echo "✅ Git 远程仓库: $GIT_REPO"
else
    echo "⚠️  未找到 Git 远程仓库"
fi

echo ""
echo "✅ 配置检查完成"
echo ""
echo "下一步："
echo "1. 运行 'vercel login' 登录 Vercel"
echo "2. 运行 'vercel link' 链接项目"
echo "3. 在 Vercel Dashboard 中配置环境变量"
echo "4. 推送到 main 分支触发首次部署"

