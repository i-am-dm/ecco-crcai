import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import type { PlaybookManifestItem } from '@/types/playbook';
import { formatDate } from '@/lib/utils';

interface PlaybookTableProps {
  items: PlaybookManifestItem[];
}

export function PlaybookTable({ items }: PlaybookTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Function</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead>Linked ventures</TableHead>
            <TableHead>Effectiveness</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => {
            const name = it.title || (it as any).name || it.id;
            return (
              <TableRow key={it.id}>
                <TableCell>
                  <Link to={`/playbooks/${encodeURIComponent(it.id)}`} className="text-brand-600 hover:underline">
                    {name}
                  </Link>
                </TableCell>
                <TableCell>{it.stage || '—'}</TableCell>
                <TableCell>{(it as any).function || '—'}</TableCell>
                <TableCell>{(it as any).owner || '—'}</TableCell>
                <TableCell>{(it as any).version || '—'}</TableCell>
                <TableCell>{(it as any).last_used ? formatDate((it as any).last_used) : '—'}</TableCell>
                <TableCell>{(it as any).linked_ventures?.length ?? '—'}</TableCell>
                <TableCell>{(it as any).effectiveness_score ?? '—'}</TableCell>
                <TableCell>{it.updated_at ? formatDate(it.updated_at) : '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

