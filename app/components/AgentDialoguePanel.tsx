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

function formatAgentMessage(message: string, role: AgentRole): string {
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(message);
    
    // If it's already a string, return it
    if (typeof parsed === 'string') {
      return parsed;
    }
    
    // Handle different agent roles
    if (role === 'historian') {
      // Historian has decisionSummary and decisionRationale
      if (parsed.decisionSummary && parsed.decisionRationale) {
        return `${parsed.decisionSummary}\n\n${parsed.decisionRationale}`;
      }
      if (parsed.decisionSummary) return parsed.decisionSummary;
      if (parsed.decisionRationale) return parsed.decisionRationale;
    }
    
    // For other agents, extract meaningful fields
    const textFields: string[] = [];
    
    if (parsed.insights) textFields.push(parsed.insights);
    if (parsed.analysis) textFields.push(parsed.analysis);
    if (parsed.summary) textFields.push(parsed.summary);
    if (parsed.review) textFields.push(parsed.review);
    if (parsed.challenges) textFields.push(parsed.challenges);
    if (parsed.tradeoffs) textFields.push(parsed.tradeoffs);
    if (parsed.tradeOffs) textFields.push(parsed.tradeOffs);
    if (parsed.tensions) textFields.push(parsed.tensions);
    if (parsed.recommendations) textFields.push(parsed.recommendations);
    if (parsed.conclusion) textFields.push(parsed.conclusion);
    if (parsed.keyPoints) {
      const points = Array.isArray(parsed.keyPoints) 
        ? parsed.keyPoints.join('\n• ') 
        : parsed.keyPoints;
      textFields.push(`• ${points}`);
    }
    if (parsed.findings) {
      const findings = Array.isArray(parsed.findings)
        ? parsed.findings.join('\n• ')
        : parsed.findings;
      textFields.push(`• ${findings}`);
    }
    
    if (textFields.length > 0) {
      return textFields.join('\n\n');
    }
    
    // Extract any meaningful string values
    const stringValues: string[] = [];
    const skipKeys = ['id', 'type', '_id', 'role', 'agentRole', 'createdAt', 'updatedAt'];
    
    for (const [key, value] of Object.entries(parsed)) {
      const lowerKey = key.toLowerCase();
      if (skipKeys.some(skip => lowerKey.includes(skip))) continue;
      
      if (typeof value === 'string' && value.trim().length > 0) {
        if (value.length > 15 || ['summary', 'rationale', 'description', 'content', 'text', 'message'].some(f => lowerKey.includes(f))) {
          stringValues.push(value);
        }
      } else if (Array.isArray(value) && value.length > 0) {
        const arrayStrings = value
          .map(v => {
            if (typeof v === 'string' && v.trim().length > 0) {
              return `• ${v}`;
            } else if (typeof v === 'object' && v !== null) {
              const objText = Object.values(v).filter(val => typeof val === 'string' && val.length > 10).join(' ');
              return objText ? `• ${objText}` : null;
            }
            return null;
          })
          .filter(Boolean)
          .join('\n');
        if (arrayStrings) stringValues.push(arrayStrings);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedText = Object.entries(value)
          .filter(([k, v]) => typeof v === 'string' && v.length > 10 && !skipKeys.some(skip => k.toLowerCase().includes(skip)))
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        if (nestedText) stringValues.push(nestedText);
      }
    }
    
    if (stringValues.length > 0) {
      return stringValues.join('\n\n');
    }
    
    return JSON.stringify(parsed, null, 2);
  } catch {
    return message;
  }
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-cyan-300 tracking-wide">
          Agent Dialogue
        </h2>
        <span className="text-xs text-slate-400 bg-purple-950/50 text-purple-300 px-2 py-1 rounded border border-purple-400/30">
          {agentMessages.length} {agentMessages.length === 1 ? 'Agent' : 'Agents'} Collaborating
        </span>
      </div>
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
          agentMessages.map((msg, index) => {
            const stepNumber = index + 1;
            const prevAgent = index > 0 ? agentMessages[index - 1] : null;
            const isBuildingOnPrevious = prevAgent !== null;
            const isFirst = index === 0;
            const isHistorian = msg.agentRole === 'historian';
            
            return (
              <div key={index}>
                {isBuildingOnPrevious && (
                  <div className="flex items-center justify-center py-2">
                    <div className="h-px w-16 bg-slate-700"></div>
                    <span className="px-3 text-xs text-slate-500 font-medium">builds on</span>
                    <div className="h-px w-16 bg-slate-700"></div>
                  </div>
                )}
                <div
                  className={`
                    bg-slate-900/60 border border-white/10 rounded-xl p-4 text-sm
                    backdrop-blur-sm
                    ${getAgentBorderColor(msg.agentRole)}
                    border-l-4
                  `}
                >
                  {/* Badge at top with step number */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-slate-700 rounded-full">
                        {stepNumber}
                      </span>
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
                          ${getAgentBadgeColor(msg.agentRole)}
                        `}
                      >
                        {getAgentName(msg.agentRole)} Agent
                      </span>
                      {isFirst && (
                        <span className="px-2 py-0.5 text-xs font-medium text-cyan-300 bg-cyan-950/50 border border-cyan-400/30 rounded">
                          Starts workflow
                        </span>
                      )}
                      {isHistorian && (
                        <span className="px-2 py-0.5 text-xs font-medium text-emerald-300 bg-emerald-950/50 border border-emerald-400/30 rounded">
                          Synthesizes all
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>
                  {/* Message content */}
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-8">
                    {formatAgentMessage(msg.message, msg.agentRole)}
                  </p>
                </div>
              </div>
            );
          })
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
