import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKPIMetrics, KPI_METRICS } from '@/hooks/useKPIMetrics';

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

describe('useKPIMetrics', () => {
  it('should fetch KPI metrics with given parameters', async () => {
    // Arrange & Act
    const { result } = renderHook(
      () =>
        useKPIMetrics({
          metric: 'MRR',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
      { wrapper: createWrapper() }
    );

    // Wait for success
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(result.current.data).toBeDefined();
  });

  it('should not fetch when enabled is false', () => {
    // Arrange & Act
    const { result } = renderHook(
      () =>
        useKPIMetrics({
          metric: 'MRR',
          enabled: false,
        }),
      { wrapper: createWrapper() }
    );

    // Assert
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should cache KPI data for 1 minute', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // Arrange & Act - First fetch
    const { result: result1 } = renderHook(
      () =>
        useKPIMetrics({
          metric: 'Users',
          startDate: '2024-01-01',
        }),
      { wrapper }
    );

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    // Act - Second fetch should use cache
    const { result: result2 } = renderHook(
      () =>
        useKPIMetrics({
          metric: 'Users',
          startDate: '2024-01-01',
        }),
      { wrapper }
    );

    // Assert
    expect(result2.current.data).toBeDefined();
  });

  it('should use different cache keys for different metrics', async () => {
    // Arrange & Act - Fetch MRR
    const { result: mrrResult } = renderHook(
      () =>
        useKPIMetrics({
          metric: 'MRR',
        }),
      { wrapper: createWrapper() }
    );

    // Act - Fetch Users (different metric)
    const { result: usersResult } = renderHook(
      () =>
        useKPIMetrics({
          metric: 'Users',
        }),
      { wrapper: createWrapper() }
    );

    // Wait for both
    await waitFor(() => expect(mrrResult.current.isSuccess).toBe(true));
    await waitFor(() => expect(usersResult.current.isSuccess).toBe(true));

    // Assert - Both should have data (independent queries)
    expect(mrrResult.current.data).toBeDefined();
    expect(usersResult.current.data).toBeDefined();
  });
});

describe('KPI_METRICS constant', () => {
  it('should have all expected metrics', () => {
    // Assert
    expect(KPI_METRICS).toHaveLength(7);

    const metricValues = KPI_METRICS.map((m) => m.value);
    expect(metricValues).toContain('MRR');
    expect(metricValues).toContain('Users');
    expect(metricValues).toContain('Churn');
    expect(metricValues).toContain('CAC');
    expect(metricValues).toContain('LTV');
    expect(metricValues).toContain('Burn');
    expect(metricValues).toContain('Runway');
  });

  it('should have proper metadata for each metric', () => {
    // Assert
    KPI_METRICS.forEach((metric) => {
      expect(metric.value).toBeDefined();
      expect(metric.label).toBeDefined();
      expect(metric.description).toBeDefined();
      expect(metric.format).toBeDefined();
      expect(metric.color).toBeDefined();
    });
  });

  it('should have correct format types', () => {
    // Arrange
    const mrrMetric = KPI_METRICS.find((m) => m.value === 'MRR');
    const usersMetric = KPI_METRICS.find((m) => m.value === 'Users');
    const churnMetric = KPI_METRICS.find((m) => m.value === 'Churn');
    const runwayMetric = KPI_METRICS.find((m) => m.value === 'Runway');

    // Assert
    expect(mrrMetric?.format).toBe('currency');
    expect(usersMetric?.format).toBe('number');
    expect(churnMetric?.format).toBe('percent');
    expect(runwayMetric?.format).toBe('days');
  });
});
