import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      // Arrange & Act
      const state = useAuthStore.getState();

      // Assert
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.roles).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should set user, token, roles, and authentication status', () => {
      // Arrange
      const user = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      const token = 'mock-jwt-token';
      const roles = ['Admin', 'Leadership'];

      // Act
      useAuthStore.getState().login(user, token, roles);

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.token).toBe(token);
      expect(state.roles).toEqual(roles);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle login with minimal user data', () => {
      // Arrange
      const user = {
        uid: 'user-456',
        email: 'minimal@example.com',
      };
      const token = 'token-456';
      const roles = ['Contributor'];

      // Act
      useAuthStore.getState().login(user, token, roles);

      // Assert
      const state = useAuthStore.getState();
      expect(state.user?.uid).toBe('user-456');
      expect(state.user?.email).toBe('minimal@example.com');
      expect(state.user?.displayName).toBeUndefined();
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle empty roles array', () => {
      // Arrange
      const user = {
        uid: 'user-789',
        email: 'noroles@example.com',
      };
      const token = 'token-789';
      const roles: string[] = [];

      // Act
      useAuthStore.getState().login(user, token, roles);

      // Assert
      const state = useAuthStore.getState();
      expect(state.roles).toEqual([]);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should overwrite previous login data', () => {
      // Arrange - First login
      useAuthStore.getState().login(
        { uid: 'user-1', email: 'first@example.com' },
        'token-1',
        ['Admin']
      );

      // Act - Second login
      useAuthStore.getState().login(
        { uid: 'user-2', email: 'second@example.com' },
        'token-2',
        ['Contributor']
      );

      // Assert
      const state = useAuthStore.getState();
      expect(state.user?.uid).toBe('user-2');
      expect(state.user?.email).toBe('second@example.com');
      expect(state.token).toBe('token-2');
      expect(state.roles).toEqual(['Contributor']);
    });
  });

  describe('logout', () => {
    it('should clear all authentication data', () => {
      // Arrange - Login first
      useAuthStore.getState().login(
        { uid: 'user-123', email: 'test@example.com' },
        'token-123',
        ['Admin']
      );

      // Act
      useAuthStore.getState().logout();

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.roles).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should be idempotent (calling multiple times is safe)', () => {
      // Arrange
      useAuthStore.getState().login(
        { uid: 'user-123', email: 'test@example.com' },
        'token-123',
        ['Admin']
      );

      // Act
      useAuthStore.getState().logout();
      useAuthStore.getState().logout();
      useAuthStore.getState().logout();

      // Assert
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should persist authentication state', () => {
      // Arrange
      const user = {
        uid: 'persist-user',
        email: 'persist@example.com',
        displayName: 'Persist User',
      };
      const token = 'persist-token';
      const roles = ['Leadership'];

      // Act
      useAuthStore.getState().login(user, token, roles);

      // Assert - Get fresh state
      const persistedState = useAuthStore.getState();
      expect(persistedState.user).toEqual(user);
      expect(persistedState.token).toBe(token);
      expect(persistedState.roles).toEqual(roles);
      expect(persistedState.isAuthenticated).toBe(true);
    });
  });

  describe('state subscriptions', () => {
    it('should notify subscribers on login', () => {
      // Arrange
      let notificationCount = 0;
      const unsubscribe = useAuthStore.subscribe(() => {
        notificationCount++;
      });

      // Act
      useAuthStore.getState().login(
        { uid: 'user-1', email: 'test@example.com' },
        'token',
        ['Admin']
      );

      // Assert
      expect(notificationCount).toBeGreaterThan(0);

      // Cleanup
      unsubscribe();
    });

    it('should notify subscribers on logout', () => {
      // Arrange
      useAuthStore.getState().login(
        { uid: 'user-1', email: 'test@example.com' },
        'token',
        ['Admin']
      );

      let notificationCount = 0;
      const unsubscribe = useAuthStore.subscribe(() => {
        notificationCount++;
      });

      // Act
      useAuthStore.getState().logout();

      // Assert
      expect(notificationCount).toBeGreaterThan(0);

      // Cleanup
      unsubscribe();
    });
  });
});
