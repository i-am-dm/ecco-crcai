import { useEffect, useState } from 'react';
import type { IdeaScoring } from '@/types/idea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface IdeaScoringEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialScore?: IdeaScoring;
  onSave: (score: IdeaScoring) => Promise<void> | void;
  isSaving?: boolean;
}

const scoreFields = [
  { key: 'overall', label: 'Overall' },
  { key: 'market', label: 'Market' },
  { key: 'team', label: 'Team' },
  { key: 'tech', label: 'Technology' },
  { key: 'timing', label: 'Timing' },
] as const;

type FieldKey = (typeof scoreFields)[number]['key'];

type MutableScore = Partial<Record<FieldKey, number>> & { notes?: string };

function normalizeScore(score: MutableScore): IdeaScoring {
  const normalized: IdeaScoring = { ...score } as IdeaScoring;
  const numericKeys: FieldKey[] = ['overall', 'market', 'team', 'tech', 'timing'];
  for (const key of numericKeys) {
    const value = score[key];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      normalized[key] = Number(value.toFixed(1));
    }
  }
  if (normalized.overall === undefined) {
    const provided = numericKeys
      .filter((key) => key !== 'overall')
      .map((key) => normalized[key])
      .filter((value): value is number => typeof value === 'number');
    if (provided.length > 0) {
      const avg = provided.reduce((sum, value) => sum + value, 0) / provided.length;
      normalized.overall = Number(avg.toFixed(1));
    }
  }
  if (typeof score.notes === 'string' && score.notes.trim().length > 0) {
    normalized.notes = score.notes.trim();
  } else {
    delete normalized.notes;
  }
  return normalized;
}

export function IdeaScoringEditor({ open, onOpenChange, initialScore, onSave, isSaving }: IdeaScoringEditorProps) {
  const [score, setScore] = useState<MutableScore>(() => ({ ...initialScore }));

  useEffect(() => {
    setScore({ ...initialScore });
  }, [initialScore, open]);

  const handleChange = (key: FieldKey, value: string) => {
    const numeric = Number(value);
    setScore((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : undefined }));
  };

  const handleSubmit = async () => {
    const normalized = normalizeScore(score);
    await onSave(normalized);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update screening score</DialogTitle>
          <DialogDescription>
            Score the idea across each criterion (0&ndash;10). Leave Overall blank to auto-average the other scores.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {scoreFields.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {label}
              </label>
              <div className="mt-1 flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={score[key] ?? ''}
                  onChange={(event) => handleChange(key, event.target.value)}
                  placeholder="0 - 10"
                />
                <span className="text-xs text-slate-400">/ 10</span>
              </div>
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder="Add any context or reasoning..."
              value={score.notes ?? ''}
              onChange={(event) => setScore((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save score'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
