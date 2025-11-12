"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * Session provider wrapper for NextAuth.js.
 * 
 * Wraps the application with NextAuth SessionProvider to enable
 * authentication context throughout the app.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} SessionProvider wrapper
 */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

