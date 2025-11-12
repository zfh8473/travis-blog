# Architecture Decision Records (ADRs)

## ADR-001: Next.js App Router

**Decision:** Use Next.js App Router instead of Pages Router

**Rationale:**
- Modern Next.js approach
- Better performance with Server Components
- Improved developer experience
- Better TypeScript support

**Affects:** All epics

---

## ADR-002: Prisma ORM

**Decision:** Use Prisma as the ORM

**Rationale:**
- Type-safe database queries
- Excellent Next.js integration
- Migration system
- Good developer experience

**Affects:** Epic 1, 2, 3, 5

---

## ADR-003: NextAuth.js

**Decision:** Use NextAuth.js for authentication

**Rationale:**
- Next.js ecosystem integration
- Supports OAuth + JWT
- Built-in session management
- Security best practices

**Affects:** Epic 2

---

## ADR-004: Storage Abstraction Layer

**Decision:** Implement storage abstraction layer for file storage

**Rationale:**
- Enables future migration to cloud storage
- No code changes needed when migrating
- Consistent API across storage backends

**Affects:** Epic 3, 5

---

## ADR-005: Server Actions over API Routes

**Decision:** Prefer Server Actions for data mutations

**Rationale:**
- Type-safe by default
- Less boilerplate
- Better integration with React
- API Routes for external integrations only

**Affects:** All epics

---

_Created through collaborative discovery between Travis and AI facilitator._

