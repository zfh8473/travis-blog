import "next-auth";
import "next-auth/jwt";

/**
 * Type definitions for NextAuth.js to extend default types.
 * 
 * Adds custom fields to User and Session objects for role-based access control.
 */
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
  }
}

