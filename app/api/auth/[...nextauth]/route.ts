import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db/prisma";
import { comparePassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validations/auth";
import { Role } from "@prisma/client";

/**
 * Validates required environment variables for NextAuth.js.
 * Throws an error if NEXTAUTH_SECRET is not set.
 * OAuth environment variables are optional (only required if OAuth providers are used).
 */
function validateAuthEnv() {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
      "NEXTAUTH_SECRET environment variable is required. " +
        "Please set it in your .env.local file or environment variables."
    );
  }
}

// Validate environment variables at module load time
validateAuthEnv();

/**
 * NextAuth.js configuration for authentication.
 * 
 * Configured with:
 * - Credentials provider for email/password authentication
 * - GitHub OAuth provider
 * - Google OAuth provider
 * - JWT session strategy
 * - httpOnly cookie storage for tokens
 * - 30-day token expiration
 * 
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Validate input
        const validationResult = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
        });

        if (!validationResult.success) {
          throw new Error("Invalid email or password format");
        }

        const { email, password } = validationResult.data;

        // Find user by email (include password field)
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            image: true,
            bio: true,
            role: true,
          },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Check if user has a password (not OAuth user)
        if (!user.password) {
          throw new Error("This account uses OAuth login. Please use OAuth to sign in.");
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        // Return user object (will be encoded in JWT)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          bio: user.bio,
          role: user.role,
        };
      },
    }),
    // GitHub OAuth Provider
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    // Google OAuth Provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    /**
     * Handles OAuth sign-in and account creation/linking.
     * For OAuth providers, creates or links user account based on email.
     */
    async signIn({ user, account, profile }) {
      // For OAuth providers (GitHub, Google)
      if (account?.provider === "github" || account?.provider === "google") {
        if (!user.email) {
          console.error("OAuth signIn: Provider did not return email", {
            provider: account?.provider,
            user: { id: user.id, name: user.name },
          });
          return false;
        }

        try {
          console.log("OAuth signIn: Processing", {
            provider: account?.provider,
            email: user.email,
            name: user.name,
          });

          // Check if user exists by email
          // Note: We don't select password here since we're in OAuth flow
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (existingUser) {
            // User exists - link OAuth account to existing user
            // Update user with OAuth profile data if available
            console.log("OAuth signIn: Linking to existing user", {
              userId: existingUser.id,
              email: existingUser.email,
            });
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                // Keep existing password if user has one (email/password user)
                // OAuth users will have null password
              },
            });
          } else {
            // User doesn't exist - create new user with OAuth data
            console.log("OAuth signIn: Creating new user", {
              email: user.email,
              name: user.name,
            });
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                password: null, // OAuth users don't have passwords
                role: Role.USER, // Default role for new users
              },
            });
          }

          console.log("OAuth signIn: Success");
          return true;
        } catch (error) {
          console.error("OAuth signIn: Error in callback", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            provider: account?.provider,
            email: user.email,
          });
          return false;
        }
      }

      // For Credentials provider, allow sign in
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        // For OAuth providers, fetch complete user data from database
        if (account?.provider === "github" || account?.provider === "google") {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email! },
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
                bio: true,
                role: true,
              },
            });

            if (dbUser) {
              token.id = dbUser.id;
              token.email = dbUser.email;
              token.name = dbUser.name;
              token.image = dbUser.image;
              token.bio = dbUser.bio;
              token.role = dbUser.role;
            }
          } catch (error) {
            console.error("Error fetching user in jwt callback:", error);
          }
        } else {
          // For Credentials provider, use user data from authorize function
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.bio = (user as any).bio || null;
        // Type assertion is safe here because we've extended NextAuth types
        token.role = user.role as string;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        session.user.image = token.image as string | null;
        session.user.bio = (token as any).bio as string | null;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

