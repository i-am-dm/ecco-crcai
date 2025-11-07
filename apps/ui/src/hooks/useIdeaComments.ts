import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Comment, CommentListResponse, NewCommentRequest } from '@/types/api';

export function useIdeaComments(ideaId?: string) {
  return useQuery({
    queryKey: ['idea-comments', ideaId],
    enabled: !!ideaId,
    queryFn: async () => {
      if (!ideaId) {
        throw new Error('Idea id is required to load comments');
      }
      const { data, error } = await api.GET('/v1/ideas/{ideaId}/comments', {
        params: { path: { ideaId } },
      });
      if (error) {
        throw new Error(`Failed to load comments: ${error}`);
      }
      const resp = data as CommentListResponse;
      return resp.items ?? [];
    },
    staleTime: 30_000,
  });
}

export function useAddIdeaComment(ideaId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewCommentRequest) => {
      if (!ideaId) {
        throw new Error('Idea id is required to add comments');
      }
      const { data, error } = await api.POST('/v1/ideas/{ideaId}/comments', {
        params: { path: { ideaId } },
        body: payload,
      });
      if (error) {
        throw new Error(`Failed to add comment: ${error}`);
      }
      const resp = data as { comment: Comment };
      return resp.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea-comments', ideaId] });
    },
  });
}
