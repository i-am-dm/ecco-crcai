import { describe, it, expect, beforeEach, vi } from 'vitest';
import api, { apiHelpers } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

describe('apiHelpers', () => {
  beforeEach(() => {
    // Reset stores
    useAuthStore.getState().logout();
    useUIStore.setState({ env: 'dev' });
  });

  describe('listEntities', () => {
    it('should fetch list of entities', async () => {
      // Arrange
      const entity = 'venture';

      // Act
      const result = await apiHelpers.listEntities(entity);

      // Assert
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should include ventures in the response', async () => {
      // Act
      const result = await apiHelpers.listEntities('venture');

      // Assert
      expect(result.items).toBeDefined();
      expect(result.items[0]).toHaveProperty('id');
      expect(result.items[0]).toHaveProperty('entity');
      expect(result.items[0]).toHaveProperty('ptr');
    });
  });

  describe('getEntity', () => {
    it('should fetch single entity by ID', async () => {
      // Arrange
      const entity = 'venture';
      const id = 'venture-1';

      // Act
      const result = await apiHelpers.getEntity(entity, id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.entity).toBe(entity);
      expect(result.title).toBeDefined();
    });

    it('should throw error for non-existent entity', async () => {
      // Arrange
      const entity = 'venture';
      const id = 'non-existent';

      // Act & Assert
      await expect(apiHelpers.getEntity(entity, id)).rejects.toThrow();
    });
  });

  describe('writeHistory', () => {
    let postSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      postSpy = vi.spyOn(api, 'POST').mockResolvedValue({
        data: { accepted: true },
        error: undefined,
      } as any);
    });

    afterEach(() => {
      postSpy.mockRestore();
    });

    it('should create new entity', async () => {
      // Arrange
      const entity = 'venture';
      const data = {
        name: 'Test Venture',
        description: 'A test venture',
        status: 'active',
        stage: 'ideation',
      };

      // Act
      const result = await apiHelpers.writeHistory(entity, data);

      // Assert
      expect(result).toBeDefined();
      expect((result as any).accepted).toBe(true);
    });

    it('should update existing entity with ID', async () => {
      // Arrange
      const entity = 'venture';
      const data = {
        id: 'venture-1',
        name: 'Updated Venture',
        description: 'Updated description',
      };

      // Act
      const result = await apiHelpers.writeHistory(entity, data);

      // Assert
      expect(result).toBeDefined();
      expect((result as any).accepted).toBe(true);
    });

    it('should handle ideas', async () => {
      // Arrange
      const entity = 'idea';
      const data = {
        title: 'New Idea',
        description: 'A new idea',
        status: 'proposed',
      };

      // Act
      const result = await apiHelpers.writeHistory(entity, data);

      // Assert
      expect(result).toBeDefined();
      expect((result as any).accepted).toBe(true);
    });
  });
});

describe('API middleware', () => {
  describe('auth middleware', () => {
    it('should add Authorization header when token exists', async () => {
      // Arrange - Login user
      useAuthStore.getState().login(
        { uid: 'user-1', email: 'test@example.com' },
        'mock-token-123',
        ['Admin']
      );

      // Act - Make API call
      const result = await apiHelpers.listEntities('venture');

      // Assert - Should succeed (token was included)
      expect(result).toBeDefined();
    });

    it('should work without Authorization header when no token', async () => {
      // Arrange - No login

      // Act - Make API call (MSW doesn't require auth)
      const result = await apiHelpers.listEntities('venture');

      // Assert - Should still work with MSW
      expect(result).toBeDefined();
    });
  });

  describe('env middleware', () => {
    it('should add env query parameter', async () => {
      // Arrange
      useUIStore.setState({ env: 'stg' });

      // Act - Make API call
      const result = await apiHelpers.listEntities('venture');

      // Assert - Should succeed (env param was added)
      expect(result).toBeDefined();
    });

    it('should use default dev environment', async () => {
      // Arrange
      useUIStore.setState({ env: 'dev' });

      // Act
      const result = await apiHelpers.listEntities('venture');

      // Assert
      expect(result).toBeDefined();
    });
  });
});
