import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useUIStore.setState({
      theme: 'light',
      env: 'dev',
      sidebarCollapsed: false,
    });

    // Clear document classes
    document.documentElement.classList.remove('dark');
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      // Arrange & Act
      const state = useUIStore.getState();

      // Assert
      expect(state.theme).toBe('light');
      expect(state.env).toBe('dev');
      expect(state.sidebarCollapsed).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('should update theme to dark', () => {
      // Act
      useUIStore.getState().setTheme('dark');

      // Assert
      const state = useUIStore.getState();
      expect(state.theme).toBe('dark');
    });

    it('should update theme to light', () => {
      // Arrange - Set to dark first
      useUIStore.getState().setTheme('dark');

      // Act - Switch to light
      useUIStore.getState().setTheme('light');

      // Assert
      const state = useUIStore.getState();
      expect(state.theme).toBe('light');
    });

    it('should add dark class to document when theme is dark', () => {
      // Act
      useUIStore.getState().setTheme('dark');

      // Assert
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from document when theme is light', () => {
      // Arrange - Set dark first
      useUIStore.getState().setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Act - Switch to light
      useUIStore.getState().setTheme('light');

      // Assert
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('setEnv', () => {
    it('should update environment to dev', () => {
      // Act
      useUIStore.getState().setEnv('dev');

      // Assert
      expect(useUIStore.getState().env).toBe('dev');
    });

    it('should update environment to stg', () => {
      // Act
      useUIStore.getState().setEnv('stg');

      // Assert
      expect(useUIStore.getState().env).toBe('stg');
    });

    it('should update environment to prod', () => {
      // Act
      useUIStore.getState().setEnv('prod');

      // Assert
      expect(useUIStore.getState().env).toBe('prod');
    });

    it('should switch between environments', () => {
      // Act & Assert - dev -> stg
      useUIStore.getState().setEnv('stg');
      expect(useUIStore.getState().env).toBe('stg');

      // Act & Assert - stg -> prod
      useUIStore.getState().setEnv('prod');
      expect(useUIStore.getState().env).toBe('prod');

      // Act & Assert - prod -> dev
      useUIStore.getState().setEnv('dev');
      expect(useUIStore.getState().env).toBe('dev');
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar from expanded to collapsed', () => {
      // Arrange
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      // Act
      useUIStore.getState().toggleSidebar();

      // Assert
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });

    it('should toggle sidebar from collapsed to expanded', () => {
      // Arrange - Collapse first
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      // Act - Toggle back
      useUIStore.getState().toggleSidebar();

      // Assert
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should toggle sidebar multiple times', () => {
      // Act & Assert
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist UI state', () => {
      // Arrange & Act
      useUIStore.getState().setTheme('dark');
      useUIStore.getState().setEnv('prod');
      useUIStore.getState().toggleSidebar();

      // Assert - Get fresh state
      const persistedState = useUIStore.getState();
      expect(persistedState.theme).toBe('dark');
      expect(persistedState.env).toBe('prod');
      expect(persistedState.sidebarCollapsed).toBe(true);
    });
  });

  describe('state subscriptions', () => {
    it('should notify subscribers on theme change', () => {
      // Arrange
      let notificationCount = 0;
      const unsubscribe = useUIStore.subscribe(() => {
        notificationCount++;
      });

      // Act
      useUIStore.getState().setTheme('dark');

      // Assert
      expect(notificationCount).toBeGreaterThan(0);

      // Cleanup
      unsubscribe();
    });

    it('should notify subscribers on env change', () => {
      // Arrange
      let notificationCount = 0;
      const unsubscribe = useUIStore.subscribe(() => {
        notificationCount++;
      });

      // Act
      useUIStore.getState().setEnv('stg');

      // Assert
      expect(notificationCount).toBeGreaterThan(0);

      // Cleanup
      unsubscribe();
    });

    it('should notify subscribers on sidebar toggle', () => {
      // Arrange
      let notificationCount = 0;
      const unsubscribe = useUIStore.subscribe(() => {
        notificationCount++;
      });

      // Act
      useUIStore.getState().toggleSidebar();

      // Assert
      expect(notificationCount).toBeGreaterThan(0);

      // Cleanup
      unsubscribe();
    });
  });
});
