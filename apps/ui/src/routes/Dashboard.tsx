import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { usePortfolioHeatmap, useUtilisation, useRoundSnapshots, useVentureManifests, useAlerts } from '@/hooks/useDashboard';
import { Briefcase, DollarSign, Target, Calendar, TrendingUp, Clock, Activity, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDays } from '@/lib/export';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Heatmap } from '@/components/dashboard/Heatmap';
import { useMemo, useState } from 'react';
import { DashboardFilters, type DashboardFiltersState } from '@/components/dashboard/Filters';
import { useOpsHealth } from '@/hooks/useHealth';

export function DashboardPage() {
  const { data: summary, isLoading, error } = usePortfolioSummary();
  const { data: heatmap } = usePortfolioHeatmap();
  const { data: util } = useUtilisation();
  const { data: rounds } = useRoundSnapshots();
  const { data: ventures } = useVentureManifests();
  const { data: alerts } = useAlerts();
  const { data: health } = useOpsHealth();

  const [filters, setFilters] = useState<DashboardFiltersState>({
    stage: 'all', owner: 'all', risk: 'all', tags: '', time: '14d', search: '',
  });
  const setFilterState = (next: Partial<DashboardFiltersState>) => setFilters((s) => ({ ...s, ...next }));

  const owners = useMemo(() => Array.from(new Set((ventures ?? []).map((v: any) => v.lead).filter(Boolean))), [ventures]);
  const stages = useMemo(() => ['Idea','Validation','Build','Pilot','Scale'], []);

  const filteredVentures = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return (ventures ?? []).filter((v: any) => {
      if (filters.stage !== 'all' && String(v.status || v.stage || '').toLowerCase() !== filters.stage.toLowerCase()) return false;
      if (filters.owner !== 'all' && String(v.lead || '').toLowerCase() !== filters.owner.toLowerCase()) return false;
      if (filters.risk === 'flagged' && !String(v.status || '').toLowerCase().includes('risk')) return false;
      if (q) {
        const hay = `${v.id} ${v.title || ''} ${v.lead || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ventures, filters]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-64 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Portfolio overview and key metrics</p>
        </div>

        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900 dark:text-red-100">Error Loading Dashboard</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error instanceof Error ? error.message : 'Failed to load portfolio summary'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Data loaded
  const stats = [
    {
      label: 'Active Ventures',
      value: summary?.activeVentures || 0,
      icon: Briefcase,
      color: 'text-brand-600 dark:text-brand-400',
      bgColor: 'bg-brand-100 dark:bg-brand-900/30',
      link: '/ventures',
    },
    {
      label: 'Total MRR',
      value: formatCurrency(summary?.totalMRR || 0),
      icon: DollarSign,
      color: 'text-accent-600 dark:text-accent-400',
      bgColor: 'bg-accent-100 dark:bg-accent-900/30',
      link: '/kpis',
    },
    {
      label: 'Rounds in Flight',
      value: summary?.roundsInFlight || 0,
      icon: Target,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      link: '/rounds',
    },
    {
      label: 'Avg Runway',
      value: summary?.avgRunwayDays ? formatDays(summary.avgRunwayDays) : 'N/A',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      link: '/budgets',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Portfolio overview and key metrics</p>
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <DashboardFilters state={filters} setState={setFilterState} owners={owners} stages={stages} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="
              bg-white dark:bg-slate-800
              rounded-xl shadow-sm
              border border-slate-200 dark:border-slate-700
              hover:border-brand-300 dark:hover:border-brand-700
              hover:shadow-md
              transition-all duration-200
              p-6
              group
            "
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Portfolio health + At-risk + Upcoming milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Portfolio Health</h3>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center justify-center">
              <Heatmap points={heatmap?.points ?? []} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">At-Risk</h3>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <ul className="space-y-3 text-sm">
              {filteredVentures
                .filter((v: any) => (v.status || '').toLowerCase().includes('risk'))
                .slice(0, 5)
                .map((v: any) => (
                  <li key={v.id} className="flex items-center justify-between">
                    <Link to={`/ventures/${encodeURIComponent(v.id)}`} className="text-brand-600 hover:underline">{v.title || v.id}</Link>
                    <span className="text-slate-500">{v.status}</span>
                  </li>
                ))}
              {filteredVentures.filter((v: any) => (v.status || '').toLowerCase().includes('risk')).length === 0 && (
                <li className="text-slate-500">No flagged ventures</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upcoming Milestones (14d)</h3>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <ul className="space-y-3 text-sm">
              {filteredVentures
                .filter((v: any) => (v.nextDue || '').length > 0)
                .slice(0, 5)
                .map((v: any) => (
                  <li key={v.id} className="flex items-center justify-between">
                    <Link to={`/ventures/${encodeURIComponent(v.id)}`} className="text-brand-600 hover:underline">{v.title || v.id}</Link>
                    <span className="text-slate-500">{v.nextDue}</span>
                  </li>
                ))}
              {filteredVentures.filter((v: any) => (v.nextDue || '').length > 0).length === 0 && (
                <li className="text-slate-500">No milestones in next 14 days</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Funding snapshot + Utilisation + Alerts + System health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Funding Snapshot</h3>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            {(() => {
              const open = (rounds ?? []).filter((r: any) => (r.committedUSD ?? 0) < (r.targetUSD ?? 0));
              const totalTarget = open.reduce((s: number, r: any) => s + (r.targetUSD ?? 0), 0);
              const totalCommitted = open.reduce((s: number, r: any) => s + (r.committedUSD ?? 0), 0);
              return (
                <div className="text-sm">
                  <div className="mb-2">Open rounds: <span className="font-medium">{open.length}</span></div>
                  <div>Target vs Committed: <span className="font-medium">{formatCurrency(totalCommitted)} / {formatCurrency(totalTarget)}</span></div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Resource Utilisation</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {(util?.items ?? []).slice(0, 6).map((u, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{u.person || u.resourceName} → {u.venture}</span>
                  <span className="font-medium">{Math.round(u.pct ?? u.percentage ?? 0)}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alerts (7d)</h3>
            </div>
            {alerts && alerts.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {alerts.slice(0, 6).map((a: any, i: number) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>{a.summary || a.message || a.id}</span>
                    {a.ruleId && <Link to={`/rules/${encodeURIComponent(a.ruleId)}`} className="text-brand-600 hover:underline">Edit rule</Link>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">No alerts this week</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">System & Data Health</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>API: <span className="text-green-600 dark:text-green-400">OK</span></li>
              <li>Snapshot lag p95: <span>{health ? `${health.snapshotLagP95_s}s` : '—'}</span></li>
              <li>Handler error rate: <span>{health ? `${health.handlerErrorRate}%` : '—'}</span></li>
              <li>Storage usage: <span>{health ? `${(health.storageGB).toFixed(3)} GB` : '—'}</span></li>
              <li>Est. monthly cost: <span>{health ? `$${health.estMonthlyCostUSD.toFixed(2)}` : '—'}</span></li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {summary?.recentChanges && summary.recentChanges.length > 0 ? (
                summary.recentChanges.slice(0, 10).map((event) => (
                  <div key={event.id} className="px-6 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-slate-100">
                          <span className="font-medium">{event.entity}</span>{' '}
                          <span className="text-slate-600 dark:text-slate-400">{event.action}</span>
                          {event.ventureTitle && (
                            <> in <Link to={`/ventures/${event.entityId}`} className="text-brand-600 dark:text-brand-400 hover:underline">{event.ventureTitle}</Link></>
                          )}
                        </p>
                        {event.summary && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{event.summary}</p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          {event.user && ` by ${event.user}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-slate-600 dark:text-slate-400">
                  No recent activity
                </div>
              )}
            </div>
            {summary?.recentChanges && summary.recentChanges.length > 10 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link to="/audit" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
                  View all activity
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          {/* Status Breakdown */}
          {summary?.statusBreakdown && summary.statusBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Venture Status</h2>
              </div>
              <div className="p-6 space-y-3">
                {summary.statusBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.status === 'Scale'
                            ? 'bg-accent-500'
                            : item.status === 'Build'
                            ? 'bg-brand-500'
                            : item.status === 'Pilot'
                            ? 'bg-purple-500'
                            : item.status === 'Validation'
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                      ></div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{item.status}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Links</h2>
            </div>
            <div className="p-6 space-y-2">
              <Link
                to="/ventures"
                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                View All Ventures
              </Link>
              <Link
                to="/kpis"
                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                KPI Metrics
              </Link>
              <Link
                to="/resources"
                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                Resource Utilization
              </Link>
              <Link
                to="/budgets"
                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                Budget Overview
              </Link>
              <Link
                to="/rounds"
                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                Active Rounds
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
