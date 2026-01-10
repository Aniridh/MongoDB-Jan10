import React from 'react';

export type Goal = 'RISKS' | 'IMPLEMENTABLE' | 'API_CONTRACT' | 'TEST_PLAN' | 'DECISION';

interface GoalSelectorProps {
  goal: Goal;
  onGoalChange: (goal: Goal) => void;
  disabled?: boolean;
}

const GOALS: Array<{ value: Goal; label: string; icon: React.ReactNode; helpText: string }> = [
  {
    value: 'RISKS',
    label: 'RISKS',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    helpText: 'Scan this artifact for failure modes and risks.',
  },
  {
    value: 'IMPLEMENTABLE',
    label: 'IMPLEMENTABLE',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    helpText: 'Check if the design has all details needed for implementation.',
  },
  {
    value: 'API_CONTRACT',
    label: 'API_CONTRACT',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    helpText: 'Turn this into endpoints, schemas, and error codes.',
  },
  {
    value: 'TEST_PLAN',
    label: 'TEST_PLAN',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    helpText: 'Generate unit, integration, and load test scenarios.',
  },
  {
    value: 'DECISION',
    label: 'DECISION',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    helpText: 'Recommend a decision with options, trade-offs, and rationale.',
  },
];

export function GoalSelector({ goal, onGoalChange, disabled = false }: GoalSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-3 tracking-wide">
          Analysis Goal
        </label>
        {/* Pill-based segmented control */}
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const isSelected = goal === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => !disabled && onGoalChange(g.value)}
                disabled={disabled}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${
                    isSelected
                      ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] backdrop-blur-sm'
                      : 'bg-slate-800/50 border-2 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className={isSelected ? 'text-cyan-400' : 'text-slate-500'}>
                  {g.icon}
                </span>
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>
        {/* Helper text */}
        <p className="mt-2.5 text-xs text-slate-400 italic">
          {GOALS.find((g) => g.value === goal)?.helpText}
        </p>
      </div>
    </div>
  );
}
