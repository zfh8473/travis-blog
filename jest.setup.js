// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Polyfill for TextEncoder/TextDecoder (required by next-auth)
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Polyfill for Next.js server components in Jest
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body || null;
    }
  };
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
    }
    json() {
      return Promise.resolve(JSON.parse(this.body));
    }
  };
}

if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    constructor(init) {
      this._headers = {};
      if (init) {
        if (init instanceof Headers) {
          this._headers = { ...init._headers };
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value;
          });
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this._headers[key.toLowerCase()] = value;
          });
        }
      }
    }
    get(name) {
      return this._headers[name.toLowerCase()] || null;
    }
    set(name, value) {
      this._headers[name.toLowerCase()] = value;
    }
    has(name) {
      return name.toLowerCase() in this._headers;
    }
  };
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => {
      const response = new globalThis.Response(JSON.stringify(body), init);
      return response;
    }),
    redirect: jest.fn((url) => {
      return new globalThis.Response(null, { status: 307, headers: { Location: url } });
    }),
  },
}));

