import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { ShowPageSnapshot } from '@/hooks/useShowPages';

interface ShowPageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ShowPageSnapshot | null;
  onSave: (payload: Partial<ShowPageSnapshot>) => Promise<void>;
  isSaving?: boolean;
}

export function ShowPageEditor({ open, onOpenChange, initial, onSave, isSaving }: ShowPageEditorProps) {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [hero, setHero] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [metricLabel, setMetricLabel] = useState('MRR');
  const [metricValue, setMetricValue] = useState('');
  const [highlightTitle, setHighlightTitle] = useState('');
  const [highlightDescription, setHighlightDescription] = useState('');
  const [published, setPublished] = useState(false);

  useEffect(() => {
    setTitle(initial?.title || '');
    setTagline(initial?.tagline || '');
    setHero(initial?.hero_image || '');
    setPublished(Boolean(initial?.published));
    setCtaLabel(initial?.cta?.label || '');
    setCtaUrl(initial?.cta?.url || '');
    const primaryMetric = initial?.metrics?.[0];
    setMetricLabel(primaryMetric?.label || 'MRR');
    setMetricValue(primaryMetric?.value || '');
    const primaryHighlight = initial?.highlights?.[0];
    setHighlightTitle(primaryHighlight?.title || '');
    setHighlightDescription(primaryHighlight?.description || '');
  }, [initial, open]);

  const handleSave = async () => {
    await onSave({
      title,
      tagline,
      hero_image: hero || undefined,
      published,
      cta: { label: ctaLabel || undefined, url: ctaUrl || undefined },
      metrics: metricValue ? [{ label: metricLabel, value: metricValue }] : [],
      highlights: highlightTitle && highlightDescription ? [{ title: highlightTitle, description: highlightDescription }] : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Show Page</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Tagline</label>
            <Textarea value={tagline} onChange={(e) => setTagline(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Hero Image URL</label>
            <Input value={hero} onChange={(e) => setHero(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="CTA label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
            <Input placeholder="CTA URL" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Metric label" value={metricLabel} onChange={(e) => setMetricLabel(e.target.value)} />
            <Input placeholder="Metric value" value={metricValue} onChange={(e) => setMetricValue(e.target.value)} />
          </div>
          <div>
            <Input placeholder="Highlight title" value={highlightTitle} onChange={(e) => setHighlightTitle(e.target.value)} className="mb-2" />
            <Textarea placeholder="Highlight description" value={highlightDescription} onChange={(e) => setHighlightDescription(e.target.value)} rows={3} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="rounded" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Published
          </label>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
