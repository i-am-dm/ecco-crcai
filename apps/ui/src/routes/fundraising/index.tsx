import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Coins, Target, Calendar, BarChart3, AlertCircle } from 'lucide-react';
import { useFundraisingRounds, useFundraisingRound } from '@/hooks/useFundraisingRounds';
import type { FundraisingRound } from '@/types/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const PIPELINE_COLUMNS = [
  { id: 'sourcing', title: 'Sourcing' },
  { id: 'diligence', title: 'Diligence' },
  { id: 'term-sheet', title: 'Term Sheet' },
  { id: 'closing', title: 'Closing' },
  { id: 'closed', title: 'Closed / Won' },
];

export function FundraisingPipelinePage() {
  const { data: rounds = [], isLoading, error } = useFundraisingRounds();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const { data: selectedRound, isFetching: detailLoading } = useFundraisingRound(selectedRoundId ?? undefined);

  const summary = useMemo(() => {
    if (!rounds.length) {
      return { totalTarget: 0, totalCommitted: 0, closingSoon: 0, averageProbability: 0 };
    }
    const totalTarget = rounds.reduce((sum, round) => sum + (round.targetAmount || 0), 0);
    const totalCommitted = rounds.reduce((sum, round) => sum + (round.committedAmount || 0), 0);
    const closingSoon = rounds.filter((round) => {
      if (!round.closeDate) return false;
      const diff = Date.parse(round.closeDate) - Date.now();
      return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 45;
    }).length;
    const averageProbability =
      rounds.reduce((sum, round) => sum + (round.probability ?? 0), 0) / (rounds.length || 1);
    return { totalTarget, totalCommitted, closingSoon, averageProbability };
  }, [rounds]);

  const buckets = useMemo(() => groupRoundsIntoBuckets(rounds), [rounds]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Coins className="w-10 h-10 text-brand-600 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Loading fundraising pipeline…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-1" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">Unable to load fundraising data</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-brand-600 uppercase tracking-widest">FR-33 Fundraising Pipeline</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Rounds & Investor Flow</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Monitor every open round, coverage ratios, and diligence progress across the studio portfolio.
        </p>
      </div>

      <PipelineSummary summary={summary} />

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <PipelineBoard buckets={buckets} onSelect={setSelectedRoundId} selectedId={selectedRoundId} />
        <RoundDetailPanel round={selectedRound} isLoading={detailLoading} />
      </div>
    </div>
  );
}

function PipelineSummary({
  summary,
}: {
  summary: { totalTarget: number; totalCommitted: number; closingSoon: number; averageProbability: number };
}) {
  const cards = [
    {
      label: 'Total Target',
      value: formatCurrency(summary.totalTarget),
      icon: Target,
      caption: 'Across open rounds',
    },
    {
      label: 'Committed',
      value: formatCurrency(summary.totalCommitted),
      icon: Coins,
      caption: `${Math.round((summary.totalCommitted / Math.max(summary.totalTarget, 1)) * 100)}% coverage`,
    },
    {
      label: 'Closing in < 45d',
      value: summary.closingSoon,
      icon: Calendar,
      caption: 'Need weekly check-ins',
    },
    {
      label: 'Avg. Probability',
      value: `${Math.round(summary.averageProbability * 100)}%`,
      icon: BarChart3,
      caption: 'Weighted by declared confidence',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-600">
            <card.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-slate-500">{card.caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PipelineBoard({
  buckets,
  selectedId,
  onSelect,
}: {
  buckets: Record<string, FundraisingRound[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
      {PIPELINE_COLUMNS.map((column) => {
        const rounds = buckets[column.id] ?? [];
        return (
          <div key={column.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{column.title}</p>
              <p className="text-xs text-slate-500">{rounds.length} deals</p>
            </div>
            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {rounds.length === 0 ? (
                <p className="text-sm text-slate-500 p-4">No rounds here yet.</p>
              ) : (
                rounds.map((round) => (
                  <button
                    key={round.id}
                    onClick={() => onSelect(round.id)}
                    className={cn(
                      'w-full text-left p-4 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                      selectedId === round.id && 'bg-brand-50/60 dark:bg-brand-500/10'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{round.ventureName}</p>
                        <p className="text-xs text-slate-500">{round.stage}</p>
                      </div>
                      <span className="text-xs font-medium text-brand-600">
                        {Math.round((round.probability ?? 0) * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center justify-between">
                      <span>Target {formatCurrency(round.targetAmount)}</span>
                      <span>Committed {formatCurrency(round.committedAmount)}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Close {round.closeDate ? formatDistanceToNow(new Date(round.closeDate), { addSuffix: true }) : 'TBD'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoundDetailPanel({ round, isLoading }: { round?: FundraisingRound; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <p className="text-sm text-slate-500">Loading round detail…</p>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Select a round to review diligence notes and investor participation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Venture</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{round.ventureName}</p>
          <p className="text-sm text-slate-500">{round.stage} · {round.status}</p>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
          <div>Owner: <span className="font-medium">{round.owner || 'Unassigned'}</span></div>
          <div>Target {formatCurrency(round.targetAmount)} · Committed {formatCurrency(round.committedAmount)}</div>
          <div>Lead investor: {round.leadInvestor || 'TBD'}</div>
          <div>Close date: {round.closeDate ? formatDate(round.closeDate) : 'TBD'}</div>
          <div>Data Room: {round.dataRoomId || '—'}</div>
        </div>
      </div>

      {round.investors && round.investors.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Investors</p>
          {round.investors.map((investor) => (
            <div key={`${round.id}-${investor.investorId || investor.name}`} className="flex items-center justify-between text-sm border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{investor.name}</p>
                <p className="text-xs text-slate-500">{investor.role} · {investor.status}</p>
              </div>
              {investor.commitment !== undefined && <span className="text-sm font-semibold">{formatCurrency(investor.commitment)}</span>}
            </div>
          ))}
        </div>
      )}

      {round.timeline && round.timeline.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Timeline</p>
          <div className="space-y-2">
            {round.timeline.map((entry) => (
              <div key={`${round.id}-${entry.date}-${entry.event}`} className="text-sm border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
                <div className="text-xs text-slate-500">{formatDate(entry.date)}</div>
                <div className="text-slate-900 dark:text-white">{entry.event}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function groupRoundsIntoBuckets(rounds: FundraisingRound[]): Record<string, FundraisingRound[]> {
  const result: Record<string, FundraisingRound[]> = {};
  const resolveBucket = (round: FundraisingRound) => {
    const status = (round.status || '').toLowerCase();
    if (status.includes('term')) return 'term-sheet';
    if (status.includes('closing') || status.includes('docs')) return 'closing';
    if (status.includes('closed') || status.includes('won')) return 'closed';
    if (status.includes('in market') || status.includes('diligence')) return 'diligence';
    return 'sourcing';
  };

  rounds.forEach((round) => {
    const bucketId = resolveBucket(round);
    if (!result[bucketId]) {
      result[bucketId] = [];
    }
    result[bucketId].push(round);
  });

  return result;
}
