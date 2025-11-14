/**
 * Integration tests for categories and tags API endpoints.
 * 
 * Tests the API endpoints for fetching categories and tags:
 * - GET /api/categories
 * - GET /api/tags
 * - POST /api/tags
 */

import { GET as getCategories } from "@/app/api/categories/route";
import { GET as getTags, POST as postTag } from "@/app/api/tags/route";
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
    category: {
      findMany: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
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

describe("GET /api/categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return list of categories", async () => {
    const mockCategories = [
      {
        id: "cat-1",
        name: "技术",
        slug: "tech",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "cat-2",
        name: "生活",
        slug: "life",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/categories");
    const response = await getCategories(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockCategories);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      orderBy: {
        name: "asc",
      },
    });
  });

  it("should return empty array if no categories", async () => {
    (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/categories");
    const response = await getCategories(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it("should handle database errors", async () => {
    (prisma.category.findMany as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/categories");
    const response = await getCategories(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("GET /api/tags", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return list of tags", async () => {
    const mockTags = [
      {
        id: "tag-1",
        name: "React",
        slug: "react",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tag-2",
        name: "Next.js",
        slug: "nextjs",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.tag.findMany as jest.Mock).mockResolvedValue(mockTags);

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/tags");
    const response = await getTags(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockTags);
    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      orderBy: {
        name: "asc",
      },
    });
  });

  it("should return empty array if no tags", async () => {
    (prisma.tag.findMany as jest.Mock).mockResolvedValue([]);

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/tags");
    const response = await getTags(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it("should handle database errors", async () => {
    (prisma.tag.findMany as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://localhost/api/tags");
    const response = await getTags(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INTERNAL_ERROR");
  });
});

