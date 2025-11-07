import { useQuery } from '@tanstack/react-query';
import api, { rawGet } from '@/lib/api';
import type { Idea, IdeaListFilters } from '@/types/idea';
import { normaliseResearchDocs } from '@/lib/researchDocs';
import { normalizeIdeaRecord } from '@/lib/ideaNormalizer';

type IdeaIndexType = 'status' | 'stage';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function scoreBucket(value: number): string {
  const bounded = Math.max(0, Math.min(10, value));
  const bucket = Math.floor(bounded);
  return bucket.toString().padStart(2, '0');
}

function dedupeRecords(items: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const item of items) {
    const id = item?.id;
    if (!id || typeof id !== 'string') continue;
    const existing = map.get(id);
    if (!existing) {
      map.set(id, item);
      continue;
    }
    const existingUpdated = Date.parse(existing?.updated_at || existing?.updatedAt || 0);
    const nextUpdated = Date.parse(item?.updated_at || item?.updatedAt || 0);
    if (nextUpdated > existingUpdated) {
      map.set(id, item);
    }
  }
  return map;
}

async function fetchIdeasByIndex(type: IdeaIndexType, label: string) {
  const slug = slugify(label);
  const { items = [] } = await rawGet(`/v1/index/ideas/by-${type}/${slug}`);
  return dedupeRecords(items);
}

async function fetchIdeasByScore(minScore: number) {
  const bounded = Math.max(0, Math.min(10, minScore));
  const minBucket = Math.floor(bounded);
  const bucketValues: string[] = [];
  for (let bucket = minBucket; bucket <= 10; bucket++) {
    bucketValues.push(scoreBucket(bucket));
  }

  const responses = await Promise.all(
    bucketValues.map(async (bucket) => {
      try {
        const { items = [] } = await rawGet(`/v1/index/ideas/by-score/${bucket}`);
        return items;
      } catch {
        return [];
      }
    }),
  );

  const merged = responses.flat();
  const deduped = dedupeRecords(merged);

  const filtered = new Map<string, any>();
  for (const [id, item] of deduped.entries()) {
    const score =
      typeof item?.score === 'number'
        ? item.score
        : typeof item?.score?.overall === 'number'
          ? item.score.overall
          : undefined;
    if (typeof score === 'number' && score >= minScore) {
      filtered.set(id, item);
    }
  }

  return filtered;
}

/**
 * Hook to list ideas with optional filtering
 */
export function useIdeas(filters?: IdeaListFilters) {
  return useQuery({
    queryKey: ['ideas', filters],
    queryFn: async () => {
      const indexedResult = await resolveIndexedIdeas(filters);

      let sourceItems: any[];
      if (indexedResult === null) {
        const { data, error } = await api.GET('/v1/{entity}', {
          params: {
            path: { entity: 'idea' },
          },
        });

        if (error) {
          throw new Error(`Failed to fetch ideas: ${error}`);
        }

        sourceItems = (data as any)?.items || [];
      } else {
        sourceItems = indexedResult;
      }

      // Map to Idea type
      let ideas: Idea[] = sourceItems.map((item: any) => ({
        ...normalizeIdeaRecord(item),
        researchDocs: normaliseResearchDocs(item.researchDocs || item.research_docs),
      }));

      // Apply client-side filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          ideas = ideas.filter((idea) => idea.status === filters.status);
        }

        if (filters.stage && filters.stage !== 'all') {
          ideas = ideas.filter((idea) => idea.stage === filters.stage);
        }

        if (filters.minScore !== undefined) {
          ideas = ideas.filter((idea) => {
            const overallScore = idea.score?.overall;
            return overallScore !== undefined && overallScore >= filters.minScore!;
          });
        }

        // Apply sorting
        if (filters.sortBy) {
          ideas.sort((a, b) => {
            let comparison = 0;

            switch (filters.sortBy) {
              case 'score':
                const scoreA = a.score?.overall || 0;
                const scoreB = b.score?.overall || 0;
                comparison = scoreB - scoreA; // Descending by default
                break;
              case 'date':
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                comparison = dateB - dateA; // Newest first by default
                break;
              case 'status':
                comparison = (a.status || '').localeCompare(b.status || '');
                break;
            }

            return filters.sortOrder === 'asc' ? comparison : -comparison;
          });
        }
      }

      return ideas;
    },
    staleTime: 30000, // 30 seconds
  });
}

async function resolveIndexedIdeas(filters?: IdeaListFilters) {
  if (!filters) return null;

  const maps: Map<string, any>[] = [];

  try {
    if (filters.status && filters.status !== 'all') {
      maps.push(await fetchIdeasByIndex('status', filters.status));
    }

    if (filters.stage && filters.stage !== 'all') {
      maps.push(await fetchIdeasByIndex('stage', filters.stage));
    }

    if (typeof filters.minScore === 'number') {
      maps.push(await fetchIdeasByScore(filters.minScore));
    }
  } catch {
    return null;
  }

  if (maps.length === 0) {
    return null;
  }

  if (maps.some((map) => map.size === 0)) {
    return [];
  }

  let intersection = new Set(maps[0].keys());
  for (const map of maps.slice(1)) {
    intersection = new Set([...intersection].filter((id) => map.has(id)));
    if (intersection.size === 0) {
      return [];
    }
  }

  const orderedIds = Array.from(intersection);
  const sourceMaps = maps;

  return orderedIds.map((id) => {
    for (const map of sourceMaps) {
      const item = map.get(id);
      if (item) return item;
    }
    return undefined;
  }).filter(Boolean) as any[];
}
