import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Edit, Calendar, User, Tag, Loader2, AlertTriangle } from 'lucide-react';

import { useIdea } from '@/hooks/useIdea';
import { useUpdateIdea } from '@/hooks/useUpdateIdea';
import { IdeaScoringDisplay } from '@/components/ideas/IdeaScoringDisplay';
import { IdeaStageWorkflow } from '@/components/ideas/IdeaStageWorkflow';
import { IdeaScoringEditor } from '@/components/ideas/IdeaScoringEditor';
import { IdeaCommentsPanel } from '@/components/ideas/IdeaCommentsPanel';
import { ResearchDocsPanel } from '@/components/ideas/ResearchDocsPanel';
import type { IdeaDecisionGateAlert, IdeaScoring } from '@/types/idea';
import { Button } from '@/components/ui/button';
import { useIdeaDecisionGates } from '@/hooks/useIdeaDecisionGates';

const statusColorMap = {
  New: 'slate',
  'Under Review': 'blue',
  Approved: 'accent',
  Rejected: 'red',
  'On Hold': 'amber',
} as const;

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: idea, isLoading, error } = useIdea(id);
  const updateIdea = useUpdateIdea();
  const [scoringOpen, setScoringOpen] = useState(false);
  const { data: decisionGates = [] } = useIdeaDecisionGates();

  const ideaAlerts = useMemo<IdeaDecisionGateAlert[]>(() => {
    if (!idea) return [];
    return decisionGates.filter((alert) => alert.id === idea.id);
  }, [decisionGates, idea]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            Failed to load idea. Please try again.
          </p>
          <Button onClick={() => navigate('/ideas')} variant="ghost">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Ideas</span>
          </Button>
        </div>
      </div>
    );
  }

  const statusColor = statusColorMap[idea.status as keyof typeof statusColorMap] || statusColorMap.New;

  const handleScoreSave = async (score: IdeaScoring) => {
    if (!idea?.id) return;
    await updateIdea.mutateAsync({ id: idea.id, updates: { score } });
    setScoringOpen(false);
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <div>
          <button
            onClick={() => navigate('/ideas')}
            className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Ideas</span>
          </button>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 shadow-subtle overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {idea.title || idea.theme}
                </h1>
                {idea.title && <p className="text-sm text-slate-500 mb-3">{idea.theme}</p>}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-${statusColor}-50 dark:bg-${statusColor}-900/40 text-${statusColor}-700 dark:text-${statusColor}-300 ring-1 ring-inset ring-${statusColor}-200/70`}>
                    {idea.status || 'New'}
                  </span>
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      {idea.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="text-xs text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
              {idea.createdBy && (
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>Created by {idea.createdBy}</span>
                </div>
              )}
              {idea.createdAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}</span>
                </div>
              )}
            </div>
            {ideaAlerts.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <AlertTriangle className="w-4 h-4" /> Decision gates triggered
                </div>
                <ul className="space-y-1 text-xs">
                  {ideaAlerts.map((alert, idx) => (
                    <li key={`${alert.type}-${idx}`} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{alert.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-8">
                <IdeaSection title="Problem" body={idea.problem} />
                <IdeaSection title="Market" body={idea.market} />
                <IdeaSection title="Team" body={idea.team} />
                <IdeaSection title="Technology" body={idea.tech} />
                {idea.description && <IdeaSection title="Additional Notes" body={idea.description} />}
                <ResearchDocsPanel
                  ideaId={idea.id}
                  researchDocs={idea.researchDocs}
                  attachments={idea.attachments}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 p-5">
                  <IdeaStageWorkflow currentStage={idea.stage} />
                </div>

                <div className="space-y-3">
                  {idea.score ? (
                    <IdeaScoringDisplay score={idea.score} />
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-400">
                      No screening score yet. Score this idea to rank it against the rest of the pipeline.
                    </div>
                  )}
                  <Button
                    variant={idea.score ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setScoringOpen(true)}
                  >
                    {idea.score ? 'Update score' : 'Score this idea'}
                  </Button>
                </div>

                {(idea.stageOwner || idea.stageDueDate) && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 p-5 text-sm">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      Current Stage Info
                    </h3>
                    {idea.stageOwner && (
                      <div className="mb-2">
                        <span className="text-slate-500">Owner:</span>
                        <span className="ml-2 text-slate-900 dark:text-white font-medium">
                          {idea.stageOwner}
                        </span>
                      </div>
                    )}
                    {idea.stageDueDate && (
                      <div>
                        <span className="text-slate-500">Due:</span>
                        <span className="ml-2 text-slate-900 dark:text-white font-medium">
                          {new Date(idea.stageDueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        <IdeaCommentsPanel ideaId={idea.id} ideaTitle={idea.title || idea.theme} />
      </div>

      <IdeaScoringEditor
        open={scoringOpen}
        onOpenChange={setScoringOpen}
        initialScore={idea.score}
        onSave={handleScoreSave}
        isSaving={updateIdea.isPending}
      />
    </>
  );
}

function IdeaSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{title}</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}
