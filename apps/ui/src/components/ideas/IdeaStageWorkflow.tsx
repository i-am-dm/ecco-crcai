import type { IdeaStage } from '@/types/idea';
import { Check } from 'lucide-react';

interface IdeaStageWorkflowProps {
  currentStage?: IdeaStage;
  className?: string;
}

const stages: IdeaStage[] = ['Idea', 'Validation', 'Build', 'Launch', 'Scale', 'Spin-Out'];

export function IdeaStageWorkflow({ currentStage = 'Idea', className = '' }: IdeaStageWorkflowProps) {
  const currentIndex = stages.indexOf(currentStage);

  const getStageStatus = (index: number) => {
    if (index < currentIndex) return 'complete';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className={`${className}`}>
      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
        Stage Progression
      </div>

      {/* Desktop view - horizontal stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            const isComplete = status === 'complete';
            const isCurrent = status === 'current';

            return (
              <div key={stage} className="flex items-center flex-1 last:flex-none">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      h-10 w-10
                      rounded-full
                      flex items-center justify-center
                      transition-all duration-300
                      ${
                        isComplete
                          ? 'bg-accent-600 dark:bg-accent-500'
                          : isCurrent
                          ? 'bg-brand-600 dark:bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-900/40'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }
                    `}
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <div
                        className={`
                          h-3 w-3 rounded-full
                          ${
                            isCurrent
                              ? 'bg-white'
                              : 'bg-slate-400 dark:bg-slate-500'
                          }
                        `}
                      />
                    )}
                  </div>
                  <div
                    className={`
                      mt-2 text-xs font-medium whitespace-nowrap
                      ${
                        isCurrent
                          ? 'text-brand-700 dark:text-brand-300'
                          : isComplete
                          ? 'text-accent-700 dark:text-accent-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }
                    `}
                  >
                    {stage}
                  </div>
                </div>

                {/* Connector line */}
                {index < stages.length - 1 && (
                  <div
                    className={`
                      h-0.5 flex-1 mx-2
                      transition-all duration-300
                      ${
                        isComplete
                          ? 'bg-accent-600 dark:bg-accent-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile view - vertical stepper */}
      <div className="md:hidden space-y-4">
        {stages.map((stage, index) => {
          const status = getStageStatus(index);
          const isComplete = status === 'complete';
          const isCurrent = status === 'current';
          const isLast = index === stages.length - 1;

          return (
            <div key={stage} className="flex gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    h-8 w-8
                    rounded-full
                    flex items-center justify-center
                    transition-all duration-300
                    ${
                      isComplete
                        ? 'bg-accent-600 dark:bg-accent-500'
                        : isCurrent
                        ? 'bg-brand-600 dark:bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-900/40'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }
                  `}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <div
                      className={`
                        h-2.5 w-2.5 rounded-full
                        ${
                          isCurrent
                            ? 'bg-white'
                            : 'bg-slate-400 dark:bg-slate-500'
                        }
                      `}
                    />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`
                      w-0.5 h-12 mt-2
                      transition-all duration-300
                      ${
                        isComplete
                          ? 'bg-accent-600 dark:bg-accent-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }
                    `}
                  />
                )}
              </div>

              {/* Stage label */}
              <div className="flex-1 pt-1">
                <div
                  className={`
                    text-sm font-medium
                    ${
                      isCurrent
                        ? 'text-brand-700 dark:text-brand-300'
                        : isComplete
                        ? 'text-accent-700 dark:text-accent-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  {stage}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
