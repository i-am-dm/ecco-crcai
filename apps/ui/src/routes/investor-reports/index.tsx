import { useMemo, useState } from 'react';
import { ScrollText, Download, Users, AlertTriangle } from 'lucide-react';
import { useInvestorReports } from '@/hooks/useInvestorReports';
import type { InvestorReport } from '@/types/api';
import { formatDate, formatCurrency } from '@/lib/utils';

export function InvestorReportsPage() {
  const { data: reports = [], isLoading, error } = useInvestorReports();
  const [ventureFilter, setVentureFilter] = useState('all');

  const ventureOptions = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((report) => {
      if (report.ventureId) set.add(report.ventureId);
    });
    return Array.from(set);
  }, [reports]);

  const filteredReports = ventureFilter === 'all' ? reports : reports.filter((report) => report.ventureId === ventureFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ScrollText className="w-10 h-10 text-brand-600 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Loading investor reports…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-6">
          <p className="text-red-700 dark:text-red-300 font-semibold mb-1">Unable to load reports</p>
          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-brand-600 uppercase tracking-widest">FR-35 Investor Reporting</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Investor Updates & KPI Packs</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Centralized view of the memos, KPI highlights, and outstanding asks shared with LPs.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={ventureFilter}
          onChange={(event) => setVentureFilter(event.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900"
        >
          <option value="all">All ventures</option>
          {ventureOptions.map((venture) => (
            <option key={venture} value={venture}>
              {venture}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-500">
          {filteredReports.length} report{filteredReports.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="space-y-4">
        {filteredReports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
        {filteredReports.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
            <p className="text-sm text-slate-500">No reports yet. Generate an investor memo from the KPI dashboard to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: InvestorReport }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{report.title}</p>
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              {report.period || 'Ad hoc'} · {report.updatedAt ? formatDate(report.updatedAt) : 'Unknown date'}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">{report.summary}</p>
        {report.audience && (
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-4 h-4" />
            {report.audience.length} recipients
          </div>
        )}
      </div>

      {report.kpiHighlights && report.kpiHighlights.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {report.kpiHighlights.map((kpi) => (
            <div key={`${report.id}-${kpi.label}`} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest">{kpi.label}</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {kpi.label.toLowerCase().includes('revenue') || kpi.label.toLowerCase().includes('burn')
                  ? formatCurrency(kpi.value)
                  : kpi.value}
              </p>
              {kpi.deltaPercent !== undefined && (
                <p className={kpi.deltaPercent >= 0 ? 'text-xs text-emerald-600' : 'text-xs text-red-500'}>
                  {kpi.deltaPercent >= 0 ? '+' : ''}
                  {Math.round(kpi.deltaPercent)}%
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {report.milestones && report.milestones.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Milestones</p>
          <ul className="list-disc pl-5 text-sm space-y-1 text-slate-600 dark:text-slate-300">
            {report.milestones.map((milestone) => (
              <li key={`${report.id}-${milestone}`}>{milestone}</li>
            ))}
          </ul>
        </div>
      )}

      {report.risks && report.risks.length > 0 && (
        <div className="rounded-xl border border-amber-100 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4" />
            Key Risks
          </div>
          {report.risks.map((risk) => (
            <p key={`${report.id}-${risk}`} className="text-sm text-amber-800 dark:text-amber-100">
              • {risk}
            </p>
          ))}
        </div>
      )}

      {report.requests && report.requests.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Asks</p>
          <ul className="space-y-2">
            {report.requests.map((request) => (
              <li key={`${report.id}-${request.type}-${request.details}`} className="text-sm border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
                <span className="font-medium text-slate-900 dark:text-white">{request.type}:</span> {request.details}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.attachments && report.attachments.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {report.attachments.map((attachment) => (
            <a
              key={`${report.id}-${attachment.title}`}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4 text-brand-600" />
              {attachment.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
