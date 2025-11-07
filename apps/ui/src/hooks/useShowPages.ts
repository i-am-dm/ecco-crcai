import { useQuery } from '@tanstack/react-query';
import { apiHelpers } from '@/lib/api';

export interface ShowPageSnapshot {
  id: string;
  entity: 'show_page';
  env: string;
  schema_version: string;
  updated_at: string;
  venture_id: string;
  title: string;
  tagline?: string;
  hero_image?: string;
  metrics?: Array<{ label: string; value: string; trend?: string }>;
  highlights?: Array<{ title: string; description: string; date?: string }>;
  team?: Array<{ name: string; role: string; bio?: string; avatar?: string }>;
  cta?: { label?: string; url?: string };
  published?: boolean;
  [key: string]: any;
}

export function useShowPages() {
  return useQuery({
    queryKey: ['show_pages'],
    queryFn: async () => {
      const response = await apiHelpers.listEntities('show_page');
      return (response as any)?.items ?? [];
    },
  });
}

export function useShowPage(id: string) {
  return useQuery<ShowPageSnapshot | null>({
    queryKey: ['show_page', id],
    queryFn: async () => {
      try {
        const response = await apiHelpers.getEntity('show_page', id);
        const snapshot = (response as any)?.data || response;
        return snapshot as ShowPageSnapshot;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });
}
