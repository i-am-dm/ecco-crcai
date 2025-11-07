import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ideaFormSchema, type IdeaFormInput } from '@/lib/schemas/idea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const scoringFieldMeta = [
  { key: 'overall', label: 'Overall score' },
  { key: 'market', label: 'Market' },
  { key: 'team', label: 'Team' },
  { key: 'tech', label: 'Technology' },
  { key: 'timing', label: 'Timing' },
] as const;
type ScoreFieldKey = (typeof scoringFieldMeta)[number]['key'];

interface IdeaFormProps {
  onSubmit: (data: IdeaFormInput) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<IdeaFormInput>;
}

export function IdeaForm({ onSubmit, isSubmitting, defaultValues }: IdeaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IdeaFormInput>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title (Optional) */}
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Title (Optional)
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          className="
            w-full
            px-3 py-2
            text-sm
            bg-white dark:bg-slate-900
            border border-slate-300 dark:border-slate-700
            rounded-lg
            focus:ring-2 focus:ring-brand-500 focus:border-transparent
            placeholder:text-slate-400
          "
          placeholder="Give your idea a catchy title"
        />
        {errors.title && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.title.message}</p>
        )}
      </div>

      {/* Theme (Required) */}
      <div className="space-y-1">
        <label htmlFor="theme" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Theme <span className="text-red-500">*</span>
        </label>
        <input
          id="theme"
          type="text"
          {...register('theme')}
          className="
            w-full
            px-3 py-2
            text-sm
            bg-white dark:bg-slate-900
            border border-slate-300 dark:border-slate-700
            rounded-lg
            focus:ring-2 focus:ring-brand-500 focus:border-transparent
            placeholder:text-slate-400
          "
          placeholder="e.g., AI-powered sustainability tracking"
        />
        {errors.theme && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.theme.message}</p>
        )}
      </div>

      {/* Problem (Required) */}
      <div className="space-y-1">
        <label htmlFor="problem" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Problem <span className="text-red-500">*</span>
        </label>
        <textarea
          id="problem"
          rows={4}
          {...register('problem')}
          className="
            w-full
            px-3 py-2
            text-sm
            bg-white dark:bg-slate-900
            border border-slate-300 dark:border-slate-700
            rounded-lg
            focus:ring-2 focus:ring-brand-500 focus:border-transparent
            placeholder:text-slate-400
          "
          placeholder="What problem does this solve? Who experiences this problem?"
        />
        {errors.problem && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.problem.message}</p>
        )}
      </div>

      {/* Market (Required) */}
      <div className="space-y-1">
        <label htmlFor="market" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Market <span className="text-red-500">*</span>
        </label>
        <textarea
          id="market"
          rows={4}
          {...register('market')}
          className="
            w-full
            px-3 py-2
            text-sm
            bg-white dark:bg-slate-900
            border border-slate-300 dark:border-slate-700
            rounded-lg
            focus:ring-2 focus:ring-brand-500 focus:border-transparent
            placeholder:text-slate-400
          "
          placeholder="Who is the target market? Market size? Competition?"
        />
        {errors.market && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.market.message}</p>
        )}
      </div>

      {/* Team (Required) */}
      <div className="space-y-1">
        <label htmlFor="team" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Team <span className="text-red-500">*</span>
        </label>
        <textarea
          id="team"
          rows={4}
          {...register('team')}
          className="
            w-full
            px-3 py-2
            text-sm
            bg-white dark:bg-slate-900
            border border-slate-300 dark:border-slate-700
            rounded-lg
            focus:ring-2 focus:ring-brand-500 focus:border-transparent
            placeholder:text-slate-400
          "
          placeholder="Who would build this? Skills needed? Available talent?"
        />
        {errors.team && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.team.message}</p>
        )}
      </div>

      {/* Tech (Required) */}
      <div className="space-y-1">
        <label htmlFor="tech" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Technology <span className="text-red-500">*</span>
        </label>
        <textarea
          id="tech"
          rows={4}
          {...register('tech')}
          className="
            w-full
            px-3 py-2
            text-sm
            bg-white dark:bg-slate-900
            border border-slate-300 dark:border-slate-700
            rounded-lg
            focus:ring-2 focus:ring-brand-500 focus:border-transparent
            placeholder:text-slate-400
          "
          placeholder="Technical approach? Feasibility? Key technical risks?"
        />
        {errors.tech && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.tech.message}</p>
        )}
      </div>

      {/* Description (Optional) */}
      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Additional Notes (Optional)
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="
            w-full
            px-3 py-2
            text-sm
            bg-white dark:bg-slate-900
            border border-slate-300 dark:border-slate-700
            rounded-lg
            focus:ring-2 focus:ring-brand-500 focus:border-transparent
            placeholder:text-slate-400
          "
          placeholder="Any other context or details..."
        />
        {errors.description && (
          <p className="text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Optional scoring */}
      <details className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4">
        <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700 dark:text-slate-200">
          Optional: Add screening scores now
        </summary>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Fill these in if the idea has already been scored. You can always update scores later from the idea detail page.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scoringFieldMeta.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {label}
              </label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                  placeholder="0 - 10"
                  {...register(`score.${key}` as const, { valueAsNumber: true })}
                  className="
                    w-full
                    px-3 py-2
                  text-sm
                  bg-white dark:bg-slate-900
                  border border-slate-300 dark:border-slate-700
                  rounded-lg
                  focus:ring-2 focus:ring-brand-500 focus:border-transparent
                  placeholder:text-slate-400
                "
              />
              {errors.score?.[key as ScoreFieldKey] && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.score?.[key as ScoreFieldKey]?.message as string}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Scoring notes
          </label>
          <textarea
            rows={3}
            placeholder="Reasoning, risks, or next steps..."
            {...register('score.notes')}
            className="
              w-full
              px-3 py-2
              text-sm
              bg-white dark:bg-slate-900
              border border-slate-300 dark:border-slate-700
              rounded-lg
              focus:ring-2 focus:ring-brand-500 focus:border-transparent
              placeholder:text-slate-400
            "
          />
          {errors.score?.notes && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.score.notes.message}</p>
          )}
        </div>
      </details>

      {/* Submit Button */}
      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isSubmitting ? 'Submitting...' : 'Submit Idea'}</span>
        </Button>
        <Button type="button" variant="ghost" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
