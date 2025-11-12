# Epic Technical Specification: 用户认证和授权（User Authentication & Authorization）

Date: 2025-11-12
Author: Travis
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 实现 travis-blog 的用户认证和授权系统，为博客平台提供完整的用户身份验证和权限控制功能。根据 PRD 的功能需求 FR-1.1 到 FR-1.4，本 Epic 涵盖用户注册、多种登录方式（邮箱密码和 OAuth）、JWT 认证中间件、基于角色的权限管理，以及用户资料管理功能。

本 Epic 是博客系统的基础功能模块，为后续的内容管理（Epic 3）、内容展示（Epic 4）和读者互动（Epic 5）提供用户身份和权限支持。所有功能将使用 NextAuth.js 作为认证框架，采用 JWT 会话策略，并通过 Prisma ORM 与 PostgreSQL 数据库交互。

---

## Objectives and Scope

### In-Scope

- **用户注册功能：** 支持邮箱注册，密码哈希存储，自动登录，错误处理
- **OAuth 登录集成：** 支持 GitHub 和 Google OAuth 登录，自动账户创建/关联
- **邮箱密码登录：** 支持已注册用户使用邮箱和密码登录，JWT token 管理
- **JWT 认证中间件：** 实现认证中间件，保护受保护的路由和 API
- **角色和权限管理：** 实现 USER 和 ADMIN 两种角色，基于角色的访问控制
- **用户资料管理：** 支持用户编辑个人资料（头像、简介），使用存储抽象层上传头像

### Out-of-Scope

- **邮件验证功能：** 邮件验证功能标记为可选，可在 MVP 后实现
- **密码重置功能：** 不在本 Epic 范围内，可在后续 Epic 实现
- **多因素认证（MFA）：** 不在 MVP 范围内
- **社交登录扩展：** 仅支持 GitHub 和 Google，其他 OAuth 提供商不在范围内
- **用户管理后台：** 用户列表、用户搜索等管理功能不在本 Epic 范围内

---

## System Architecture Alignment

本 Epic 与系统架构完全对齐，使用以下架构组件和模式：

**认证架构：**
- NextAuth.js 作为认证框架，配置 Credentials、GitHub OAuth、Google OAuth 三个 providers
- JWT 会话策略，token 存储在 httpOnly cookies 中
- Token 过期时间：30 天（可配置）
- 支持 refresh tokens

**数据架构：**
- User 模型已存在于 Prisma schema 中，需要添加 `password` 字段（String?, optional）
- Role 枚举已定义（USER, ADMIN）
- 使用 Prisma ORM 进行所有数据库操作

**API 架构：**
- 使用 Next.js API Routes 创建认证端点
- 统一错误响应格式：`{ success: false, error: { message: string, code: string } }`
- HTTP 状态码：200 (Success), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 409 (Conflict), 500 (Internal Server Error)

**安全架构：**
- 所有输入使用 Zod 进行服务器端验证
- 密码使用 bcrypt 哈希存储
- SQL 注入防护：Prisma 参数化查询（自动）
- XSS 防护：React 自动转义，CSP headers

**存储架构：**
- 头像上传使用存储抽象层（Epic 1 Story 1.5 已实现）
- 本地存储实现，未来可迁移到云存储

参考：[Source: docs/architecture.md#Security-Architecture], [Source: docs/architecture.md#Authentication], [Source: docs/architecture/security-architecture.md]

---

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **NextAuth.js Configuration** | 认证框架配置和会话管理 | 用户凭证、OAuth 回调 | JWT tokens、会话对象 | `app/api/auth/[...nextauth]/route.ts` |
| **Registration Service** | 用户注册处理 | 邮箱、密码 | 用户记录、JWT token | `app/api/auth/register/route.ts` |
| **Password Utility** | 密码哈希和验证 | 明文密码、哈希密码 | 哈希密码、验证结果 | `lib/auth/password.ts` |
| **Validation Service** | 输入验证 | 用户输入数据 | 验证结果、错误信息 | `lib/validations/auth.ts` |
| **Auth Middleware** | 路由保护和认证验证 | HTTP 请求 | 认证用户信息、401/403 响应 | `lib/auth/middleware.ts` |
| **Permission Service** | 角色和权限检查 | 用户角色、所需权限 | 权限检查结果 | `lib/auth/permissions.ts` |
| **Profile Service** | 用户资料管理 | 用户 ID、资料数据 | 更新后的用户资料 | `app/api/profile/route.ts` |
| **Storage Service** | 头像文件上传 | 文件对象 | 文件路径 | `lib/storage/` (已实现) |

### Data Models and Contracts

**User Model (Prisma Schema):**

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?  // 新增：可选，OAuth 用户无密码
  name      String?
  image     String?  // 头像路径
  bio       String?  // 新增：用户简介
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  articles  Article[]
  comments  Comment[]

  @@map("users")
}
```

**Schema Changes Required:**
- 添加 `password` 字段：`String?` (optional，OAuth 用户无密码)
- 添加 `bio` 字段：`String?` (optional，用户简介)
- 现有字段保持不变

**Registration Request Schema (Zod):**

```typescript
{
  email: string;      // 邮箱地址，RFC 5322 格式验证
  password: string;   // 密码，最小长度 8 字符，包含字母和数字
  name?: string;      // 可选，用户名称
}
```

**Login Request Schema (Zod):**

```typescript
{
  email: string;      // 邮箱地址
  password: string;   // 密码
}
```

**Profile Update Schema (Zod):**

```typescript
{
  name?: string;      // 可选，用户名称
  bio?: string;       // 可选，用户简介
  image?: string;     // 可选，头像路径（由上传 API 返回）
}
```

参考：[Source: prisma/schema.prisma#User-model]

### APIs and Interfaces

**1. Registration API**

- **Endpoint:** `POST /api/auth/register`
- **Request Body:**
  ```typescript
  {
    email: string;
    password: string;
    name?: string;
  }
  ```
- **Success Response (201):**
  ```typescript
  {
    success: true,
    data: {
      user: {
        id: string;
        email: string;
        name: string | null;
        role: "USER" | "ADMIN";
      };
      token: string; // JWT token
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: 输入验证失败
  - `409 Conflict`: 邮箱已存在
  - `500 Internal Server Error`: 服务器错误

**2. Login API (Credentials)**

- **Endpoint:** `POST /api/auth/login` (通过 NextAuth.js Credentials provider)
- **Request Body:**
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Success Response (200):** NextAuth.js 自动处理，返回 JWT token in httpOnly cookie
- **Error Responses:**
  - `401 Unauthorized`: 无效凭证
  - `400 Bad Request`: 输入验证失败

**3. OAuth Login (GitHub/Google)**

- **Endpoint:** `GET /api/auth/signin/github` 或 `GET /api/auth/signin/google`
- **Flow:** NextAuth.js OAuth 流程（Authorization Code Flow）
- **Callback:** `GET /api/auth/callback/github` 或 `GET /api/auth/callback/google`
- **Success:** 自动创建/登录用户，返回 JWT token in httpOnly cookie

**4. Profile API**

- **GET Profile:** `GET /api/profile`
  - **Response (200):**
    ```typescript
    {
      success: true,
      data: {
        id: string;
        email: string;
        name: string | null;
        image: string | null;
        bio: string | null;
        role: "USER" | "ADMIN";
      }
    }
    ```
- **UPDATE Profile:** `PUT /api/profile`
  - **Request Body:**
    ```typescript
    {
      name?: string;
      bio?: string;
      image?: string;
    }
    ```
  - **Success Response (200):** 更新后的用户资料
  - **Error Responses:**
    - `401 Unauthorized`: 未认证
    - `400 Bad Request`: 输入验证失败

**5. Avatar Upload API**

- **Endpoint:** `POST /api/profile/avatar`
- **Request:** `FormData` with file
- **Success Response (200):**
  ```typescript
  {
    success: true,
    data: {
      imagePath: string; // 用于更新用户资料的 image 字段
    }
  }
  ```
- **Uses:** Storage abstraction layer (`lib/storage/`)

参考：[Source: docs/architecture.md#API-Contracts], [Source: docs/architecture.md#Security-Architecture]

### Workflows and Sequencing

**1. User Registration Flow:**

```
1. User navigates to /register
2. User fills registration form (email, password, optional name)
3. Client validates input (client-side)
4. Submit to POST /api/auth/register
5. Server validates input (Zod schema)
6. Check for duplicate email
7. Hash password (bcrypt)
8. Create user record in database
9. Generate JWT token (NextAuth.js)
10. Set httpOnly cookie with token
11. Return success response
12. Client redirects to homepage or dashboard
```

**2. Email/Password Login Flow:**

```
1. User navigates to /login
2. User enters email and password
3. Submit to NextAuth.js Credentials provider
4. Server validates credentials
5. Compare password hash (bcrypt)
6. If valid: Generate JWT token, set httpOnly cookie
7. If invalid: Return 401 Unauthorized
8. Client redirects based on authentication result
```

**3. OAuth Login Flow (GitHub/Google):**

```
1. User clicks "Login with GitHub/Google"
2. Redirect to OAuth provider authorization page
3. User authorizes application
4. OAuth provider redirects to callback URL
5. NextAuth.js exchanges authorization code for access token
6. Fetch user info from OAuth provider
7. Check if user exists in database (by email)
8. If exists: Link OAuth account, login
9. If not exists: Create new user, login
10. Generate JWT token, set httpOnly cookie
11. Redirect to homepage or dashboard
```

**4. Protected Route Access Flow:**

```
1. User makes request to protected route
2. Auth middleware extracts JWT token from cookie
3. Verify token signature and expiration
4. If valid: Attach user info to request context, proceed
5. If invalid/expired: Return 401 Unauthorized, redirect to /login
```

**5. Role-Based Access Control Flow:**

```
1. User makes request to admin route
2. Auth middleware verifies authentication
3. Permission service checks user role
4. If role === "ADMIN": Grant access
5. If role === "USER": Return 403 Forbidden
```

**6. Profile Update Flow:**

```
1. User navigates to /profile (authenticated)
2. User edits profile information
3. If avatar update: Upload file to /api/profile/avatar
4. Get image path from upload response
5. Submit profile update to PUT /api/profile
6. Server validates input
7. Update user record in database
8. Return updated profile data
9. Client updates UI
```

参考：[Source: docs/architecture.md#Authentication], [Source: docs/epics/epic-2-用户认证和授权user-authentication-authorization.md]

---

## Non-Functional Requirements

### Performance

- **Registration API:** 响应时间 < 500ms (包括密码哈希)
- **Login API:** 响应时间 < 300ms (包括密码验证)
- **OAuth Flow:** 完整流程 < 2s (包括外部 OAuth 提供商响应)
- **Auth Middleware:** 中间件开销 < 50ms per request
- **Database Queries:** 使用 Prisma select 限制字段，避免 N+1 查询
- **Token Verification:** JWT 验证 < 10ms

参考：[Source: docs/architecture.md#Performance-Considerations]

### Security

- **Password Security:**
  - 密码最小长度：8 字符
  - 密码复杂度：至少包含字母和数字
  - 密码哈希：bcrypt，salt rounds ≥ 10
  - 密码不存储在日志中

- **Token Security:**
  - JWT token 存储在 httpOnly cookies（防止 XSS）
  - Token 过期时间：30 天（可配置）
  - Token 签名使用 NEXTAUTH_SECRET
  - 支持 refresh tokens

- **Input Validation:**
  - 所有输入使用 Zod 进行服务器端验证
  - 邮箱格式验证（RFC 5322）
  - SQL 注入防护：Prisma 参数化查询（自动）

- **OAuth Security:**
  - 使用 Authorization Code Flow（最安全）
  - OAuth state parameter 防止 CSRF
  - 验证 OAuth provider 返回的 token

- **Authorization:**
  - 基于角色的访问控制（RBAC）
  - Admin 路由保护
  - 权限检查在服务器端执行

参考：[Source: docs/architecture/security-architecture.md], [Source: docs/architecture.md#Security-Architecture]

### Reliability/Availability

- **Database Availability:**
  - 使用 Prisma 连接池管理数据库连接
  - 处理数据库连接错误，返回适当的错误响应
  - 数据库操作使用事务（如需要）

- **Error Handling:**
  - 所有 API 端点都有错误处理
  - 返回统一的错误格式
  - 记录错误日志（不包含敏感信息）

- **Graceful Degradation:**
  - OAuth 提供商不可用时，显示错误信息，允许邮箱登录
  - 数据库连接失败时，返回 503 Service Unavailable

参考：[Source: docs/architecture.md#Error-Handling]

### Observability

- **Logging:**
  - 记录注册事件（不包含密码）
  - 记录登录成功/失败事件
  - 记录 OAuth 登录事件
  - 记录权限拒绝事件（403）
  - 使用结构化日志格式

- **Metrics:**
  - 注册成功率
  - 登录成功率
  - OAuth 登录成功率
  - 认证中间件响应时间
  - 权限检查失败次数

- **Error Tracking:**
  - 记录所有认证错误
  - 记录数据库错误
  - 记录 OAuth 错误

参考：[Source: docs/architecture.md#Logging]

---

## Dependencies and Integrations

### External Dependencies

| Package | Version | Purpose | Epic Stories |
|---------|---------|---------|--------------|
| `next-auth` | Latest | 认证框架，OAuth 和 JWT 支持 | 2.1, 2.2, 2.3, 2.4 |
| `bcryptjs` | Latest | 密码哈希和验证 | 2.1, 2.3 |
| `@types/bcryptjs` | Latest | bcryptjs TypeScript 类型 | 2.1, 2.3 |
| `zod` | Latest | 输入验证和模式定义 | 2.1, 2.3, 2.6 |

### Internal Dependencies

| Component | Location | Purpose | Epic Stories |
|-----------|----------|---------|--------------|
| **Prisma Client** | `lib/db/prisma.ts` | 数据库操作 | All |
| **Storage Abstraction** | `lib/storage/` | 文件上传（头像） | 2.6 |
| **User Model** | `prisma/schema.prisma` | 用户数据模型 | All |

### Integration Points

- **NextAuth.js → OAuth Providers:**
  - GitHub OAuth App
  - Google OAuth App
  - 需要配置 OAuth Client ID 和 Secret

- **NextAuth.js → Database:**
  - 通过 Prisma Client 访问 User 模型
  - 自动创建/更新用户记录

- **Storage Layer → File System:**
  - 使用存储抽象层上传头像
  - 文件存储在 `public/uploads/` 目录

参考：[Source: package.json], [Source: docs/architecture/technology-stack-details.md]

---

## Acceptance Criteria (Authoritative)

### Story 2.1: 用户注册功能（邮箱注册）

1. **AC-2.1.1:** Given I am on the registration page, When I enter a valid email address and password, And I submit the registration form, Then my account is created in the database
2. **AC-2.1.2:** I receive a confirmation (optional email verification)
3. **AC-2.1.3:** I am automatically logged in after successful registration
4. **AC-2.1.4:** I am redirected to the appropriate page after registration
5. **AC-2.1.5:** Registration errors are handled (duplicate email, invalid input)

### Story 2.2: OAuth 登录集成（GitHub 和 Google）

6. **AC-2.2.1:** Given I am on the login page, When I click the "Login with GitHub" or "Login with Google" button, Then I am redirected to the OAuth provider
7. **AC-2.2.2:** After authorizing, I am redirected back to the blog
8. **AC-2.2.3:** My account is created or logged in automatically
9. **AC-2.2.4:** I receive a JWT token
10. **AC-2.2.5:** I am logged in successfully

### Story 2.3: 用户登录功能（邮箱密码登录）

11. **AC-2.3.1:** Given I have a registered account, When I enter my email and password on the login page, And I submit the login form, Then my credentials are validated
12. **AC-2.3.2:** I receive a JWT token
13. **AC-2.3.3:** I am logged in successfully
14. **AC-2.3.4:** I am redirected to the appropriate page
15. **AC-2.3.5:** My login state persists across page refreshes

### Story 2.4: JWT 认证中间件

16. **AC-2.4.1:** Given a user makes a request to a protected route, When the request includes a valid JWT token, Then the user is authenticated
17. **AC-2.4.2:** The user information is available in the request context
18. **AC-2.4.3:** The request proceeds normally
19. **AC-2.4.4:** When the request includes an invalid or expired token, Then the request is rejected with 401 Unauthorized
20. **AC-2.4.5:** The user is redirected to login

### Story 2.5: 用户角色和权限管理

21. **AC-2.5.1:** Given users exist in the database, When a user is created, Then the user is assigned a default role (user or admin)
22. **AC-2.5.2:** Role-based permissions are enforced
23. **AC-2.5.3:** Admin users can access admin features
24. **AC-2.5.4:** Regular users cannot access admin features
25. **AC-2.5.5:** When an admin tries to access admin features, Then access is granted
26. **AC-2.5.6:** When a regular user tries to access admin features, Then access is denied with 403 Forbidden

### Story 2.6: 用户资料管理

27. **AC-2.6.1:** Given I am logged in, When I navigate to my profile page, Then I can see my current profile information
28. **AC-2.6.2:** When I update my avatar, Then the avatar is uploaded and saved
29. **AC-2.6.3:** The new avatar is displayed
30. **AC-2.6.4:** When I update my bio, Then the bio is saved to the database
31. **AC-2.6.5:** The updated bio is displayed

参考：[Source: docs/epics/epic-2-用户认证和授权user-authentication-authorization.md]

---

## Traceability Mapping

| AC ID | Spec Section | Component/API | Test Idea |
|-------|--------------|---------------|-----------|
| AC-2.1.1 | Registration API, Data Models | `POST /api/auth/register`, `User` model | 测试注册成功，验证数据库记录 |
| AC-2.1.2 | Registration Flow | Email verification (optional) | 测试邮件验证流程（如实现） |
| AC-2.1.3 | Registration Flow, NextAuth.js | Auto-login after registration | 测试注册后自动登录 |
| AC-2.1.4 | Registration Flow | Redirect logic | 测试注册后重定向 |
| AC-2.1.5 | Registration API, Validation | Error handling | 测试重复邮箱、无效输入错误 |
| AC-2.2.1 | OAuth Flow | NextAuth.js GitHub/Google providers | 测试 OAuth 重定向 |
| AC-2.2.2 | OAuth Flow | OAuth callback | 测试 OAuth 回调处理 |
| AC-2.2.3 | OAuth Flow | User creation/linking | 测试自动创建/关联账户 |
| AC-2.2.4 | OAuth Flow | JWT token generation | 测试 OAuth 登录后 token 生成 |
| AC-2.2.5 | OAuth Flow | Session creation | 测试 OAuth 登录成功 |
| AC-2.3.1 | Login API, Password Utility | Credentials provider, bcrypt | 测试凭证验证 |
| AC-2.3.2 | Login Flow | JWT token generation | 测试登录后 token 生成 |
| AC-2.3.3 | Login Flow | Session creation | 测试登录成功 |
| AC-2.3.4 | Login Flow | Redirect logic | 测试登录后重定向 |
| AC-2.3.5 | NextAuth.js | Session persistence | 测试页面刷新后会话保持 |
| AC-2.4.1 | Auth Middleware | JWT verification | 测试有效 token 认证 |
| AC-2.4.2 | Auth Middleware | Request context | 测试用户信息附加到请求 |
| AC-2.4.3 | Auth Middleware | Route protection | 测试受保护路由访问 |
| AC-2.4.4 | Auth Middleware | Error handling | 测试无效/过期 token 拒绝 |
| AC-2.4.5 | Auth Middleware | Redirect logic | 测试未认证重定向到登录 |
| AC-2.5.1 | User Model, Registration | Role assignment | 测试默认角色分配 |
| AC-2.5.2 | Permission Service | Role-based access | 测试权限强制执行 |
| AC-2.5.3 | Permission Service | Admin access | 测试管理员访问权限 |
| AC-2.5.4 | Permission Service | User restrictions | 测试普通用户限制 |
| AC-2.5.5 | Permission Service | Admin route access | 测试管理员路由访问 |
| AC-2.5.6 | Permission Service | 403 Forbidden | 测试普通用户访问管理员功能被拒绝 |
| AC-2.6.1 | Profile API | `GET /api/profile` | 测试获取用户资料 |
| AC-2.6.2 | Profile API, Storage | `POST /api/profile/avatar` | 测试头像上传 |
| AC-2.6.3 | Profile API | Avatar display | 测试头像显示 |
| AC-2.6.4 | Profile API | `PUT /api/profile` | 测试简介更新 |
| AC-2.6.5 | Profile API | Bio display | 测试简介显示 |

---

## Risks, Assumptions, Open Questions

### Risks

1. **Risk: OAuth Provider Configuration Complexity**
   - **Description:** GitHub 和 Google OAuth 应用配置可能复杂，需要正确的回调 URL
   - **Mitigation:** 提供详细的配置文档，在开发环境测试 OAuth 流程
   - **Impact:** Medium

2. **Risk: Password Security**
   - **Description:** 密码哈希和存储不当可能导致安全漏洞
   - **Mitigation:** 使用 bcrypt，遵循安全最佳实践，代码审查
   - **Impact:** High

3. **Risk: JWT Token Management**
   - **Description:** Token 过期和刷新机制可能复杂
   - **Mitigation:** 使用 NextAuth.js 内置的 token 管理，遵循文档
   - **Impact:** Medium

4. **Risk: Database Schema Migration**
   - **Description:** 添加 password 和 bio 字段需要数据库迁移
   - **Mitigation:** 使用 Prisma Migrate，在开发环境测试迁移
   - **Impact:** Low

### Assumptions

1. **Assumption: NextAuth.js Compatibility**
   - NextAuth.js 与 Next.js 16.0.2 完全兼容
   - **Validation:** 已在架构文档中确认

2. **Assumption: OAuth Provider Availability**
   - GitHub 和 Google OAuth 服务在部署环境中可用
   - **Validation:** 需要在部署前验证

3. **Assumption: Storage Abstraction Layer**
   - 存储抽象层（Epic 1 Story 1.5）已实现并可用
   - **Validation:** 已确认完成

### Open Questions

1. **Question: Email Verification Implementation**
   - 邮件验证功能是否在 MVP 中实现？
   - **Answer:** 标记为可选，可在 MVP 后实现

2. **Question: First Admin User Creation**
   - 如何创建第一个管理员用户？
   - **Answer:** 通过数据库 seed 脚本或手动设置

3. **Question: OAuth Account Linking Strategy**
   - 如果 OAuth 邮箱与现有账户邮箱匹配，如何链接？
   - **Answer:** 自动链接到现有账户，使用相同的用户记录

参考：[Source: docs/epics/epic-2-用户认证和授权user-authentication-authorization.md]

---

## Test Strategy Summary

### Test Levels

**1. Unit Tests:**
- Password hashing utility (`lib/auth/password.ts`)
- Validation schemas (`lib/validations/auth.ts`)
- Permission service (`lib/auth/permissions.ts`)

**2. Integration Tests:**
- Registration API endpoint (`POST /api/auth/register`)
- Login API endpoint (Credentials provider)
- OAuth callback handling
- Profile API endpoints (`GET /api/profile`, `PUT /api/profile`)
- Avatar upload API (`POST /api/profile/avatar`)

**3. End-to-End Tests:**
- Complete registration flow
- Complete login flow (email/password)
- Complete OAuth login flow (GitHub/Google)
- Protected route access
- Role-based access control
- Profile update flow

### Test Coverage

- **Acceptance Criteria Coverage:** 所有 31 个 AC 都有对应的测试
- **Critical Paths:** 注册、登录、OAuth、认证中间件、权限检查
- **Edge Cases:**
  - 重复邮箱注册
  - 无效凭证登录
  - 过期 token 访问
  - 普通用户访问管理员功能
  - OAuth 账户链接

### Test Frameworks

- **Unit Tests:** Jest 或 Vitest
- **Integration Tests:** Next.js API route testing
- **E2E Tests:** Playwright 或 Cypress（可选）

参考：[Source: docs/architecture.md#Testing-Strategy]

---

**Document Status:** Draft  
**Last Updated:** 2025-11-12  
**Next Review:** After Story 2.1 implementation

