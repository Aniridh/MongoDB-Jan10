import React from 'react';
import { type Goal } from './GoalSelector';
import type { ContractFindingsStats } from '@/types';

interface ToolOutputPanelProps {
  goal: Goal;
  toolReport: string | null;
  isLoading: boolean;
  findingsStats?: ContractFindingsStats;
  findingsRaw?: any; // For export
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

export function ToolOutputPanel({ goal, toolReport, isLoading, findingsStats, findingsRaw }: ToolOutputPanelProps) {
  if (!toolReport && !isLoading) {
    return null;
  }

  const handleExportFindings = () => {
    if (!findingsRaw) return;
    const jsonStr = JSON.stringify(findingsRaw, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-findings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/10 p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-cyan-300 tracking-wide">
          {getToolOutputTitle(goal)}
        </h2>
        <div className="flex items-center gap-2">
          {/* Findings Statistics Badge */}
          {findingsStats && findingsStats.total > 0 && (
            <>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-white/10 rounded-full">
                <span className="text-xs font-semibold text-slate-300">
                  {findingsStats.total} Finding{findingsStats.total !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1">
                  {findingsStats.bySeverity.high > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500" title={`${findingsStats.bySeverity.high} high severity`} />
                  )}
                  {findingsStats.bySeverity.medium > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title={`${findingsStats.bySeverity.medium} medium severity`} />
                  )}
                  {findingsStats.bySeverity.low > 0 && (
                    <span className="w-2 h-2 rounded-full bg-blue-500" title={`${findingsStats.bySeverity.low} low severity`} />
                  )}
                </div>
              </div>
              {findingsRaw && (
                <button
                  onClick={handleExportFindings}
                  className="px-3 py-1 text-xs font-medium text-cyan-300 bg-cyan-950/50 border border-cyan-400/30 rounded-lg hover:bg-cyan-950/70 hover:border-cyan-400/50 transition-all"
                  title="Export findings as JSON"
                >
                  Export JSON
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Severity Breakdown */}
      {findingsStats && findingsStats.total > 0 && (
        <div className="mb-3 p-3 bg-slate-800/30 border border-white/5 rounded-lg">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">Severity Breakdown</span>
            <span className="text-slate-500">
              Missing: {findingsStats.byCategory.missing} | 
              Ambiguous: {findingsStats.byCategory.ambiguous} | 
              Risk: {findingsStats.byCategory.risk}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Severity bars */}
            <div className="flex-1 flex h-2 bg-slate-900/50 rounded-full overflow-hidden">
              {findingsStats.bySeverity.high > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(findingsStats.bySeverity.high / findingsStats.total) * 100}%` }}
                  title={`${findingsStats.bySeverity.high} high`}
                />
              )}
              {findingsStats.bySeverity.medium > 0 && (
                <div
                  className="bg-amber-500"
                  style={{ width: `${(findingsStats.bySeverity.medium / findingsStats.total) * 100}%` }}
                  title={`${findingsStats.bySeverity.medium} medium`}
                />
              )}
              {findingsStats.bySeverity.low > 0 && (
                <div
                  className="bg-blue-500"
                  style={{ width: `${(findingsStats.bySeverity.low / findingsStats.total) * 100}%` }}
                  title={`${findingsStats.bySeverity.low} low`}
                />
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {findingsStats.bySeverity.high}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {findingsStats.bySeverity.medium}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {findingsStats.bySeverity.low}
              </span>
            </div>
          </div>
          {findingsStats.autoFixable > 0 && (
            <div className="mt-2 text-xs text-emerald-400">
              {findingsStats.autoFixable} auto-fixable finding{findingsStats.autoFixable !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

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
