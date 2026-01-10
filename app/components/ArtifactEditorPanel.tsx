import React from 'react';
import { GoalSelector, type Goal } from './GoalSelector';

interface ArtifactEditorPanelProps {
  goal: Goal;
  onGoalChange: (goal: Goal) => void;
  artifactContent: string;
  onArtifactContentChange: (content: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  disabled?: boolean;
}

const EXAMPLE_ARTIFACT = `# API Gateway Design

## Problem
We need to handle 10,000 requests/second with <100ms latency.

## Proposed Solution
- Use Redis for caching
- Horizontal scaling with load balancer
- Connection pooling for database

## Trade-offs
- Redis adds operational complexity
- Load balancer increases latency by ~5ms
- Connection pooling requires careful tuning`;

function getGoalButtonLabel(goal: Goal): string {
  const labels: Record<Goal, string> = {
    RISKS: 'Scan for Risks',
    IMPLEMENTABLE: 'Check Implementability',
    API_CONTRACT: 'Draft API Contract',
    TEST_PLAN: 'Generate Test Plan',
    DECISION: 'Recommend Decision',
  };
  return labels[goal];
}

export function ArtifactEditorPanel({
  goal,
  onGoalChange,
  artifactContent,
  onArtifactContentChange,
  onAnalyze,
  isAnalyzing,
  disabled = false,
}: ArtifactEditorPanelProps) {
  const handleLoadExample = () => {
    onArtifactContentChange(EXAMPLE_ARTIFACT);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      <h2 className="text-lg font-semibold text-cyan-300 mb-4 tracking-wide">
        Design Artifact Editor
      </h2>

      {/* Goal selector */}
      <div className="mb-6">
        <GoalSelector
          goal={goal}
          onGoalChange={onGoalChange}
          disabled={disabled || isAnalyzing}
        />
      </div>

      {/* Code-style textarea */}
      <div className="mb-4">
        <textarea
          value={artifactContent}
          onChange={(e) => onArtifactContentChange(e.target.value)}
          spellCheck={false}
          disabled={disabled || isAnalyzing}
          className="
            w-full h-[calc(100vh-420px)] min-h-[300px]
            px-4 py-3
            bg-slate-900/70 border border-white/10 rounded-2xl
            font-mono text-sm text-slate-100
            resize-none
            focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
            placeholder:text-slate-500
            backdrop-blur-sm
            shadow-[0_0_10px_rgba(6,182,212,0.1)]
          "
          placeholder="Paste your RTL, firmware, or system design here..."
        />
      </div>

      {/* Analyze button and Load Example */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleLoadExample}
          disabled={disabled || isAnalyzing}
          className="
            px-4 py-2.5 text-sm font-medium
            text-slate-300 bg-slate-800/50 border border-white/10 rounded-full
            hover:bg-slate-800/70 hover:border-white/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all backdrop-blur-sm shadow-sm
          "
        >
          Load Example
        </button>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={disabled || isAnalyzing || !artifactContent.trim()}
          className="
            flex items-center justify-center gap-2
            px-5 py-2.5
            text-sm font-semibold text-slate-950
            bg-cyan-500 hover:bg-cyan-400 rounded-full
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]
          "
        >
          {isAnalyzing ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-slate-950"
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
              <span>Analyzing...</span>
            </>
          ) : (
            getGoalButtonLabel(goal)
          )}
        </button>
      </div>
    </div>
  );
}
