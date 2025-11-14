/**
 * Integration tests for tags API endpoints.
 * 
 * Tests the API endpoints for tags:
 * - POST /api/tags - Create new tag
 */

import { POST as postTag } from "@/app/api/tags/route";
import { prisma } from "@/lib/db/prisma";

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextRequest: class NextRequest {
    constructor(public url: string, public init?: any) {}
    async json() {
      return this.init?.body ? JSON.parse(this.init.body) : {};
    }
    get headers() {
      return this.init?.headers || new Headers();
    }
  },
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: async () => body,
      status: init?.status || 200,
    })),
  },
}));

// Mock Prisma
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    tag: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth/middleware", () => ({
  getUserFromHeaders: jest.fn(),
}));

jest.mock("@/lib/auth/permissions", () => ({
  requireAdmin: jest.fn(),
}));

// Mock slug utility
jest.mock("@/lib/utils/slug", () => ({
  generateSlug: jest.fn((name: string) => name.toLowerCase().replace(/\s+/g, "-")),
}));

describe("POST /api/tags", () => {
  const { getUserFromHeaders } = require("@/lib/auth/middleware");
  const { requireAdmin } = require("@/lib/auth/permissions");

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: authenticated admin user
    getUserFromHeaders.mockReturnValue({
      id: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
    });
    requireAdmin.mockReturnValue(null);
  });

  it("should create a new tag", async () => {
    const mockTag = {
      id: "tag-1",
      name: "React",
      slug: "react",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (prisma.tag.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.tag.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.tag.create as jest.Mock).mockResolvedValue(mockTag);

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/tags", {
      body: JSON.stringify({ name: "React" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await postTag(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("React");
    expect(prisma.tag.create).toHaveBeenCalled();
  });

  it("should return 400 if tag name is missing", async () => {
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/tags", {
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const response = await postTag(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 if tag with same name already exists", async () => {
    const existingTag = {
      id: "tag-1",
      name: "React",
      slug: "react",
    };

    (prisma.tag.findFirst as jest.Mock).mockResolvedValue(existingTag);

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/tags", {
      body: JSON.stringify({ name: "React" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await postTag(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("DUPLICATE_TAG");
  });

  it("should return 401 if not authenticated", async () => {
    getUserFromHeaders.mockReturnValue(null);
    requireAdmin.mockReturnValue({
      status: 401,
      json: jest.fn().mockResolvedValue({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      }),
    });

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/tags", {
      body: JSON.stringify({ name: "React" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await postTag(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 403 if not admin", async () => {
    getUserFromHeaders.mockReturnValue({
      id: "user-1",
      email: "user@example.com",
      role: "USER",
    });
    requireAdmin.mockReturnValue({
      status: 403,
      json: jest.fn().mockResolvedValue({
        success: false,
        error: { message: "Forbidden", code: "FORBIDDEN" },
      }),
    });

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/tags", {
      body: JSON.stringify({ name: "React" }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await postTag(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("FORBIDDEN");
  });
});

