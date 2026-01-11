'use client';

import { useState } from 'react';
import type { AnalyzeResponse } from '@/types';
import { ChipperShell } from './components/ChipperShell';
import { HeaderBar } from './components/HeaderBar';
import { ArtifactEditorPanel } from './components/ArtifactEditorPanel';
import { type Goal } from './components/GoalSelector';
import { WorkflowStepsBanner } from './components/WorkflowStepsBanner';
import { ToolOutputPanel } from './components/ToolOutputPanel';
import { AgentDialoguePanel } from './components/AgentDialoguePanel';
import { DecisionHistoryPanel } from './components/DecisionHistoryPanel';

export default function Home() {
  const [artifactContent, setArtifactContent] = useState('');
  const [goal, setGoal] = useState<Goal>('RISKS');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!artifactContent.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      // Prepend goal header to artifact content (backend will parse this)
      const payload = `[VISIBL_GOAL=${goal}]\n${artifactContent}`;
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artifactContent: payload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
      }

      const data: AnalyzeResponse = await response.json();
      setAnalysisData(data);
      setError(null);
    } catch (error) {
      console.error('Error analyzing artifact:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to analyze artifact. Please check your backend configuration.';
      setError(errorMessage);
      setAnalysisData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFollowUp = async (followup: string) => {
    if (!artifactContent.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      // Prepend both goal and followup headers
      const payload = `[VISIBL_GOAL=${goal}]\n[VISIBL_FOLLOWUP=${followup}]\n${artifactContent}`;
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artifactContent: payload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
      }

      const data: AnalyzeResponse = await response.json();
      setAnalysisData(data);
      setError(null);
    } catch (error) {
      console.error('Error analyzing artifact:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to analyze artifact. Please check your backend configuration.';
      setError(errorMessage);
      setAnalysisData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasResults = analysisData || isAnalyzing;

  return (
    <ChipperShell>
      {/* Header */}
      <HeaderBar />

      {/* Main Grid */}
      <div className="relative flex-1 flex h-[calc(100vh-100px)] overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="w-[40%] border-r border-white/5 p-6 flex flex-col bg-slate-900/30 backdrop-blur-xl overflow-y-auto">
          <ArtifactEditorPanel
            goal={goal}
            onGoalChange={setGoal}
            artifactContent={artifactContent}
            onArtifactContentChange={setArtifactContent}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            disabled={!!error}
          />
            {error && (
            <div className="mt-4 p-4 bg-red-950/50 border border-red-500/30 rounded-xl backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <p className="text-sm font-semibold text-red-400 mb-1">Error</p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
        </div>

        {/* Right Panel - Results */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Workflow Steps Banner */}
          {hasResults && (
            <WorkflowStepsBanner isLoading={isAnalyzing} isComplete={!!analysisData} />
          )}

          {/* Empty State */}
          {!hasResults && (
            <div className="text-center py-12 px-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 backdrop-blur-sm border border-cyan-400/20 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <svg
                  className="w-8 h-8 text-cyan-400/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-300 mb-2 font-medium tracking-wide">
                No analysis yet
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Run an analysis to see tool output, agent dialogue, and decisions.
              </p>
            </div>
          )}

          {/* Tool Output Panel */}
          {hasResults && (
            <ToolOutputPanel
              goal={goal}
              toolReport={analysisData?.toolReport || null}
              isLoading={isAnalyzing}
              findingsStats={analysisData?.findings?.statistics}
              findingsRaw={analysisData?.findings?.raw}
            />
          )}

          {/* Agent Dialogue Panel */}
          {hasResults && (
            <AgentDialoguePanel
              agentMessages={analysisData?.agentMessages || []}
              isLoading={isAnalyzing}
              goal={goal}
              onFollowUp={handleFollowUp}
              isAnalyzing={isAnalyzing}
            />
          )}

          {/* Decision History Panel */}
          {hasResults && (
            <DecisionHistoryPanel
              decisions={analysisData?.decisions || []}
              isLoading={isAnalyzing}
              currentGoal={goal}
            />
          )}
        </div>
      </div>
    </ChipperShell>
  );
}
