import { useNavigate } from 'react-router-dom';
import { useCreateIdea } from '@/hooks/useCreateIdea';
import { IdeaForm } from '@/components/ideas/IdeaForm';
import type { IdeaFormInput } from '@/lib/schemas/idea';
import { ArrowLeft } from 'lucide-react';

export function NewIdeaPage() {
  const navigate = useNavigate();
  const createIdea = useCreateIdea();

  const handleSubmit = async (data: IdeaFormInput) => {
    try {
      const result = await createIdea.mutateAsync(data);
      // Navigate to the newly created idea
      navigate(`/ideas/${result.id}`);
    } catch (error) {
      console.error('Failed to create idea:', error);
      // Error is handled by the mutation
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/ideas')}
          className="
            inline-flex items-center gap-2
            text-sm text-brand-600 dark:text-brand-400
            hover:text-brand-700 dark:hover:text-brand-300
            transition-colors
          "
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ideas</span>
        </button>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Submit New Idea
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Share your venture idea with the studio. Fill out all required fields below.
        </p>
      </div>

      {/* Form card */}
      <div className="
        rounded-2xl
        bg-white dark:bg-slate-900
        border border-slate-200/70 dark:border-slate-700/60
        shadow-subtle
        p-8
      ">
        <IdeaForm
          onSubmit={handleSubmit}
          isSubmitting={createIdea.isPending}
        />

        {/* Error message */}
        {createIdea.error && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              Failed to submit idea. Please try again.
            </p>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Tips for a strong idea submission
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Be specific about the problem and who experiences it</li>
          <li>Provide market size estimates and competitive analysis</li>
          <li>Identify the skills and team members needed</li>
          <li>Explain the technical approach and feasibility</li>
          <li>Consider timing - why now is the right time</li>
        </ul>
      </div>
    </div>
  );
}
