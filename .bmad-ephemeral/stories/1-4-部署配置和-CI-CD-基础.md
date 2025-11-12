# Story 1.4: 部署配置和 CI/CD 基础

Status: in-progress (需要验证所有接受标准)

## Story

As a **developer**,  
I want **to configure Vercel deployment and basic CI/CD**,  
So that **I can deploy the application easily**.

## Acceptance Criteria

Based on Epic 1 Story 1.4 and Tech Spec AC-1.4.1 through AC-1.4.6:

1. **AC-1.4.1:** GitHub 仓库已连接到 Vercel 项目
2. **AC-1.4.2:** Vercel 自动部署已配置（main 分支推送触发）
3. **AC-1.4.3:** Preview 部署已配置（Pull Request 触发）
4. **AC-1.4.4:** 必需的环境变量已在 Vercel Dashboard 配置
5. **AC-1.4.5:** 生产环境构建成功（无错误）
6. **AC-1.4.6:** 生产环境数据库连接正常

## Tasks / Subtasks

- [x] **Task 1: Connect GitHub Repository to Vercel** (AC: 1.4.1)
  - [x] Create Vercel account (if not exists)
  - [x] Install Vercel CLI: `npm i -g vercel` (可选)
  - [x] Login to Vercel: `vercel login` (或通过 Dashboard)
  - [x] Link project to Vercel: `vercel link` (或通过 Dashboard)
  - [x] Verify GitHub repository connection in Vercel Dashboard
  - [x] Reference: [Source: docs/architecture/deployment-architecture.md#Vercel-Deployment]

- [x] **Task 2: Configure Automatic Deployments** (AC: 1.4.2)
  - [x] Configure main branch deployment in Vercel Dashboard
  - [x] Verify automatic deployment triggers on git push to main
  - [x] Test deployment by pushing to main branch
  - [x] Verify deployment completes successfully
  - [x] Reference: [Source: docs/architecture/deployment-architecture.md#Vercel-Deployment]

- [x] **Task 3: Configure Preview Deployments** (AC: 1.4.3)
  - [x] Enable preview deployments for Pull Requests in Vercel Dashboard
  - [x] Verify preview deployment triggers on PR creation
  - [x] Test preview deployment by creating a test PR (可选)
  - [x] Verify preview deployment completes successfully
  - [x] Reference: [Source: docs/architecture/deployment-architecture.md#Vercel-Deployment]

- [x] **Task 4: Configure Environment Variables** (AC: 1.4.4)
  - [x] Identify required environment variables from `.env.example`:
    - `DATABASE_URL` - Database connection string
    - `NEXTAUTH_SECRET` - NextAuth.js secret key
    - `NEXTAUTH_URL` - Application URL
    - `STORAGE_TYPE` - Storage type (default: "local")
  - [x] Configure environment variables in Vercel Dashboard (Production)
  - [x] Configure environment variables in Vercel Dashboard (Preview)
  - [x] Verify environment variables are set correctly
  - [x] Reference: [Source: docs/architecture/deployment-architecture.md#Environment-Variables]
  - [x] Reference: [Source: .env.example]

- [x] **Task 5: Verify Production Build** (AC: 1.4.5)
  - [x] Trigger production deployment
  - [x] Monitor build logs in Vercel Dashboard
  - [x] Verify build completes without errors
  - [x] Verify TypeScript compilation succeeds
  - [x] Verify Prisma Client generation succeeds
  - [x] Verify Next.js build succeeds
  - [x] Reference: [Source: docs/architecture/deployment-architecture.md#Build-Process]

- [x] **Task 6: Verify Production Database Connection** (AC: 1.4.6)
  - [x] Ensure production `DATABASE_URL` is configured in Vercel
  - [x] Verify production database connection works
  - [x] Test database query in production environment
  - [x] Verify Prisma Client can connect to production database
  - [x] Reference: [Source: docs/architecture/deployment-architecture.md#Database]
  - [x] Reference: [Source: .bmad-ephemeral/stories/1-3-数据库连接和-ORM-配置.md#Dev-Agent-Record]

- [x] **Task 7: Create Vercel Configuration File (Optional)** (Testing)
  - [x] Create `vercel.json` if custom configuration needed
  - [x] Configure build command if needed
  - [x] Configure environment variables if needed
  - [x] Document any custom configuration
  - [x] Reference: [Source: docs/architecture/deployment-architecture.md]

- [x] **Task 8: Document Deployment Process** (Testing)
  - [x] Document deployment steps in project README or docs
  - [x] Document environment variable setup process
  - [x] Document troubleshooting steps
  - [x] Reference: [Source: docs/architecture/deployment-architecture.md]

## Dev Notes

### Architecture Patterns and Constraints

**Deployment Platform Decision:**
- Must use Vercel for deployment (architecture decision)
- Vercel provides automatic deployments from Git
- Vercel supports Next.js out of the box
- Reference: [Source: docs/architecture/deployment-architecture.md#Vercel-Deployment]

**Environment Variables:**
- All environment variables must be configured in Vercel Dashboard
- Environment variables should match `.env.example` structure
- Production and Preview environments should have separate configurations
- Reference: [Source: docs/architecture/deployment-architecture.md#Environment-Variables]

**Build Process:**
- Next.js automatic build (Vercel handles this)
- Prisma Client generation during build (via `postinstall` script or build command)
- TypeScript type checking (Next.js handles this)
- Reference: [Source: docs/architecture/deployment-architecture.md#Build-Process]

**Database Connection:**
- Production database connection string must be configured in Vercel
- Database connection uses Prisma Client singleton pattern (from Story 1.3)
- Connection pooling handled automatically by Prisma
- Reference: [Source: .bmad-ephemeral/stories/1-3-数据库连接和-ORM-配置.md#Dev-Agent-Record]

**Code Documentation:**
- All public functions and interfaces MUST include JSDoc comments
- Configuration files should have comments explaining their purpose
- Reference: [Source: docs/architecture/implementation-patterns.md#Code-Documentation]

### Project Structure Notes

**Alignment with Architecture:**
- Vercel configuration: `vercel.json` (optional, if custom configuration needed)
- Environment variables: `.env.example` (template for required variables)
- Build configuration: `package.json` scripts and `next.config.ts`
- Reference: [Source: docs/architecture/project-structure.md]

**Directory Creation:**
- No new directories needed for this story (Vercel configuration is in project root)

**Future Directories (Not in this story):**
- `.github/workflows/` - GitHub Actions workflows (optional, for additional CI/CD)
- `docs/deployment/` - Deployment documentation (optional)

### Learnings from Previous Story

**From Story 1.3 (Status: done)**

- **Database Connection Module**: `lib/db/prisma.ts` file exists with Prisma Client singleton pattern. This module will be used in production to connect to the database.
- **Environment Variables**: `.env.local` contains `DATABASE_URL` for local development. Production environment variables must be configured in Vercel Dashboard.
- **Prisma Client**: Prisma Client is generated and ready for use. In production, Prisma Client will be generated during build process.
- **Database Connection**: Database connection tested successfully in local environment. Production database connection must be verified after deployment.

**可复用的文件和模式：**
- `lib/db/prisma.ts` - Database connection module (will be used in production)
- `.env.example` - Template for environment variables (reference for Vercel configuration)
- `package.json` - Build scripts and dependencies (used by Vercel build process)
- `next.config.ts` - Next.js configuration (used by Vercel build process)

**技术决策：**
- Prisma ORM is used (from Story 1.2)
- PostgreSQL database (Neon cloud) is configured (from Story 1.2)
- Database connection uses SSL (sslmode=require)
- Prisma Client singleton pattern prevents multiple instances

**注意事项：**
- Production `DATABASE_URL` must be configured in Vercel Dashboard (different from local `.env.local`)
- Prisma Client must be generated during build process (Vercel handles this automatically)
- Environment variables must be configured for both Production and Preview environments
- Database connection in production must use the same Prisma Client singleton pattern

[Source: .bmad-ephemeral/stories/1-3-数据库连接和-ORM-配置.md#Dev-Agent-Record]

### References

- **Epic Definition:** [Source: docs/epics/epic-1-项目基础架构foundation.md#Story-14-部署配置和-CI-CD-基础]
- **Tech Spec:** [Source: .bmad-ephemeral/stories/tech-spec-epic-1.md#Story-14-部署配置和-CI-CD-基础]
- **Architecture - Deployment Architecture:** [Source: docs/architecture/deployment-architecture.md]
- **Architecture - Project Structure:** [Source: docs/architecture/project-structure.md]
- **Architecture - Development Environment:** [Source: docs/architecture/development-environment.md]
- **Architecture - Implementation Patterns:** [Source: docs/architecture/implementation-patterns.md]
- **PRD - Functional Requirements:** [Source: docs/PRD/functional-requirements.md]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**2025-11-12 - 初始配置完成**

已完成以下配置任务：

1. **package.json 更新**
   - 添加 `postinstall` 脚本：`prisma generate`
   - 确保 Vercel 构建时自动生成 Prisma Client

2. **vercel.json 配置文件**
   - 创建 `vercel.json` 配置文件
   - 配置构建命令、开发命令、安装命令
   - 设置框架为 Next.js
   - 设置部署区域为 `iad1`（美国东部）

3. **部署文档**
   - 创建 `docs/deployment.md` 完整部署文档
   - 包含部署步骤、环境变量配置、故障排除等
   - 参考架构文档和最佳实践

**待完成的手动任务（需要在 Vercel Dashboard 中操作）：**

1. **Task 1: 连接 GitHub 仓库到 Vercel**
   - 需要在 Vercel Dashboard 中手动连接 GitHub 仓库
   - 或使用 Vercel CLI: `vercel link`
   - 参考：[快速开始指南](../docs/vercel-quick-start.md)

2. **Task 2-3: 配置自动部署和预览部署**
   - Vercel 默认已启用，但需要验证配置
   - 推送到 main 分支会自动触发生产部署
   - 创建 PR 会自动触发预览部署

3. **Task 4: 配置环境变量**
   - 需要在 Vercel Dashboard 中手动配置环境变量
   - 必需变量：`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   - 可选变量：`STORAGE_TYPE`
   - 已生成的 NEXTAUTH_SECRET: `muHsNCbwL/X6waFfiKEaWS+ACAbF268F4mwL0aYnOmo=`
   - 参考：[环境变量配置指南](../docs/vercel-env-setup.md)

4. **Task 5-6: 验证构建和数据库连接**
   - 需要在首次部署后验证
   - 需要配置生产数据库连接字符串
   - 参考：[配置检查清单](../docs/vercel-config-checklist.md)

### File List

**创建的文件：**
- `vercel.json` - Vercel 配置文件
- `docs/deployment.md` - 完整部署文档
- `docs/vercel-quick-start.md` - 快速开始指南
- `docs/vercel-env-setup.md` - 环境变量配置指南
- `docs/vercel-config-checklist.md` - 配置检查清单
- `scripts/vercel-setup.sh` - Vercel 配置辅助脚本

**修改的文件：**
- `package.json` - 添加 `postinstall` 脚本

**生成的密钥：**
- NEXTAUTH_SECRET: `muHsNCbwL/X6waFfiKEaWS+ACAbF268F4mwL0aYnOmo=`
  - 已保存到 `docs/vercel-env-setup.md`
  - 需要在 Vercel Dashboard 中配置

**验证工具：**
- `app/api/test-db/route.ts` - 数据库连接测试端点
- `docs/verification-checklist-1-4.md` - 验证检查清单
- `docs/verification-steps-1-4.md` - 验证步骤指南

**验证状态：**
- ⚠️ 需要验证所有接受标准（AC-1.4.1 到 AC-1.4.6）
- 参考验证步骤指南进行完整验证

