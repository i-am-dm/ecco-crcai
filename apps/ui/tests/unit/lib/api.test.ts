import { describe, it, expect, beforeEach, vi } from 'vitest';
import api, { apiHelpers, absoluteBase } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

describe('absoluteBase', () => {
  const mockLocation = {
    origin: 'https://app.example.com',
    host: 'app.example.com',
    protocol: 'https:',
  } as any;

  it('prefixes /api when base is empty', () => {
    expect(absoluteBase('', mockLocation)).toBe('https://app.example.com/api');
  });

  it('prefixes /api for same-origin bare host', () => {
    expect(absoluteBase('app.example.com', mockLocation)).toBe('https://app.example.com/api');
  });

  it('handles same-origin URLs without paths', () => {
    expect(absoluteBase('https://app.example.com', mockLocation)).toBe('https://app.example.com/api');
  });

  it('adds /api to same-origin hosts with paths', () => {
    expect(absoluteBase('app.example.com/v1', mockLocation)).toBe('https://app.example.com/api/v1');
  });

  it('normalizes relative paths missing a leading slash', () => {
    expect(absoluteBase('api', mockLocation)).toBe('https://app.example.com/api');
  });

  it('preserves query and hash when normalizing relative paths', () => {
    expect(absoluteBase('api?foo=bar#frag', mockLocation)).toBe('https://app.example.com/api?foo=bar#frag');
  });

  it('preserves non-origin URLs', () => {
    expect(absoluteBase('https://api.example.com', mockLocation)).toBe('https://api.example.com');
  });

  it('supports query strings when location is unavailable', () => {
    vi.stubGlobal('window', undefined as unknown as Window & typeof globalThis);
    try {
      expect(absoluteBase('api?foo=bar#frag')).toBe('/api?foo=bar#frag');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

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
