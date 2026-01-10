import React, { useState } from 'react';
import type { Decision } from '@/types';
import { type Goal } from './GoalSelector';

interface DecisionHistoryPanelProps {
  decisions: Decision[];
  isLoading: boolean;
  currentGoal?: Goal;
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getGoalTag(goal?: Goal): string | null {
  if (!goal) return null;
  const tags: Record<Goal, string> = {
    RISKS: 'Risks',
    IMPLEMENTABLE: 'Implementation',
    API_CONTRACT: 'API',
    TEST_PLAN: 'Testing',
    DECISION: 'Decision',
  };
  return tags[goal];
}

export function DecisionHistoryPanel({
  decisions,
  isLoading,
  currentGoal,
}: DecisionHistoryPanelProps) {
  const [expandedDecisions, setExpandedDecisions] = useState<Set<number>>(new Set());

  const toggleDecision = (index: number) => {
    const newExpanded = new Set(expandedDecisions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDecisions(newExpanded);
  };

  if (!decisions.length && !isLoading) {
    return null;
  }

  // Most recent first
  const sortedDecisions = [...decisions].reverse();

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/10 p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      <h2 className="text-lg font-semibold text-cyan-300 mb-3 tracking-wide">
        Decision History (Timeline)
      </h2>
      <div className="bg-slate-900/70 border border-white/10 rounded-xl p-4 min-h-[150px] max-h-[350px] overflow-y-auto space-y-3 backdrop-blur-sm">
        {isLoading && !decisions.length ? (
          <div className="space-y-3">
            <div className="h-4 bg-slate-800/50 rounded animate-pulse"></div>
            <div className="h-3 bg-slate-800/50 rounded animate-pulse w-2/3"></div>
          </div>
        ) : sortedDecisions.length > 0 ? (
          sortedDecisions.map((decision, index) => {
            const isLatest = index === 0;
            const isExpanded = expandedDecisions.has(sortedDecisions.length - 1 - index);

            return (
              <div
                key={index}
                className={`
                  border rounded-xl p-4 transition-all cursor-pointer
                  ${
                    isLatest
                      ? 'bg-cyan-950/30 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/30 border-white/10 hover:bg-slate-900/50'
                  }
                `}
                onClick={() => toggleDecision(sortedDecisions.length - 1 - index)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {isLatest && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                          Latest
                        </span>
                      )}
                      {currentGoal && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800/50 text-slate-400 border border-white/10">
                          {getGoalTag(currentGoal)}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto">
                        {formatTimestamp(decision.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-200">
                        {decision.summary}
                      </span>
                      <span className="text-xs text-slate-500">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pl-4 border-l-2 border-cyan-400/50 bg-cyan-950/30 rounded-r-lg p-3 backdrop-blur-sm">
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {decision.rationale}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500 italic">
            No decisions recorded yet. Run an analysis to create the first one.
          </p>
        )}
      </div>
    </div>
  );
}
