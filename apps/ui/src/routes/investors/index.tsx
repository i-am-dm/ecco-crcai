import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Clock3,
  ChevronRight,
  UserCheck,
  Briefcase,
  NotebookPen,
} from 'lucide-react';
import { useInvestors, useInvestor } from '@/hooks/useInvestors';
import type { InvestorRecord, InvestorDetail } from '@/types/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export function InvestorsPage() {
  const { data: investors = [], isLoading, error } = useInvestors();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [focusFilter, setFocusFilter] = useState('all');

  const { data: selectedInvestor, isFetching: detailLoading } = useInvestor(selectedId ?? undefined);

  const focusOptions = useMemo(() => {
    const set = new Set<string>();
    investors.forEach((investor) => {
      investor.focus?.forEach((focus) => set.add(focus));
    });
    return Array.from(set).sort();
  }, [investors]);

  const filteredInvestors = useMemo(() => {
    return investors.filter((investor) => {
      const matchesSearch =
        !searchQuery ||
        investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        investor.owner?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || investor.status?.toLowerCase() === statusFilter;
      const matchesFocus =
        focusFilter === 'all' || investor.focus?.some((entry) => entry.toLowerCase() === focusFilter);
      return matchesSearch && matchesStatus && matchesFocus;
    });
  }, [investors, searchQuery, statusFilter, focusFilter]);

  const stats = useMemo(() => {
    const active = investors.filter((inv) => inv.status?.toLowerCase() === 'active').length;
    const prospects = investors.filter((inv) => inv.status?.toLowerCase() === 'prospect').length;
    const avgCheck = (() => {
      const ranges = investors
        .map((inv) => inv.checkRange)
        .filter(Boolean)
        .map((range) => {
          const numbers = range!.match(/\d+(\.\d+)?/g);
          if (!numbers || numbers.length === 0) return 0;
          const values = numbers.map(Number);
          return values.reduce((a, b) => a + b, 0) / values.length;
        })
        .filter((value) => value > 0);
      if (!ranges.length) return 0;
      return ranges.reduce((a, b) => a + b, 0) / ranges.length;
    })();
    const avgDaysSinceTouch = (() => {
      const days = investors
        .map((inv) => (inv.lastInteraction ? Date.now() - Date.parse(inv.lastInteraction) : null))
        .filter((value): value is number => value !== null)
        .map((diff) => Math.round(diff / (1000 * 60 * 60 * 24)));
      if (!days.length) return null;
      return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    })();
    return { active, prospects, avgCheck, avgDaysSinceTouch };
  }, [investors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="w-10 h-10 text-brand-600 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Loading investor CRM…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-6">
          <p className="text-red-700 dark:text-red-300 font-medium mb-2">Unable to load investors</p>
          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-brand-600 uppercase tracking-widest">FR-32 Investor CRM</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Investors & LPs</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Track relationships, touchpoints, and open pipelines across the studio’s fundraising efforts.
        </p>
      </div>

      <InvestorSummary stats={stats} total={investors.length} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by investor or owner..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9 pr-4 py-2.5 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="prospect">Prospect</option>
              <option value="dormant">Dormant</option>
            </select>
          </div>
          <select
            value={focusFilter}
            onChange={(event) => setFocusFilter(event.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900"
          >
            <option value="all">All focus areas</option>
            {focusOptions.map((focus) => (
              <option key={focus} value={focus.toLowerCase()}>
                {focus}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <InvestorTable investors={filteredInvestors} selectedId={selectedId} onSelect={setSelectedId} />
        <InvestorDetailPanel investor={selectedInvestor} isLoading={detailLoading} />
      </div>
    </div>
  );
}

function InvestorSummary({
  stats,
  total,
}: {
  stats: { active: number; prospects: number; avgCheck: number; avgDaysSinceTouch: number | null };
  total: number;
}) {
  const cards = [
    {
      label: 'Active Relationships',
      value: stats.active,
      icon: UserCheck,
      caption: `${total} total`,
      tone: 'text-emerald-600',
    },
    {
      label: 'Prospects In Pipeline',
      value: stats.prospects,
      icon: Briefcase,
      caption: 'Need next touch',
      tone: 'text-amber-600',
    },
    {
      label: 'Avg. Check Size',
      value: stats.avgCheck ? formatCurrency(stats.avgCheck) : 'N/A',
      icon: NotebookPen,
      caption: 'Across declared ranges',
      tone: 'text-brand-600',
    },
    {
      label: 'Avg. Days Since Touch',
      value: stats.avgDaysSinceTouch !== null ? `${stats.avgDaysSinceTouch}d` : 'N/A',
      icon: Clock3,
      caption: 'Latest recorded interaction',
      tone: 'text-slate-600 dark:text-slate-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl bg-slate-100 dark:bg-slate-800', card.tone)}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.caption}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InvestorTable({
  investors,
  selectedId,
  onSelect,
}: {
  investors: InvestorRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (investors.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
        <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">No investors found. Adjust filters or import contacts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900/60">
          <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3 text-left">Investor</th>
            <th className="px-4 py-3 text-left">Focus</th>
            <th className="px-4 py-3 text-left">Owner</th>
            <th className="px-4 py-3 text-left">Last Touch</th>
            <th className="px-4 py-3 text-left">Check Range</th>
            <th className="px-4 py-3 text-left">Pipelines</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {investors.map((investor) => {
            const isSelected = investor.id === selectedId;
            const lastInteractionLabel = investor.lastInteraction
              ? formatDistanceToNow(new Date(investor.lastInteraction), { addSuffix: true })
              : 'N/A';
            return (
              <tr
                key={investor.id}
                className={cn(
                  'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors',
                  isSelected && 'bg-brand-50/60 dark:bg-brand-500/10'
                )}
                onClick={() => onSelect(investor.id)}
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900 dark:text-white">{investor.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{investor.status || 'Unknown'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {investor.focus?.slice(0, 2).map((focus) => (
                      <span
                        key={focus}
                        className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {focus}
                      </span>
                    ))}
                    {investor.focus && investor.focus.length > 2 && (
                      <span className="text-xs text-slate-500">+{investor.focus.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{investor.owner || 'Unassigned'}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{lastInteractionLabel}</td>
                <td className="px-4 py-3">{investor.checkRange || '—'}</td>
                <td className="px-4 py-3">{investor.openPipelineCount ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InvestorDetailPanel({ investor, isLoading }: { investor?: InvestorDetail; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading relationship details…</p>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Select an investor to view contacts, portfolio, and activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{investor.name}</h2>
            <p className="text-xs uppercase tracking-widest text-slate-500">{investor.status || 'Unknown status'}</p>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 text-right">
            <div>Owner: {investor.owner || 'Unassigned'}</div>
            <div>Check: {investor.checkRange || formatRange(investor)}</div>
          </div>
        </div>
        {investor.nextSteps && (
          <div className="mt-4 rounded-xl bg-brand-50 dark:bg-brand-500/10 p-3 text-sm text-brand-800 dark:text-brand-200">
            <span className="font-medium">Next steps:</span> {investor.nextSteps}
          </div>
        )}
        {investor.notes && (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{investor.notes}</p>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest">Contacts</h3>
        {investor.contacts && investor.contacts.length > 0 ? (
          investor.contacts.map((contact) => (
            <div key={contact.email || contact.name} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 space-y-1 text-sm">
              <div className="font-medium text-slate-900 dark:text-white">{contact.name}</div>
              <div className="text-slate-500">{contact.title}</div>
              <div className="flex flex-wrap gap-3 text-slate-500">
                {contact.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {contact.email}
                  </span>
                )}
                {contact.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {contact.phone}
                  </span>
                )}
                {contact.timezone && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {contact.timezone}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No contacts captured yet.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 dark:text-white">Interaction Log</h3>
        {investor.interactionLog && investor.interactionLog.length > 0 ? (
          <div className="space-y-3">
            {investor.interactionLog.map((entry, index) => (
              <div key={`${entry.date}-${index}`} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                <div className="text-xs text-slate-500">{formatDate(entry.date)}</div>
                <div className="font-medium text-slate-900 dark:text-white">{entry.type}</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{entry.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No interactions logged.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 dark:text-white">Portfolio & Pipelines</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Holdings</p>
            {investor.portfolio && investor.portfolio.length > 0 ? (
              <div className="space-y-2">
                {investor.portfolio.map((entry) => (
                  <div key={entry.ventureId} className="text-sm border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{entry.ventureName}</div>
                      <div className="text-xs text-slate-500">{entry.role}</div>
                    </div>
                    <div className="text-right">
                      {entry.initialCheck !== undefined && (
                        <div className="text-sm font-semibold">{formatCurrency(entry.initialCheck)}</div>
                      )}
                      {entry.ownership !== undefined && (
                        <div className="text-xs text-slate-500">{(entry.ownership * 100).toFixed(1)}% ownership</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No holdings recorded.</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Open Pipelines</p>
            {investor.openPipelines && investor.openPipelines.length > 0 ? (
              <div className="space-y-2">
                {investor.openPipelines.map((pipeline) => (
                  <div key={pipeline.roundId} className="text-sm border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                    <div className="font-medium text-slate-900 dark:text-white">{pipeline.ventureName}</div>
                    <div className="text-xs text-slate-500 mb-1">
                      {pipeline.stage} · Target {formatCurrency(pipeline.targetAmount)} ({Math.round((pipeline.probability ?? 0) * 100)}%)
                    </div>
                    <div className="text-xs text-slate-500">{pipeline.nextAction}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active pipeline items.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function formatRange(investor: InvestorDetail) {
  if (investor.checkRange) return investor.checkRange;
  if (investor.checkSizeMin && investor.checkSizeMax) {
    return `${formatCurrency(investor.checkSizeMin)} - ${formatCurrency(investor.checkSizeMax)}`;
  }
  return '—';
}
