import { useMemo, useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVenture } from '@/hooks/useVentures';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, AlertCircle, Loader2, Flag, AlertTriangle, Target, Clock3 } from 'lucide-react';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { VentureMilestone } from '@/types/api';
import { VentureMilestonesTimeline } from '@/components/ventures/VentureMilestonesTimeline';
import { useShowPage, type ShowPageSnapshot } from '@/hooks/useShowPages';
import { ShowPageEditor } from '@/components/ventures/ShowPageEditor';
import { useQueryClient } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';

export function VentureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useVenture(id!);
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [showEditorOpen, setShowEditorOpen] = useState(false);
  const [savingShowPage, setSavingShowPage] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading venture...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
                Failed to load venture
              </h3>
              <p className="text-red-800 dark:text-red-400">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">Venture not found</p>
        </div>
      </div>
    );
  }

  const venture = data.data;
  const showPageId = venture.id;
  const { data: showPage } = useShowPage(showPageId);
  const milestones = venture.milestones || [];
  const { nextMilestone, overdueCount } = useMemo(() => {
    const now = Date.now();
    const dated = milestones.filter((m) => m.dueDate);
    const sorted = [...dated].sort((a, b) => Date.parse(a.dueDate!) - Date.parse(b.dueDate!));
    const upcoming = sorted.find((m) => Date.parse(m.dueDate!) >= now) || sorted[0];
    const overdue = milestones.filter(
      (m) => m.dueDate && m.status !== 'Complete' && Date.parse(m.dueDate) < now
    );
    return { nextMilestone: upcoming, overdueCount: overdue.length };
  }, [milestones]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/ventures"
          className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Ventures
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {venture.title || 'Untitled Venture'}
              </h1>
              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300">
                {venture.status || 'Unknown'}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              ID: {data.id}
            </p>
          </div>

          {canEdit('venture', venture.lead) && (
            <Button variant="primary">
              <Edit className="w-5 h-5 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Current Stage"
          value={venture.status || 'Unknown'}
          icon={<Target className="w-4 h-4" />}
        />
        <SummaryCard
          title="Venture Lead"
          value={venture.lead || 'Unassigned'}
          icon={<Flag className="w-4 h-4" />}
        />
        <SummaryCard
          title="Next Milestone"
          value={nextMilestone ? nextMilestone.title : 'Not set'}
          helper={nextMilestone?.dueDate ? formatDate(nextMilestone.dueDate) : undefined}
          icon={<ClockIndicator />}
        />
        <SummaryCard
          title="Overdue Milestones"
          value={overdueCount}
          state={overdueCount > 0 ? 'warning' : 'default'}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Overview
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Description
              </label>
              <p className="mt-1 text-slate-900 dark:text-white">
                {venture.description || 'No description provided'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Lead
                </label>
                <p className="mt-1 text-slate-900 dark:text-white">
                  {venture.lead || 'Unassigned'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Next Due
                </label>
                <p className="mt-1 text-slate-900 dark:text-white">
                  {formatDate(venture.nextDue)}
                </p>
              </div>
            </div>

            {venture.mrr !== undefined && (
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Monthly Recurring Revenue
                </label>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(venture.mrr)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Metadata
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-slate-500 dark:text-slate-400">Entity</label>
              <p className="text-slate-900 dark:text-white font-medium">
                {data.entity}
              </p>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400">Version</label>
              <p className="text-slate-900 dark:text-white font-medium">
                {(venture as any).version || 'N/A'}
              </p>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400">Last Updated</label>
              <p className="text-slate-900 dark:text-white font-medium">
                {formatDate((venture as any).updated)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Milestones</h2>
            <Button variant="secondary" size="sm">
              <PlusIcon />
              Add Milestone
            </Button>
          </div>
          <VentureMilestonesTimeline milestones={milestones as VentureMilestone[]} />
        </section>
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Show Page</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {showPage?.published ? 'Published and visible to investors' : 'Draft — not yet published'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {showPage?.published && (
                <Link
                  to={`/ventures/show/${showPage.id}`}
                  target="_blank"
                  className="text-brand-600 text-sm font-medium"
                >
                  View live page
                </Link>
              )}
              <Button variant="secondary" size="sm" onClick={() => setShowEditorOpen(true)}>
                Manage Show Page
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase text-slate-500">Title</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{showPage?.title || venture.title}</div>
              <p className="text-sm text-slate-500 mt-1">{showPage?.tagline || 'No tagline yet'}</p>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Primary Metric</div>
              {showPage?.metrics?.[0] ? (
                <div className="text-lg font-semibold text-slate-900 dark:text-white">
                  {showPage.metrics[0].label}: {showPage.metrics[0].value}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Add a hero metric to showcase traction</p>
              )}
            </div>
          </div>
        </section>
        {/* Future sections: KPIs, rounds, cap table, etc. */}
      </div>

      <ShowPageEditor
        open={showEditorOpen}
        onOpenChange={setShowEditorOpen}
        initial={showPage}
        onSave={handleShowPageSave}
        isSaving={savingShowPage}
      />
    </div>
  );

  async function handleShowPageSave(payload: Partial<ShowPageSnapshot>) {
    setSavingShowPage(true);
    try {
      await apiHelpers.writeHistory('show_page', {
        id: showPage?.id || showPageId,
        venture_id: venture.id,
        title: payload.title || showPage?.title || venture.title,
        ...payload,
      });
      await queryClient.invalidateQueries({ queryKey: ['show_page', showPageId] });
      setShowEditorOpen(false);
    } finally {
      setSavingShowPage(false);
    }
  }
}

function SummaryCard({
  title,
  value,
  helper,
  icon,
  state = 'default',
}: {
  title: string;
  value: string | number | undefined;
  helper?: string;
  icon?: ReactNode;
  state?: 'default' | 'warning';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 bg-white dark:bg-slate-900 flex flex-col gap-1',
        state === 'warning'
          ? 'border-amber-200 dark:border-amber-800'
          : 'border-slate-200 dark:border-slate-700'
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {icon}
        {title}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">
        {value ?? '—'}
      </div>
      {helper && <div className="text-xs text-slate-500 dark:text-slate-400">{helper}</div>}
    </div>
  );
}

function ClockIndicator() {
  return <Clock3 className="w-4 h-4" />;
}

function PlusIcon() {
  return <span className="text-lg leading-none">+</span>;
}
