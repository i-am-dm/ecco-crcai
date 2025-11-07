import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

describe('useAuth', () => {
  beforeEach(() => {
    // Reset auth store before each test
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  describe('Authentication State', () => {
    it('should return unauthenticated state by default', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.roles).toEqual([]);
    });

    it('should return authenticated state when user is logged in', () => {
      // Arrange - Login a user
      act(() => {
        useAuthStore.getState().login(
          { uid: 'user-1', email: 'test@example.com', displayName: 'Test User' },
          'mock-token',
          ['Admin']
        );
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        uid: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
      });
      expect(result.current.roles).toEqual(['Admin']);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      // Arrange
      act(() => {
        useAuthStore.getState().login(
          { uid: 'user-1', email: 'admin@example.com' },
          'token',
          ['Admin', 'Leadership']
        );
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.hasRole('Admin')).toBe(true);
      expect(result.current.hasRole('Leadership')).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      // Arrange
      act(() => {
        useAuthStore.getState().login(
          { uid: 'user-1', email: 'contributor@example.com' },
          'token',
          ['Contributor']
        );
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.hasRole('Admin')).toBe(false);
      expect(result.current.hasRole('Leadership')).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('should allow Admin to edit everything', () => {
      // Arrange
      act(() => {
        useAuthStore.getState().login(
          { uid: 'admin-user', email: 'admin@example.com' },
          'token',
          ['Admin']
        );
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.canEdit('venture', 'other-user')).toBe(true);
      expect(result.current.canEdit('venture', 'admin-user')).toBe(true);
    });

    it('should allow Leadership to edit everything', () => {
      // Arrange
      act(() => {
        useAuthStore.getState().login(
          { uid: 'leader-user', email: 'leader@example.com' },
          'token',
          ['Leadership']
        );
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.canEdit('venture', 'other-user')).toBe(true);
      expect(result.current.canEdit('venture', 'leader-user')).toBe(true);
    });

    it('should allow Lead to edit their own ventures', () => {
      // Arrange
      act(() => {
        useAuthStore.getState().login(
          { uid: 'lead-user', email: 'lead@example.com' },
          'token',
          ['Lead']
        );
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.canEdit('venture', 'lead-user')).toBe(true);
      expect(result.current.canEdit('venture', 'other-user')).toBe(false);
    });

    it('should allow Contributor to edit their own items', () => {
      // Arrange
      act(() => {
        useAuthStore.getState().login(
          { uid: 'contributor-user', email: 'contributor@example.com' },
          'token',
          ['Contributor']
        );
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.canEdit('idea', 'contributor-user')).toBe(true);
      expect(result.current.canEdit('idea', 'other-user')).toBe(false);
    });
  });

  describe('canView', () => {
    it('should allow everyone to view public entities', () => {
      // Arrange
      act(() => {
        useAuthStore.getState().login(
          { uid: 'user-1', email: 'user@example.com' },
          'token',
          ['Contributor']
        );
      });

      // Act
      const { result } = renderHook(() => useAuth());

      // Assert
      expect(result.current.canView('venture')).toBe(true);
      expect(result.current.canView('idea')).toBe(true);
      expect(result.current.canView('kpi')).toBe(true);
      expect(result.current.canView('resource')).toBe(true);
    });

    it('should restrict budget and cap_table to Admin, Leadership, Lead', () => {
      // Arrange - Contributor cannot view
      act(() => {
        useAuthStore.getState().login(
          { uid: 'user-1', email: 'user@example.com' },
          'token',
          ['Contributor']
        );
      });

      const { result: contributorResult } = renderHook(() => useAuth());
      expect(contributorResult.current.canView('budget')).toBe(false);
      expect(contributorResult.current.canView('cap_table')).toBe(false);

      // Arrange - Lead can view
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.getState().login(
          { uid: 'user-2', email: 'lead@example.com' },
          'token',
          ['Lead']
        );
      });

      const { result: leadResult } = renderHook(() => useAuth());
      expect(leadResult.current.canView('budget')).toBe(true);
      expect(leadResult.current.canView('cap_table')).toBe(true);
    });

    it('should restrict investor entity to Admin, Leadership, Investor', () => {
      // Arrange - Contributor cannot view
      act(() => {
        useAuthStore.getState().login(
          { uid: 'user-1', email: 'user@example.com' },
          'token',
          ['Contributor']
        );
      });

      const { result: contributorResult } = renderHook(() => useAuth());
      expect(contributorResult.current.canView('investor')).toBe(false);

      // Arrange - Investor can view
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.getState().login(
          { uid: 'user-2', email: 'investor@example.com' },
          'token',
          ['Investor']
        );
      });

      const { result: investorResult } = renderHook(() => useAuth());
      expect(investorResult.current.canView('investor')).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear user state on logout', () => {
      // Arrange - Login first
      act(() => {
        useAuthStore.getState().login(
          { uid: 'user-1', email: 'test@example.com' },
          'token',
          ['Admin']
        );
      });

      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(true);

      // Act - Logout
      act(() => {
        result.current.logout();
      });

      // Assert
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.roles).toEqual([]);
    });
  });
});
