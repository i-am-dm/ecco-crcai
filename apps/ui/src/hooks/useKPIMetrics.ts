import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { KPISeriesResponse } from '@/types/api';

export type KPIMetricType = 'MRR' | 'Users' | 'Churn' | 'CAC' | 'LTV' | 'Burn' | 'Runway';

export interface UseKPIMetricsOptions {
  metric: KPIMetricType;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

/**
 * Fetch KPI time series data (FR-20: Venture KPIs)
 * Returns time series and per-venture summaries for a given metric
 */
export function useKPIMetrics({ metric, startDate, endDate, enabled = true }: UseKPIMetricsOptions) {
  return useQuery({
    queryKey: ['kpis', metric, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/kpis/{metric}/series', {
        params: {
          path: { metric },
          query: {
            start: startDate,
            end: endDate,
          },
        },
      });

      if (error) {
        throw new Error(`Failed to fetch KPI data for ${metric}`);
      }

      return data as KPISeriesResponse;
    },
    enabled,
    // Cache for 1 minute
    staleTime: 60000,
  });
}

/**
 * List of available KPI metrics with metadata
 */
export const KPI_METRICS: Array<{
  value: KPIMetricType;
  label: string;
  description: string;
  format: 'currency' | 'number' | 'percent' | 'days';
  color: string;
}> = [
  {
    value: 'MRR',
    label: 'Monthly Recurring Revenue',
    description: 'Total monthly recurring revenue across all ventures',
    format: 'currency',
    color: 'accent',
  },
  {
    value: 'Users',
    label: 'Active Users',
    description: 'Total active users across all ventures',
    format: 'number',
    color: 'brand',
  },
  {
    value: 'Churn',
    label: 'Churn Rate',
    description: 'Customer churn rate percentage',
    format: 'percent',
    color: 'amber',
  },
  {
    value: 'CAC',
    label: 'Customer Acquisition Cost',
    description: 'Average cost to acquire a customer',
    format: 'currency',
    color: 'purple',
  },
  {
    value: 'LTV',
    label: 'Lifetime Value',
    description: 'Customer lifetime value',
    format: 'currency',
    color: 'emerald',
  },
  {
    value: 'Burn',
    label: 'Burn Rate',
    description: 'Monthly cash burn rate',
    format: 'currency',
    color: 'red',
  },
  {
    value: 'Runway',
    label: 'Runway',
    description: 'Average runway in days',
    format: 'days',
    color: 'blue',
  },
];
