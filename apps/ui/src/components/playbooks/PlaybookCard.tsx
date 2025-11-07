import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import type { PlaybookManifestItem } from '@/types/playbook';
import { formatDate, cn } from '@/lib/utils';

interface PlaybookCardProps {
  item: PlaybookManifestItem;
  className?: string;
}

export function PlaybookCard({ item, className }: PlaybookCardProps) {
  const name = item.title || (item as any).name || item.id;
  const stage = item.stage || (item as any).stage || '—';
  const status = item.status || '—';
  const updated = item.updated_at ? formatDate(item.updated_at) : '—';

  return (
    <Link to={`/playbooks/${encodeURIComponent(item.id)}`}>
      <Card className={cn('p-5 hover:shadow-md transition-shadow', className)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {name}
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Updated {updated}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">{stage}</Badge>
            <Badge variant={status.toLowerCase() === 'published' ? 'success' : 'default'}>
              {status}
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-slate-500 dark:text-slate-400">Effectiveness</div>
            <div className="font-medium">{(item as any).effectiveness_score ?? '—'}</div>
          </div>
          <div>
            <div className="text-slate-500 dark:text-slate-400">Version</div>
            <div className="font-medium">{(item as any).version ?? '—'}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

