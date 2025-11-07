import type { KPIMetricType } from '@/hooks/useKPIMetrics';
import { KPI_METRICS } from '@/hooks/useKPIMetrics';

interface MetricSelectorProps {
  value: KPIMetricType;
  onChange: (metric: KPIMetricType) => void;
}

export function MetricSelector({ value, onChange }: MetricSelectorProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="metric-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Select Metric
      </label>
      <select
        id="metric-select"
        value={value}
        onChange={(e) => onChange(e.target.value as KPIMetricType)}
        className="
          w-full
          px-3 py-2
          text-sm
          bg-white dark:bg-slate-900
          border border-slate-300 dark:border-slate-700
          rounded-lg
          focus:ring-2 focus:ring-brand-500 focus:border-transparent
          transition-colors
        "
      >
        {KPI_METRICS.map((metric) => (
          <option key={metric.value} value={metric.value}>
            {metric.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {KPI_METRICS.find((m) => m.value === value)?.description}
      </p>
    </div>
  );
}
