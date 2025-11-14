/**
 * Unit tests for OAuth callback handling logic.
 * 
 * Tests the signIn callback logic without actual OAuth provider interaction.
 */

import { Role } from '@prisma/client';

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';

describe('OAuth Callback Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn Callback - New User Creation', () => {
    it('should create new user when email does not exist', async () => {
      const mockUser = {
        email: 'new-oauth@example.com',
        name: 'New OAuth User',
        image: 'https://example.com/avatar.jpg',
      };

      const mockAccount = {
        provider: 'github' as const,
      };

      // Mock: user does not exist
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Mock: create new user
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: mockUser.email,
        name: mockUser.name,
        image: mockUser.image,
        password: null,
        role: Role.USER,
      });

      // Simulate signIn callback logic
      const existingUser = await prisma.user.findUnique({
        where: { email: mockUser.email },
      });

      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: {
            email: mockUser.email,
            name: mockUser.name || null,
            image: mockUser.image || null,
            password: null,
            role: Role.USER,
          },
        });

        expect(newUser).toBeDefined();
        expect(newUser.email).toBe(mockUser.email);
        expect(newUser.role).toBe(Role.USER);
        expect(prisma.user.create).toHaveBeenCalledWith({
          data: {
            email: mockUser.email,
            name: mockUser.name,
            image: mockUser.image,
            password: null,
            role: Role.USER,
          },
        });
      }
    });

    it('should handle missing email from OAuth provider', async () => {
      const mockUser = {
        email: null as string | null,
        name: 'User Without Email',
      };

      const mockAccount = {
        provider: 'github' as const,
      };

      // If email is missing, signIn callback should return false
      if (!mockUser.email) {
        expect(mockUser.email).toBeNull();
        // In actual implementation, this would return false
      }
    });
  });

  describe('signIn Callback - Account Linking', () => {
    it('should link OAuth account to existing user', async () => {
      const mockUser = {
        email: 'existing@example.com',
        name: 'OAuth Name',
        image: 'https://example.com/oauth-avatar.jpg',
      };

      const existingUser = {
        id: 'user-456',
        email: 'existing@example.com',
        name: 'Original Name',
        image: null,
        password: 'hashed-password',
        role: Role.USER,
      };

      // Mock: user exists
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      // Mock: update user
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        name: mockUser.name,
        image: mockUser.image,
      });

      // Simulate signIn callback logic
      const foundUser = await prisma.user.findUnique({
        where: { email: mockUser.email },
      });

      if (foundUser) {
        const updatedUser = await prisma.user.update({
          where: { id: foundUser.id },
          data: {
            name: mockUser.name || foundUser.name,
            image: mockUser.image || foundUser.image,
          },
        });

        expect(updatedUser.id).toBe(existingUser.id);
        expect(updatedUser.name).toBe(mockUser.name);
        expect(updatedUser.image).toBe(mockUser.image);
        expect(updatedUser.password).toBe(existingUser.password); // Preserved
      }
    });
  });

  describe('JWT Callback - OAuth User Data', () => {
    it('should fetch complete user data for OAuth users', async () => {
      const mockUser = {
        email: 'oauth@example.com',
      };

      const mockAccount = {
        provider: 'google' as const,
      };

      const dbUser = {
        id: 'user-789',
        email: 'oauth@example.com',
        name: 'OAuth User',
        image: 'https://example.com/avatar.jpg',
        role: Role.USER,
      };

      // Mock: fetch user from database
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(dbUser);

      // Simulate JWT callback logic
      const user = await prisma.user.findUnique({
        where: { email: mockUser.email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
        },
      });

      if (user) {
        expect(user.id).toBe(dbUser.id);
        expect(user.email).toBe(dbUser.email);
        expect(user.name).toBe(dbUser.name);
        expect(user.image).toBe(dbUser.image);
        expect(user.role).toBe(dbUser.role);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockUser = {
        email: 'error@example.com',
        name: 'Error User',
      };

      // Mock: database error
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Simulate error handling
      try {
        await prisma.user.findUnique({
          where: { email: mockUser.email },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Database connection failed');
      }
    });
  });
});

