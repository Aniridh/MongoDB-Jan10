import React from 'react';
import { type Goal } from './GoalSelector';

interface ToolOutputPanelProps {
  goal: Goal;
  toolReport: string | null;
  isLoading: boolean;
}

function getToolOutputTitle(goal: Goal): string {
  const titles: Record<Goal, string> = {
    RISKS: 'Risk Scan',
    IMPLEMENTABLE: 'Implementation Checklist',
    API_CONTRACT: 'Contract Check',
    TEST_PLAN: 'Tool Output',
    DECISION: 'Context & Constraints',
  };
  return titles[goal];
}

export function ToolOutputPanel({ goal, toolReport, isLoading }: ToolOutputPanelProps) {
  if (!toolReport && !isLoading) {
    return null;
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/10 p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      <h2 className="text-lg font-semibold text-cyan-300 mb-3 tracking-wide">
        {getToolOutputTitle(goal)}
      </h2>
      <div className="bg-slate-900/70 border border-white/10 rounded-xl p-4 min-h-[150px] max-h-[250px] overflow-y-auto backdrop-blur-sm">
        {isLoading && !toolReport ? (
          <div className="space-y-2">
            <div className="h-4 bg-slate-800/50 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-800/50 rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-slate-800/50 rounded animate-pulse w-4/6"></div>
          </div>
        ) : toolReport ? (
          <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border-l-2 border-cyan-400/30 pl-4">
            {toolReport}
          </pre>
        ) : (
          <p className="text-sm text-slate-500 italic">Working...</p>
        )}
      </div>
    </div>
  );
}
