import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Paperclip, Send, X } from 'lucide-react';
import { useIdeaComments, useAddIdeaComment } from '@/hooks/useIdeaComments';
import type { CommentAttachment } from '@/types/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface IdeaCommentsPanelProps {
  ideaId: string;
  ideaTitle?: string;
}

export function IdeaCommentsPanel({ ideaId, ideaTitle }: IdeaCommentsPanelProps) {
  const { data: comments = [], isLoading, error } = useIdeaComments(ideaId);
  const addComment = useAddIdeaComment(ideaId);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<CommentAttachment[]>([]);
  const [attachmentDraft, setAttachmentDraft] = useState<CommentAttachment>({ title: '', url: '' });

  const handleAddAttachment = () => {
    if (!attachmentDraft.url?.trim()) return;
    if (attachments.length >= 5) return;
    setAttachments((prev) => [...prev, { title: attachmentDraft.title?.trim(), url: attachmentDraft.url.trim() }]);
    setAttachmentDraft({ title: '', url: '' });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({
        message: trimmed,
        attachments: attachments.length ? attachments : undefined,
        authorName: undefined,
      });
      setMessage('');
      setAttachments([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand-500" />
          <CardTitle>Collaboration</CardTitle>
        </div>
        <CardDescription>
          Share context, attach supporting docs, and notify the #venture-pipeline Slack channel when updates land.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          {isLoading && <CommentsSkeleton />}
          {!isLoading && error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load comments. Please retry or contact an admin.
            </p>
          )}
          {!isLoading && !error && comments.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No comments yet. Kick off the thread to keep stakeholders aligned.
            </p>
          )}
          {!isLoading && !error && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <article
                  key={comment.id}
                  className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-900/40 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {comment.author_name || comment.author_email || 'Unknown contributor'}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {comment.message}
                  </p>
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {comment.attachments.map((attachment, idx) => (
                        <a
                          key={`${comment.id}-att-${idx}`}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span>{attachment.title || attachment.url}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={`Comment on ${ideaTitle ?? 'this idea'}...`}
              className="min-h-[120px] resize-vertical"
              maxLength={4000}
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>Markdown-lite; new comments ping Slack.</span>
              <span>{message.length}/4000</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Attachments (optional)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Title"
                value={attachmentDraft.title || ''}
                onChange={(event) => setAttachmentDraft((prev) => ({ ...prev, title: event.target.value }))}
              />
              <Input
                placeholder="https://..."
                value={attachmentDraft.url || ''}
                onChange={(event) => setAttachmentDraft((prev) => ({ ...prev, url: event.target.value }))}
              />
              <Button type="button" variant="secondary" onClick={handleAddAttachment} disabled={!attachmentDraft.url}>
                Add
              </Button>
            </div>
            {attachments.length > 0 && (
              <ul className="space-y-1">
                {attachments.map((attachment, idx) => (
                  <li
                    key={`${attachment.url}-${idx}`}
                    className="flex items-center justify-between rounded-md bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate">{attachment.title || attachment.url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="ml-2 inline-flex items-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                      <span className="sr-only">Remove attachment</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {attachments.length >= 5 && (
              <p className="text-xs text-slate-500">Maximum of 5 attachments per comment.</p>
            )}
          </div>

          {addComment.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to post comment. Please try again.
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={!message.trim() || addComment.isPending}>
              {addComment.isPending ? (
                <>
                  <Send className="w-4 h-4 animate-pulse" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Post Comment</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((idx) => (
        <div key={idx} className="rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
