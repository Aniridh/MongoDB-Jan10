import React from 'react';
import type { AgentMessage, AgentRole } from '@/types';
import { type Goal } from './GoalSelector';

interface AgentDialoguePanelProps {
  agentMessages: AgentMessage[];
  isLoading: boolean;
  goal?: Goal;
  onFollowUp?: (followup: string) => void;
  isAnalyzing?: boolean;
}

function getAgentName(role: AgentRole): string {
  const names: Record<AgentRole, string> = {
    analysis: 'Analysis',
    review: 'Review',
    tradeoff: 'Tradeoff',
    historian: 'Historian',
  };
  return names[role];
}

function getAgentBadgeColor(role: AgentRole): string {
  const colors: Record<AgentRole, string> = {
    analysis: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
    review: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    tradeoff: 'bg-violet-500/20 text-violet-300 border-violet-400/50',
    historian: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
  };
  return colors[role];
}

function getAgentBorderColor(role: AgentRole): string {
  const colors: Record<AgentRole, string> = {
    analysis: 'border-cyan-400/50',
    review: 'border-amber-400/50',
    tradeoff: 'border-violet-400/50',
    historian: 'border-emerald-400/50',
  };
  return colors[role];
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

function getFollowUpButtons(goal?: Goal): Array<{ label: string; followup: string }> {
  if (!goal) return [];
  const buttons: Record<Goal, Array<{ label: string; followup: string }>> = {
    RISKS: [
      { label: 'Add Mitigations', followup: 'MITIGATIONS' },
      { label: 'Prioritize by Severity', followup: 'PRIORITIZE' },
      { label: 'Turn into Action Items', followup: 'ACTION_ITEMS' },
    ],
    IMPLEMENTABLE: [
      { label: 'Add Missing Details', followup: 'DETAILS' },
      { label: 'Create Checklist', followup: 'CHECKLIST' },
    ],
    API_CONTRACT: [
      { label: 'Add Auth + Rate Limiting', followup: 'AUTH' },
      { label: 'Add Error Codes', followup: 'ERROR_CODES' },
      { label: 'Generate Example Payloads', followup: 'EXAMPLES' },
    ],
    TEST_PLAN: [
      { label: 'Add Edge Cases', followup: 'EDGE_CASES' },
      { label: 'Add Load Tests', followup: 'LOAD_TESTS' },
    ],
    DECISION: [
      { label: 'Compare Options', followup: 'COMPARE' },
      { label: 'Add Rationale', followup: 'RATIONALE' },
    ],
  };
  return buttons[goal] || [];
}

export function AgentDialoguePanel({
  agentMessages,
  isLoading,
  goal,
  onFollowUp,
  isAnalyzing = false,
}: AgentDialoguePanelProps) {
  if (!agentMessages.length && !isLoading) {
    return null;
  }

  const followUpButtons = getFollowUpButtons(goal);
  const showFollowUps = agentMessages.length > 0 && followUpButtons.length > 0;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/10 p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      <h2 className="text-lg font-semibold text-cyan-300 mb-3 tracking-wide">
        Agent Dialogue
      </h2>
      <div className="bg-slate-900/70 border border-white/10 rounded-xl p-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 backdrop-blur-sm">
        {isLoading && !agentMessages.length ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-800/50 rounded animate-pulse w-1/3"></div>
                <div className="h-3 bg-slate-800/50 rounded animate-pulse"></div>
                <div className="h-3 bg-slate-800/50 rounded animate-pulse w-5/6"></div>
              </div>
            ))}
          </div>
        ) : agentMessages.length > 0 ? (
          agentMessages.map((msg, index) => (
            <div
              key={index}
              className={`
                bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm
                backdrop-blur-sm
                ${getAgentBorderColor(msg.agentRole)}
                border-l-4
              `}
            >
              {/* Badge at top */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`
                    inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
                    ${getAgentBadgeColor(msg.agentRole)}
                  `}
                >
                  {getAgentName(msg.agentRole)}
                </span>
                <span className="text-xs text-slate-500">
                  {formatTimestamp(msg.createdAt)}
                </span>
              </div>
              {/* Message content */}
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {msg.message}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">Working...</p>
        )}
      </div>

      {/* Follow-up Buttons */}
      {showFollowUps && onFollowUp && (
        <div className="mt-4 pt-4 border-t border-cyan-400/20">
          <p className="text-xs font-medium text-slate-400 mb-2 tracking-wide">
            Follow-up Actions:
          </p>
          <div className="flex flex-wrap gap-2">
            {followUpButtons.map((btn) => (
              <button
                key={btn.followup}
                onClick={() => onFollowUp(btn.followup)}
                disabled={isAnalyzing}
                className="px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/50 border border-cyan-400/30 rounded-lg hover:bg-cyan-950/70 hover:border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-sm shadow-[0_0_10px_rgba(6,182,212,0.1)]"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
