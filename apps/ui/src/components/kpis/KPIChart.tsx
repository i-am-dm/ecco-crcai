import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { KPIDataPoint } from '@/types/api';
import { getFormatter } from '@/lib/export';

interface KPIChartProps {
  data: KPIDataPoint[];
  metric: string;
  format: 'currency' | 'number' | 'percent' | 'days';
  color?: string;
  height?: number;
}

export function KPIChart({ data, metric, format, color = '#0ea5e9', height = 300 }: KPIChartProps) {
  const formatter = getFormatter(format);

  // Transform data for Recharts
  const chartData = data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: point.value,
    fullDate: point.date,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            {new Date(data.fullDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatter(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 dark:text-slate-400"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis
          dataKey="date"
          className="text-xs text-slate-600 dark:text-slate-400"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis
          tickFormatter={(value) => {
            // Compact formatting for Y-axis
            if (format === 'currency') {
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
              return `$${value}`;
            }
            if (format === 'number') {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value;
            }
            if (format === 'percent') return `${value}%`;
            return value;
          }}
          className="text-xs text-slate-600 dark:text-slate-400"
          tick={{ fill: 'currentColor' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Line
          type="monotone"
          dataKey="value"
          name={metric}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
