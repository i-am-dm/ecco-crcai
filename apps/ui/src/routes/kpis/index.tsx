import { useState, useMemo } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useKPIMetrics, KPI_METRICS, type KPIMetricType } from '@/hooks/useKPIMetrics';
import { KPIChart } from '@/components/kpis/KPIChart';
import { KPITable } from '@/components/kpis/KPITable';
import { MetricSelector } from '@/components/kpis/MetricSelector';
import { exportToCSV } from '@/lib/export';
import type { ExportData } from '@/lib/export';

export function KPIsPage() {
  const [selectedMetric, setSelectedMetric] = useState<KPIMetricType>('MRR');
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y' | 'all'>('90d');

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start = new Date();

    switch (dateRange) {
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'all':
        start = new Date('2020-01-01'); // Far back date
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [dateRange]);

  // Fetch KPI data
  const { data, isLoading, error } = useKPIMetrics({
    metric: selectedMetric,
    startDate,
    endDate,
  });

  // Get metric metadata
  const metricInfo = KPI_METRICS.find((m) => m.value === selectedMetric);

  // Handle CSV export
  const handleExport = () => {
    if (!data) return;

    const exportData: ExportData = {
      headers: ['Date', selectedMetric, 'Venture'],
      rows: data.series.map((point) => [
        point.date,
        point.value,
        point.ventureName || 'All Ventures',
      ]),
    };

    exportToCSV(`kpi-${selectedMetric.toLowerCase()}-${new Date().toISOString().split('T')[0]}`, exportData);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">KPI Metrics</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track key performance indicators across your portfolio
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric Selector */}
        <div className="md:col-span-2">
          <MetricSelector value={selectedMetric} onChange={setSelectedMetric} />
        </div>

        {/* Date Range Selector */}
        <div className="space-y-1">
          <label htmlFor="date-range" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Time Period
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              id="date-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="
                flex-1
                px-3 py-2
                text-sm
                bg-white dark:bg-slate-900
                border border-slate-300 dark:border-slate-700
                rounded-lg
                focus:ring-2 focus:ring-brand-500 focus:border-transparent
                transition-colors
              "
            >
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900 dark:text-red-100">Error Loading Data</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error instanceof Error ? error.message : 'Failed to load KPI data'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
              <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      {!isLoading && data && (
        <>
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {metricInfo?.label} Trend
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {data.series.length} data points
                </p>
              </div>
              <button
                onClick={handleExport}
                className="
                  inline-flex items-center gap-2
                  px-4 py-2
                  text-sm font-medium
                  text-slate-700 dark:text-slate-300
                  bg-white dark:bg-slate-900
                  border border-slate-200 dark:border-slate-700
                  hover:bg-slate-50 dark:hover:bg-slate-800/50
                  hover:border-slate-300 dark:hover:border-slate-600
                  rounded-lg
                  transition-all duration-200
                "
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="p-6">
              <KPIChart
                data={data.series}
                metric={metricInfo?.label || selectedMetric}
                format={metricInfo?.format || 'number'}
                color={
                  metricInfo?.color === 'accent'
                    ? '#b91c1c'
                    : metricInfo?.color === 'brand'
                    ? '#433f3a'
                    : metricInfo?.color === 'amber'
                    ? '#f97316'
                    : metricInfo?.color === 'purple'
                    ? '#7c3aed'
                    : metricInfo?.color === 'emerald'
                    ? '#16a34a'
                    : metricInfo?.color === 'red'
                    ? '#dc2626'
                    : '#433f3a'
                }
                height={400}
              />
            </div>
          </div>

          {/* Venture Breakdown Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                By Venture
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Latest values for each venture
              </p>
            </div>
            <KPITable data={data.byVenture} format={metricInfo?.format || 'number'} />
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && data && data.series.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            No data available for this metric in the selected time period.
          </p>
        </div>
      )}
    </div>
  );
}
