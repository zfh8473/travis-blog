# 部署问题修复记录

本文档记录在部署过程中遇到的问题和修复方案。

**最后更新**: 2025-11-15

---

## 🔧 修复记录

### 修复 #1: Vercel 构建错误 - isomorphic-dompurify/jsdom 依赖问题

**日期**: 2025-11-15  
**问题**: 在 Vercel 上部署时，构建失败并报错：
```
Error: ENOENT: no such file or directory, open '/ROOT/node_modules/isomorphic-dompurify/node_modules/jsdom/lib/jsdom/browser/default-stylesheet.css'
```

**原因分析**:
- `isomorphic-dompurify` 在服务器端使用时依赖 `jsdom`
- 在 Next.js 16 的 Turbopack 构建环境中，嵌套的 `node_modules` 中的 `jsdom` 包没有正确处理
- `isomorphic-dompurify` 的嵌套依赖 `jsdom` 版本（27.2.0）与项目根目录可能需要的版本不匹配

**修复方案**:
在 `next.config.ts` 中添加 `serverExternalPackages` 配置，将 `jsdom` 和 `isomorphic-dompurify` 标记为外部包，不进行打包：

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: [
    "jsdom",
    "isomorphic-dompurify",
  ],
};
```

**修改文件**:
- `next.config.ts` - 添加 `serverExternalPackages` 配置

**验证**:
- ✅ 本地构建成功
- ✅ 构建时间正常（~2.3s）
- ✅ 所有页面正常生成

**参考**:
- [Next.js serverExternalPackages 文档](https://nextjs.org/docs/app/api-reference/next-config-js/serverExternalPackages)
- 用于处理具有复杂依赖或原生依赖的服务器端包

---

### 警告 #1: Next.js Middleware 弃用警告

**日期**: 2025-11-15  
**警告信息**:
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

**状态**: 警告（不影响功能）

**说明**:
- Next.js 16 中 `middleware.ts` 文件约定已弃用
- 建议未来迁移到 `proxy` 约定
- 当前功能正常，等待 Next.js 官方提供明确的迁移指南

**相关改进项**: 已记录到 `docs/improvements-backlog.md` (IMP-005)

---

## 📝 最佳实践

### 服务器端外部包配置

对于以下类型的包，建议添加到 `serverExternalPackages`：

1. **具有原生依赖的包**（如 `jsdom`）
2. **具有复杂构建要求的包**（如 `isomorphic-dompurify`）
3. **在服务器端使用但不应被打包的包**

### 配置示例

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: [
    "jsdom",
    "isomorphic-dompurify",
    // 其他需要外部化的包
  ],
};
```

---

## 🔗 相关文档

- [Next.js 配置文档](https://nextjs.org/docs/app/api-reference/next-config-js)
- [改进待办清单](./improvements-backlog.md)
- [部署文档](./deployment.md)

---

_本文档会随着部署问题的发现和修复持续更新。_

