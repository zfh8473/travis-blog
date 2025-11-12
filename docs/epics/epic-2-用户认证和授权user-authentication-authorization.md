# Epic 2: 用户认证和授权（User Authentication & Authorization）

实现用户注册、登录、角色管理和权限控制，为博客系统提供用户身份验证和授权功能。

## Story 2.1: 用户注册功能（邮箱注册）

As a **visitor**,  
I want **to register an account using my email address**,  
So that **I can access the blog features that require authentication**.

**Acceptance Criteria:**

**Given** I am on the registration page  
**When** I enter a valid email address and password  
**And** I submit the registration form  
**Then** my account is created in the database  
**And** I receive a confirmation (optional email verification)  
**And** I am automatically logged in  
**And** I am redirected to the appropriate page

**Prerequisites:** Epic 1 (all stories)

**Technical Notes:**
- Create registration API endpoint
- Implement email validation
- Implement password hashing using bcrypt
- Store user data in database
- Generate JWT token after registration
- Set up email verification (optional for MVP)
- Handle registration errors (duplicate email, invalid input)

---

## Story 2.2: OAuth 登录集成（GitHub 和 Google）

As a **visitor**,  
I want **to log in using my GitHub or Google account**,  
So that **I can quickly access the blog without creating a new account**.

**Acceptance Criteria:**

**Given** I am on the login page  
**When** I click the "Login with GitHub" or "Login with Google" button  
**Then** I am redirected to the OAuth provider  
**And** after authorizing, I am redirected back to the blog  
**And** my account is created or logged in automatically  
**And** I receive a JWT token  
**And** I am logged in successfully

**Prerequisites:** Story 2.1

**Technical Notes:**
- Set up OAuth apps in GitHub and Google
- Configure OAuth callback URLs
- Implement OAuth flow (authorization code flow)
- Store OAuth user data in database
- Link OAuth accounts to existing email accounts (if email matches)
- Generate JWT token after OAuth login
- Handle OAuth errors

---

## Story 2.3: 用户登录功能（邮箱密码登录）

As a **registered user**,  
I want **to log in using my email and password**,  
So that **I can access my account and blog features**.

**Acceptance Criteria:**

**Given** I have a registered account  
**When** I enter my email and password on the login page  
**And** I submit the login form  
**Then** my credentials are validated  
**And** I receive a JWT token  
**And** I am logged in successfully  
**And** I am redirected to the appropriate page  
**And** my login state persists across page refreshes

**Prerequisites:** Story 2.1

**Technical Notes:**
- Create login API endpoint
- Validate email and password
- Compare password hash using bcrypt
- Generate JWT token with user information
- Set JWT token in httpOnly cookie
- Implement token expiration and refresh mechanism
- Handle login errors (invalid credentials, account not found)

---

## Story 2.4: JWT 认证中间件

As a **developer**,  
I want **to implement JWT authentication middleware**,  
So that **protected routes can verify user authentication**.

**Acceptance Criteria:**

**Given** a user makes a request to a protected route  
**When** the request includes a valid JWT token  
**Then** the user is authenticated  
**And** the user information is available in the request context  
**And** the request proceeds normally  
**When** the request includes an invalid or expired token  
**Then** the request is rejected with 401 Unauthorized  
**And** the user is redirected to login

**Prerequisites:** Story 2.3

**Technical Notes:**
- Create JWT verification middleware
- Extract token from httpOnly cookie or Authorization header
- Verify token signature and expiration
- Attach user information to request context
- Handle token refresh (if token is expired but refresh token is valid)
- Protect API routes and pages that require authentication

---

## Story 2.5: 用户角色和权限管理

As a **developer**,  
I want **to implement user roles and permission system**,  
So that **different users have different access levels**.

**Acceptance Criteria:**

**Given** users exist in the database  
**When** a user is created  
**Then** the user is assigned a default role (user or admin)  
**And** role-based permissions are enforced  
**And** admin users can access admin features  
**And** regular users cannot access admin features  
**When** an admin tries to access admin features  
**Then** access is granted  
**When** a regular user tries to access admin features  
**Then** access is denied with 403 Forbidden

**Prerequisites:** Story 2.4

**Technical Notes:**
- Add role field to users table (enum: 'user', 'admin')
- Create permission check middleware/function
- Protect admin routes with role check
- Set up first admin user (seed script or manual)
- Implement role-based UI rendering (show/hide admin links)
- Test permission enforcement

---

## Story 2.6: 用户资料管理

As a **registered user**,  
I want **to manage my profile information (avatar, bio)**,  
So that **other users can see my profile details**.

**Acceptance Criteria:**

**Given** I am logged in  
**When** I navigate to my profile page  
**Then** I can see my current profile information  
**When** I update my avatar  
**Then** the avatar is uploaded and saved  
**And** the new avatar is displayed  
**When** I update my bio  
**Then** the bio is saved to the database  
**And** the updated bio is displayed

**Prerequisites:** Story 2.5

**Technical Notes:**
- Create profile API endpoints (GET, PUT)
- Implement avatar upload (local storage with abstract layer)
- Store avatar path in database
- Create profile page UI
- Implement profile update form
- Add validation for profile fields
- Display profile information in comments and other places

---
