import { StatCard } from '@/components/StatCard';

interface PlaybookStatsProps {
  total: number;
  usedLast30d?: number;
  avgEffectiveness?: number;
  timeToImpactDays?: number;
}

export function PlaybookStats({ total, usedLast30d, avgEffectiveness, timeToImpactDays }: PlaybookStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total playbooks" value={String(total)} />
      <StatCard label="Used last 30d" value={String(usedLast30d ?? 0)} />
      <StatCard label="Avg effectiveness" value={typeof avgEffectiveness === 'number' ? `${avgEffectiveness}%` : '—'} />
      <StatCard label="Time-to-impact" value={timeToImpactDays ? `${timeToImpactDays}d` : '—'} />
    </div>
  );
}
