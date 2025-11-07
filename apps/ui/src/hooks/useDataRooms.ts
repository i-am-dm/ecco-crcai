import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';
import type {
  DataRoom,
  DataRoomDocument,
  DataRoomPermission,
  DataRoomAccessLog,
  DataRoomRequest,
  ManifestItem,
} from '@/types/api';

function normalizeDataRoomManifest(item: ManifestItem): DataRoom {
  return {
    id: item.id,
    title: item.title || item.name || item.id,
    ventureId: item.ventureId || item.venture_id,
    status: item.status,
    owner: item.owner,
    docCount: item.doc_count,
    openRequests: item.open_requests,
    lastAccessed: item.last_accessed,
  };
}

function normalizeDataRoomSnapshot(snapshot: Record<string, any>): DataRoom {
  const documents: DataRoomDocument[] = Array.isArray(snapshot.documents)
    ? snapshot.documents.map((doc: Record<string, any>) => ({
        id: doc.id || doc.document_id,
        title: doc.title,
        category: doc.category,
        type: doc.type,
        sizeMb: doc.size_mb,
        updatedAt: doc.updated_at,
        owner: doc.owner,
        tags: doc.tags,
      }))
    : [];

  const permissions: DataRoomPermission[] = Array.isArray(snapshot.permissions)
    ? snapshot.permissions.map((perm: Record<string, any>) => ({
        investorId: perm.investor_id || perm.investorId,
        name: perm.name,
        level: perm.level,
        expiresAt: perm.expires_at,
      }))
    : [];

  const accessLogs: DataRoomAccessLog[] = Array.isArray(snapshot.access_logs)
    ? snapshot.access_logs.map((log: Record<string, any>) => ({
        timestamp: log.timestamp,
        user: log.user,
        organization: log.organization,
        action: log.action,
        documentId: log.document_id,
      }))
    : [];

  const openRequests: DataRoomRequest[] = Array.isArray(snapshot.open_requests)
    ? snapshot.open_requests.map((request: Record<string, any>) => ({
        investorId: request.investor_id || request.investorId,
        type: request.type,
        description: request.description || request.details,
        status: request.status,
        dueDate: request.due_date,
      }))
    : [];

  return {
    id: snapshot.id,
    title: snapshot.title || snapshot.name || snapshot.id,
    ventureId: snapshot.venture_id || snapshot.ventureId,
    status: snapshot.status,
    owner: snapshot.owner,
    docCount: snapshot.doc_count || snapshot.documents?.length,
    openRequests: snapshot.open_requests?.length ?? snapshot.open_requests_count,
    lastAccessed: snapshot.last_accessed,
    documents,
    permissions,
    accessLogs,
    openRequestsDetail: openRequests,
  };
}

export function useDataRooms() {
  return useQuery({
    queryKey: ['datarooms'],
    queryFn: async () => {
      const response = (await apiHelpers.listEntities('dataroom')) as { items?: ManifestItem[] };
      const items = response?.items ?? [];
      return items.map(normalizeDataRoomManifest);
    },
  });
}

export function useDataRoom(id?: string) {
  return useQuery({
    queryKey: ['dataroom', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('Data room id is required');
      const response = await apiHelpers.getEntity('dataroom', id);
      const snapshot = (response as any)?.data || response;
      return normalizeDataRoomSnapshot(snapshot);
    },
  });
}
