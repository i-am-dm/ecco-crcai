import { useParams, Link } from 'react-router-dom';
import { usePlaybook } from '@/hooks/usePlaybooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Edit, Rocket } from 'lucide-react';
import { Link as RLink } from 'react-router-dom';
import { usePlaybookHistory } from '@/hooks/usePlaybookHistory';
import { rawPost } from '@/lib/api';

import { useState } from 'react';

export function PlaybookDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = usePlaybook(id);
  const { data: history } = usePlaybookHistory(id);
  const [applyOpen, setApplyOpen] = useState(false);
  const [ventureId, setVentureId] = useState('');

  const name = data?.name || data?.title || id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/playbooks" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Badge variant="primary">{data?.stage || '—'}</Badge>
              <span>Version: {data?.version || '—'}</span>
              <span>Owner: {data?.owner || '—'}</span>
              {data?.updated_at && <span>Updated {formatDate(data.updated_at)}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setApplyOpen(true)}><Rocket className="w-4 h-4" /> Apply to venture</Button>
          <RLink to={`/playbooks/${encodeURIComponent(id)}/edit`}><Button variant="secondary"><Edit className="w-4 h-4" /> Edit</Button></RLink>
          <Button variant="outline">Duplicate</Button>
          <Button variant="ghost" onClick={() => exportMarkdown(data)}>Export</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="linked">Linked Ventures</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-slate-500">Goal</div>
                  <div className="font-medium">{(data as any)?.goal || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Prerequisites</div>
                  <div className="font-medium">{(data as any)?.prerequisites || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Expected impacts</div>
                  <div className="font-medium">
                    {data?.expected_impacts
                      ? Object.entries(data.expected_impacts).map(([k, v]) => (
                          <span key={k} className="mr-3">{k}: {String(v)}</span>
                        ))
                      : '—'}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {data?.tags?.length
                    ? data.tags.map((t: string) => <Badge key={t}>{t}</Badge>)
                    : <span className="text-slate-500">—</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {isLoading && <div className="text-slate-500">Loading…</div>}
              {!isLoading && (!data?.checklist || data.checklist.length === 0) && (
                <div className="text-slate-500">No checklist steps</div>
              )}
              <ol className="space-y-3 list-decimal pl-5">
                {data?.checklist?.map((s) => (
                  <li key={s.id}>
                    <div className="font-medium">{s.title}</div>
                    <div className="text-sm text-slate-500">
                      {s.role ? `Owner: ${s.role}` : ''}
                      {s.duration_days ? ` • ${s.duration_days}d` : ''}
                      {s.depends_on?.length ? ` • depends on: ${s.depends_on.join(', ')}` : ''}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {!data?.assets?.length ? (
                <div className="text-slate-500">No assets</div>
              ) : (
                <ul className="space-y-2">
                  {data.assets.map((a, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Badge variant="secondary">{a.type}</Badge>
                      <a className="text-brand-600 hover:underline" href={a.uri} target="_blank" rel="noreferrer">{a.name}</a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {!data?.rules?.length ? (
                <div className="text-slate-500">No rules defined</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.rules.map((r) => (
                    <li key={r.id}>
                      <code>{r.metric}</code> {r.op} <strong>{r.target}</strong> {r.window_days ? `over ${r.window_days}d` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="linked" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {!data?.linked_ventures?.length ? (
                <div className="text-slate-500">No linked ventures</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.linked_ventures.map((lv) => (
                    <li key={lv.id}>
                      <span className="font-medium">{lv.id}</span>
                      {lv.last_applied && <span className="ml-2 text-slate-500">(last applied {formatDate(lv.last_applied)})</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {!history || history.length === 0 ? (
                <div className="text-slate-500 text-sm">No history available.</div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">Recent versions</div>
                  <ul className="space-y-2 text-sm">
                    {history.slice(0, 5).map((h, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span>{h.updated_at || h.created_at || '—'} — v{h.version || '—'} — {h.status || '—'}</span>
                      </li>
                    ))}
                  </ul>
                  {history.length >= 2 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Latest vs Previous (diff)</div>
                      <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded overflow-auto max-h-72">{renderDiff(history[0], history[1])}</pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="p-6 text-slate-500 text-sm">
              Notes and learnings coming soon.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply to venture dialog (stub) */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply playbook to a venture</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Select a venture to generate tasks and create a playbook run record.
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Venture ID</div>
              <Input placeholder="e.g., V001" value={ventureId} onChange={(e) => setVentureId(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  await rawPost('/v1/playbooks/apply', { playbookId: id, ventureId });
                } catch {}
                setApplyOpen(false);
              }}
              disabled={!ventureId}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function exportMarkdown(pb: any | undefined) {
  if (!pb) return;
  const name = pb.name || pb.title || pb.id;
  const lines: string[] = [];
  lines.push(`# ${name}`);
  if (pb.stage || pb.function) lines.push(`Stage: ${pb.stage || ''}  Function: ${pb.function || ''}`);
  if (pb.owner) lines.push(`Owner: ${pb.owner}`);
  if (pb.version) lines.push(`Version: ${pb.version}`);
  lines.push('');
  if (pb.expected_impacts) {
    lines.push('## Expected Impacts');
    for (const [k, v] of Object.entries(pb.expected_impacts)) lines.push(`- ${k}: ${v}`);
    lines.push('');
  }
  if (Array.isArray(pb.checklist) && pb.checklist.length) {
    lines.push('## Checklist');
    pb.checklist.forEach((s: any, i: number) => lines.push(`${i + 1}. ${s.title}${s.role ? ` (role: ${s.role})` : ''}${s.duration_days ? ` — ${s.duration_days}d` : ''}`));
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${pb.id || 'playbook'}.md`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function renderDiff(a: any, b: any): string {
  const keys = Array.from(new Set([...Object.keys(a || {}), ...Object.keys(b || {})])).filter((k) => !['updated_at','created_at'].includes(k));
  const out: string[] = [];
  for (const k of keys) {
    const av = JSON.stringify(a?.[k]);
    const bv = JSON.stringify(b?.[k]);
    if (av !== bv) out.push(`- ${k}:\n  - was: ${bv}\n  + now: ${av}`);
  }
  return out.join('\n') || 'No changes';
}
