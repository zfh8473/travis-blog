# Epic 1: 项目基础架构（Foundation）

建立项目基础架构，包括项目初始化、数据库设计、部署配置等，为所有后续功能提供基础支撑。

## Story 1.1: 项目初始化和基础配置

As a **developer**,  
I want **to initialize the Next.js project with Tailwind CSS and configure the development environment**,  
So that **I have a solid foundation to build the blog application**.

**Acceptance Criteria:**

**Given** I have Node.js and npm/yarn installed  
**When** I run the project initialization command  
**Then** the Next.js project is created with TypeScript support  
**And** Tailwind CSS is configured and working  
**And** the project structure follows Next.js best practices  
**And** basic configuration files (package.json, tsconfig.json, tailwind.config.js) are set up correctly

**Prerequisites:** None (this is the first story)

**Technical Notes:**
- Use `create-next-app` with TypeScript template
- Configure Tailwind CSS following Next.js documentation
- Set up project structure: `app/`, `components/`, `lib/`, `public/`
- Configure ESLint and Prettier (optional but recommended)
- Set up environment variables structure

---

## Story 1.2: 数据库设计和初始化

As a **developer**,  
I want **to design and initialize the PostgreSQL database schema**,  
So that **I can store users, articles, comments, and other data**.

**Acceptance Criteria:**

**Given** PostgreSQL is installed and running  
**When** I run the database initialization script  
**Then** the database is created  
**And** all required tables are created (users, articles, categories, tags, comments, etc.)  
**And** indexes are created for performance  
**And** foreign key relationships are properly set up  
**And** database migration system is configured

**Prerequisites:** Story 1.1

**Technical Notes:**
- Design database schema based on PRD requirements
- Use migration tool (Prisma, TypeORM, or raw SQL migrations)
- Create tables: users, articles, categories, tags, article_tags, comments
- Set up indexes on frequently queried columns (user_id, article_id, published_at, etc.)
- Configure database connection pooling
- Set up database environment variables

---

## Story 1.3: 数据库连接和 ORM 配置

As a **developer**,  
I want **to configure database connection and ORM (Object-Relational Mapping)**,  
So that **I can interact with the database from the application**.

**Acceptance Criteria:**

**Given** the database schema is initialized  
**When** I configure the ORM  
**Then** the database connection is established  
**And** I can perform CRUD operations on all tables  
**And** type-safe database queries are available  
**And** connection pooling is configured correctly

**Prerequisites:** Story 1.2

**Technical Notes:**
- Choose ORM: Prisma (recommended) or TypeORM
- Configure database connection string
- Set up connection pooling
- Create database client/connection module
- Test database connectivity
- Set up database seed script (optional)

---

## Story 1.4: 部署配置和 CI/CD 基础

As a **developer**,  
I want **to configure Vercel deployment and basic CI/CD**,  
So that **I can deploy the application easily**.

**Acceptance Criteria:**

**Given** the project is initialized  
**When** I configure Vercel deployment  
**Then** the project is connected to Vercel  
**And** automatic deployments are set up on git push  
**And** environment variables are configured in Vercel  
**And** the deployment pipeline is working correctly

**Prerequisites:** Story 1.1

**Technical Notes:**
- Connect GitHub repository to Vercel
- Configure build settings (Next.js default)
- Set up environment variables in Vercel dashboard
- Configure production and preview deployments
- Test deployment process
- Set up database connection for production environment

---

## Story 1.5: 存储抽象层实现

As a **developer**,  
I want **to implement a storage abstraction layer**,  
So that **file storage can be easily migrated to cloud storage in the future**.

**Acceptance Criteria:**

**Given** the project is initialized  
**When** I implement the storage abstraction layer  
**Then** I create a storage interface (`lib/storage/interface.ts`)  
**And** I implement local file system storage (`lib/storage/local.ts`)  
**And** the storage interface supports file upload, delete, and list operations  
**And** the storage implementation can be used by other modules  
**When** I upload a file using the storage layer  
**Then** the file is saved to the local file system  
**And** the file path is returned  
**When** I delete a file using the storage layer  
**Then** the file is removed from the local file system  
**When** I list files using the storage layer  
**Then** I get a list of all files with metadata

**Prerequisites:** Story 1.1

**Technical Notes:**
- **创建存储接口 (`lib/storage/interface.ts`):**
  - Define `StorageInterface` interface with methods:
    - `upload(file: File, path?: string): Promise<string>` - Upload file, return file path/URL
    - `delete(path: string): Promise<void>` - Delete file by path
    - `list(prefix?: string): Promise<FileMetadata[]>` - List files, optionally filtered by prefix
    - `getUrl(path: string): Promise<string>` - Get public URL for file
  - Define `FileMetadata` type: `{ path: string, name: string, size: number, mimeType: string, createdAt: Date }`
- **实现本地存储 (`lib/storage/local.ts`):**
  - Implement `LocalStorage` class that implements `StorageInterface`
  - Use Node.js `fs` module for file operations
  - Store files in `public/uploads/` directory
  - Generate unique filenames (UUID or timestamp-based)
  - Create directory structure if it doesn't exist
  - Handle file upload: save to disk, return relative path
  - Handle file deletion: remove from disk
  - Handle file listing: read directory, return file metadata
  - Handle URL generation: return `/uploads/{filename}` for public access
- **创建存储工厂函数:**
  - Create `getStorage()` function that returns storage instance
  - Use environment variable to determine storage type (default: local)
  - For future: support switching to cloud storage via config
- **错误处理:**
  - Handle file system errors (permissions, disk full, etc.)
  - Validate file operations
  - Return meaningful error messages
- **测试:**
  - Test file upload, delete, and list operations
  - Test error handling
  - Ensure files are stored in correct location

---
