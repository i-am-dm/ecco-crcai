import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ResearchDoc } from '@/types/idea';
import { useMemo } from 'react';

interface ResearchDocsPanelProps {
  ideaId: string;
  researchDocs?: ResearchDoc[];
  attachments?: string[];
}

export function ResearchDocsPanel({ researchDocs, attachments }: ResearchDocsPanelProps) {
  const docs = researchDocs ?? [];

  const legacyAttachments = useMemo(() => {
    if (!attachments) return [];
    const docLinks = new Set<string>();
    docs.forEach((doc) => doc.versions?.forEach((version) => version.url && docLinks.add(version.url)));
    return attachments.filter((link) => link && !docLinks.has(link));
  }, [attachments, docs]);

  if (docs.length === 0 && legacyAttachments.length === 0) {
    return (
      <Card className="border border-dashed bg-slate-50 dark:bg-slate-900/40">
        <CardContent className="p-6 text-sm text-slate-500 dark:text-slate-400">
          No research docs linked yet. Add experiment notes or diligence docs from the write CLI or API to give reviewers context.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Research Docs</p>
            <p className="text-xs text-slate-500">Evidence, experiments, or attachments tied to this idea.</p>
          </div>
        </div>

        <div className="space-y-4">
          {docs.map((doc) => (
            <article key={doc.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{doc.title}</h3>
                {doc.docType && <Badge variant="outline" className="text-xs capitalize">{doc.docType}</Badge>}
                {doc.status && <Badge className="text-xs">{doc.status}</Badge>}
              </div>
              {doc.summary && <p className="text-sm text-slate-600 dark:text-slate-300">{doc.summary}</p>}
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 text-xs text-slate-500">
                  {doc.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {doc.versions && doc.versions.length > 0 && (
                <div className="space-y-1">
                  {doc.versions.slice(0, 3).map((version) => (
                    <VersionRow key={version.id} version={version} />
                  ))}
                  {doc.versions.length > 3 && (
                    <p className="text-xs text-slate-500">+{doc.versions.length - 3} more versions</p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>

        {legacyAttachments.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Legacy attachments</p>
            <div className="space-y-1 text-sm">
              {legacyAttachments.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VersionRow({ version }: { version: NonNullable<ResearchDoc['versions']>[number] }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div>
        <p className="text-slate-900 dark:text-white font-medium">
          v{version.version}
          {version.uploadedAt && (
            <span className="text-xs text-slate-500">
              {' '}
              · {formatDistanceToNow(new Date(version.uploadedAt), { addSuffix: true })}
            </span>
          )}
        </p>
        {version.notes && <p className="text-xs text-slate-500">{version.notes}</p>}
      </div>
      {version.url && (
        <a
          href={version.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          Open
        </a>
      )}
    </div>
  );
}
