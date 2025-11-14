# 测试文档

本文档说明如何运行和维护项目的测试套件。

## 测试结构

```
tests/
├── __tests__/
│   ├── unit/              # 单元测试
│   │   └── oauth-callbacks.test.ts
│   └── integration/      # 集成测试
│       └── oauth-account-linking.test.ts
└── e2e/                  # E2E 测试
    └── oauth-login.spec.ts
```

## 测试类型

### 单元测试 (Unit Tests)

测试单个函数或组件的逻辑，不依赖外部服务。

**位置**: `tests/__tests__/unit/`

**运行**:
```bash
npm test
```

### 集成测试 (Integration Tests)

测试多个组件或服务之间的交互，可能涉及数据库。

**位置**: `tests/__tests__/integration/`

**运行**:
```bash
npm test
```

**注意**: 集成测试需要数据库连接。确保 `.env.local` 中配置了测试数据库。

### E2E 测试 (End-to-End Tests)

测试完整的用户流程，使用 Playwright 在真实浏览器中运行。

**位置**: `tests/e2e/`

**运行**:
```bash
# 运行所有 E2E 测试
npm run test:e2e

# 使用 UI 模式运行
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug
```

## OAuth 测试说明

### 单元测试和集成测试

OAuth 相关的单元测试和集成测试可以独立运行，不需要实际的 OAuth App 配置：

- **账户链接逻辑测试**: 测试账户创建和链接的数据库操作
- **Callback 逻辑测试**: 测试 signIn 和 jwt callback 的逻辑

### E2E 测试

E2E 测试验证完整的 OAuth 流程，但需要注意：

1. **需要 OAuth App 配置**: 完整的 OAuth 流程测试需要配置 GitHub 和 Google OAuth Apps
2. **测试环境**: 建议使用测试专用的 OAuth Apps，而不是生产环境
3. **Mock 选项**: 对于 CI/CD，可以考虑使用 OAuth provider mocking

### 运行 OAuth 测试

```bash
# 运行所有 OAuth 相关测试
npm test -- oauth

# 只运行单元测试
npm test -- oauth-callbacks

# 只运行集成测试
npm test -- oauth-account-linking

# 运行 E2E 测试（需要 OAuth Apps 配置）
npm run test:e2e -- oauth-login
```

## 测试覆盖率

生成测试覆盖率报告：

```bash
npm run test:coverage
```

覆盖率报告会生成在 `coverage/` 目录中。

## 测试最佳实践

1. **隔离测试**: 每个测试应该独立运行，不依赖其他测试的状态
2. **清理数据**: 测试后清理创建的测试数据
3. **Mock 外部服务**: 单元测试应该 mock 外部服务（如 OAuth providers）
4. **真实环境**: E2E 测试在接近生产环境的环境中运行
5. **错误场景**: 测试应该包括成功和失败场景

## 故障排除

### 数据库连接错误

如果集成测试失败，检查：
- `.env.local` 中是否配置了 `DATABASE_URL`
- 数据库是否可访问
- Prisma Client 是否已生成 (`npx prisma generate`)

### Playwright 浏览器问题

如果 E2E 测试失败，尝试：
```bash
# 安装 Playwright 浏览器
npx playwright install
```

### OAuth 测试失败

如果 OAuth E2E 测试失败：
1. 检查 OAuth Apps 是否已配置
2. 检查环境变量是否正确设置
3. 考虑使用 mock OAuth provider 进行测试

## 持续集成

在 CI/CD 环境中：
- 使用测试数据库
- 配置测试 OAuth Apps
- 运行所有测试类型
- 生成覆盖率报告

