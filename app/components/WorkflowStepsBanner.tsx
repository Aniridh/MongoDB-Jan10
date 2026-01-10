import React from 'react';

interface WorkflowStepsBannerProps {
  isLoading: boolean;
  isComplete: boolean;
}

interface Step {
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    label: 'Step 1: Tool Scan',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Step 2: Agent Debate',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Step 3: Decision Logged',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export function WorkflowStepsBanner({ isLoading, isComplete }: WorkflowStepsBannerProps) {
  if (!isLoading && !isComplete) {
    return null;
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-xl p-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
      <div className="flex items-center justify-around gap-4">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          // When loading: only step 1 is active with spinner, others are dimmed
          // When complete: all steps are active with checkmarks
          const isActive = isComplete || (isLoading && stepNumber === 1);
          const isPending = isLoading && stepNumber > 1;
          const showSpinner = isLoading && stepNumber === 1 && !isComplete;
          const showCheckmark = isComplete;

          return (
            <div
              key={index}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full
                ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                    : 'bg-slate-800/30 text-slate-500 border border-white/5'
                }
                transition-all
              `}
            >
              {showSpinner ? (
                <svg
                  className="animate-spin h-4 w-4 text-cyan-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : showCheckmark ? (
                <span className="text-emerald-400 font-bold">✓</span>
              ) : (
                <span className={isPending ? 'text-slate-600' : 'text-slate-500'}>
                  {step.icon}
                </span>
              )}
              <span className="text-sm font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
