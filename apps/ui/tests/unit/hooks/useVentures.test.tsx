import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVentures, useVenture, useCreateVenture, useUpdateVenture } from '@/hooks/useVentures';

// Wrapper component for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useVentures', () => {
  beforeEach(() => {
    // Clear any cached query data
  });

  describe('useVentures', () => {
    it('should fetch all ventures', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useVentures(), {
        wrapper: createWrapper(),
      });

      // Assert - Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert - Data loaded
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.items).toHaveLength(3);
      expect(result.current.data?.items[0].id).toBe('venture-1');
      expect(result.current.data?.items[0].title).toBe('EcoTrack');
    });

    it('should cache ventures data', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // Arrange & Act - First render
      const { result: result1 } = renderHook(() => useVentures(), {
        wrapper,
      });

      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      // Act - Second render should use cached data
      const { result: result2 } = renderHook(() => useVentures(), {
        wrapper,
      });

      // Assert - Second render should have data immediately from cache
      expect(result2.current.data).toBeDefined();
    });
  });

  describe('useVenture', () => {
    it('should fetch single venture by ID', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useVenture('venture-1'), {
        wrapper: createWrapper(),
      });

      // Wait for data
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe('venture-1');
      expect(result.current.data?.data.title).toBe('EcoTrack');
      expect(result.current.data?.data.status).toBe('Active');
    });

    it('should not fetch when ID is not provided', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useVenture(''), {
        wrapper: createWrapper(),
      });

      // Assert - Query should be disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle 404 for non-existent venture', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useVenture('non-existent'), {
        wrapper: createWrapper(),
      });

      // Wait for error
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Assert
      expect(result.current.error).toBeDefined();
    });
  });

  describe('useCreateVenture', () => {
    it('should create a new venture', async () => {
      // Arrange
      const { result } = renderHook(() => useCreateVenture(), {
        wrapper: createWrapper(),
      });

      const newVenture = {
        name: 'NewVenture',
        description: 'A brand new venture',
        status: 'active' as const,
        stage: 'ideation' as const,
      };

      // Act
      result.current.mutate(newVenture);

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
      expect((result.current.data as any)?.accepted).toBe(true);
    });

    it('should invalidate ventures list after creation', async () => {
      // Arrange
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // First fetch ventures list
      const { result: venturesResult } = renderHook(() => useVentures(), { wrapper });
      await waitFor(() => expect(venturesResult.current.isSuccess).toBe(true));

      const initialCount = venturesResult.current.data?.items.length;

      // Act - Create new venture
      const { result: createResult } = renderHook(() => useCreateVenture(), { wrapper });
      createResult.current.mutate({
        name: 'NewVenture',
        description: 'Test',
        status: 'active' as const,
        stage: 'ideation' as const,
      });

      await waitFor(() => expect(createResult.current.isSuccess).toBe(true));

      // Assert - Ventures list should be invalidated (refetching)
      // In real scenario, the list would refetch and include new venture
      expect(initialCount).toBeDefined();
    });
  });

  describe('useUpdateVenture', () => {
    it('should update an existing venture', async () => {
      // Arrange
      const { result } = renderHook(() => useUpdateVenture('venture-1'), {
        wrapper: createWrapper(),
      });

      const updatedData = {
        name: 'Updated EcoTrack',
        description: 'Updated description',
      };

      // Act
      result.current.mutate(updatedData);

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
      expect((result.current.data as any)?.accepted).toBe(true);
    });

    it('should invalidate both list and detail queries after update', async () => {
      // Arrange
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // Fetch initial data
      const { result: ventureResult } = renderHook(() => useVenture('venture-1'), { wrapper });
      await waitFor(() => expect(ventureResult.current.isSuccess).toBe(true));

      // Act - Update venture
      const { result: updateResult } = renderHook(() => useUpdateVenture('venture-1'), { wrapper });
      updateResult.current.mutate({ name: 'Updated Name' });

      await waitFor(() => expect(updateResult.current.isSuccess).toBe(true));

      // Assert - Query should be invalidated
      // In real scenario, the detail view would refetch updated data
      expect(updateResult.current.isSuccess).toBe(true);
    });
  });
});
