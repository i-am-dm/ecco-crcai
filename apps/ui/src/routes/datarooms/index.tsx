import { useMemo, useState } from 'react';
import { Shield, FolderLock, Users2, Activity } from 'lucide-react';
import { useDataRooms, useDataRoom } from '@/hooks/useDataRooms';
import type { DataRoom } from '@/types/api';
import { formatDate } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  open: 'Open',
  archived: 'Archived',
};

export function DataRoomsPage() {
  const { data: datarooms = [], isLoading, error } = useDataRooms();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: selectedRoom, isFetching: detailLoading } = useDataRoom(selectedId ?? undefined);

  const filteredRooms = useMemo(() => {
    return datarooms.filter((room) => (statusFilter === 'all' ? true : (room.status || '').toLowerCase() === statusFilter));
  }, [datarooms, statusFilter]);

  const summary = useMemo(() => {
    const active = datarooms.filter((room) => (room.status || '').toLowerCase() === 'active').length;
    const pendingRequests = datarooms.reduce((sum, room) => sum + (room.openRequests || 0), 0);
    const lastAccess = datarooms
      .map((room) => (room.lastAccessed ? Date.parse(room.lastAccessed) : 0))
      .reduce((max, value) => Math.max(max, value), 0);
    return { active, pendingRequests, lastAccess };
  }, [datarooms]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FolderLock className="w-10 h-10 text-brand-600 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Loading data rooms…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-6">
          <p className="text-red-700 dark:text-red-300 font-semibold mb-1">Unable to load data rooms</p>
          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-brand-600 uppercase tracking-widest">FR-36 Virtual Data Rooms</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Deal Rooms & Access Logs</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Monitor which investors have access, outstanding documents, and audit trails for each room.
        </p>
      </div>

      <SummaryCards summary={summary} />

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="open">Open</option>
          <option value="archived">Archived</option>
        </select>
        <p className="text-sm text-slate-500">{filteredRooms.length} dataroom(s)</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <DataRoomTable rooms={filteredRooms} selectedId={selectedId} onSelect={setSelectedId} />
        <DataRoomDetail room={selectedRoom} isLoading={detailLoading} />
      </div>
    </div>
  );
}

function SummaryCards({ summary }: { summary: { active: number; pendingRequests: number; lastAccess: number } }) {
  const cards = [
    {
      label: 'Active Rooms',
      value: summary.active,
      icon: FolderLock,
      caption: 'Accepting investor traffic',
    },
    {
      label: 'Open Requests',
      value: summary.pendingRequests,
      icon: Users2,
      caption: 'Docs or permissions awaiting action',
    },
    {
      label: 'Last Access',
      value: summary.lastAccess ? formatDate(new Date(summary.lastAccess).toISOString()) : 'N/A',
      icon: Activity,
      caption: 'Most recent investor download',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-600">
            <card.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-slate-500">{card.caption}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DataRoomTable({
  rooms,
  selectedId,
  onSelect,
}: {
  rooms: DataRoom[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (rooms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-500">No datarooms available. Create one from the fundraising pipeline.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold uppercase tracking-widest text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Venture</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Documents</th>
            <th className="px-4 py-3 text-left">Requests</th>
            <th className="px-4 py-3 text-left">Last Access</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rooms.map((room) => (
            <tr
              key={room.id}
              onClick={() => onSelect(room.id)}
              className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                selectedId === room.id ? 'bg-brand-50/60 dark:bg-brand-500/10' : ''
              }`}
            >
              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{room.title}</td>
              <td className="px-4 py-3">{room.ventureId || '—'}</td>
              <td className="px-4 py-3 capitalize">{STATUS_LABELS[room.status?.toLowerCase() || ''] || room.status || 'Unknown'}</td>
              <td className="px-4 py-3">{room.docCount ?? 0}</td>
              <td className="px-4 py-3">{room.openRequests ?? 0}</td>
              <td className="px-4 py-3">{room.lastAccessed ? formatDate(room.lastAccessed) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataRoomDetail({ room, isLoading }: { room?: DataRoom; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <p className="text-sm text-slate-500">Loading data room…</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-500">Select a data room to view documents and access logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-brand-600" />
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{room.title}</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">{room.status}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500">Venture: {room.ventureId || 'Unknown'}</p>
        <p className="text-sm text-slate-500">Last access: {room.lastAccessed ? formatDate(room.lastAccessed) : '—'}</p>
      </div>

      {room.documents && room.documents.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Documents</p>
          {room.documents.map((doc) => (
            <div key={doc.id} className="border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 text-sm">
              <div className="font-medium text-slate-900 dark:text-white">{doc.title}</div>
              <div className="text-xs text-slate-500">
                {doc.category} · {doc.type?.toUpperCase()} · Updated {doc.updatedAt ? formatDate(doc.updatedAt) : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}

      {room.permissions && room.permissions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Permissions</p>
          {room.permissions.map((perm) => (
            <div key={`${room.id}-${perm.investorId}`} className="text-sm border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{perm.name}</p>
                <p className="text-xs text-slate-500">{perm.level}</p>
              </div>
              <div className="text-xs text-slate-500">
                {perm.expiresAt ? `Expires ${formatDate(perm.expiresAt)}` : 'No expiry'}
              </div>
            </div>
          ))}
        </div>
      )}

      {room.accessLogs && room.accessLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Recent Activity</p>
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {room.accessLogs.map((log, index) => (
              <div key={`${room.id}-${log.timestamp}-${index}`} className="text-sm border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
                <div className="font-medium text-slate-900 dark:text-white">
                  {log.user} <span className="text-xs text-slate-500">@ {log.organization}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {log.action} {log.documentId ? `• ${log.documentId}` : ''} · {formatDate(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
