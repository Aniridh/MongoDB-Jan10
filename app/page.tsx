'use client';

import { useState } from 'react';
import type { AnalyzeResponse } from '@/types';
import { VisiblShell } from './components/VisiblShell';
import { HeaderBar } from './components/HeaderBar';
import { ArtifactEditorPanel } from './components/ArtifactEditorPanel';
import { type Goal } from './components/GoalSelector';
import { WorkflowStepsBanner } from './components/WorkflowStepsBanner';
import { ToolOutputPanel } from './components/ToolOutputPanel';
import { AgentDialoguePanel } from './components/AgentDialoguePanel';
import { DecisionHistoryPanel } from './components/DecisionHistoryPanel';

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
    // Common patterns: insights, analysis, review, challenges, tradeoffs, etc.
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
    
    // If we found text fields, join them
    if (textFields.length > 0) {
      return textFields.join('\n\n');
    }
    
    // If no common fields, try to extract any string values
    const stringValues: string[] = [];
    const skipKeys = ['id', 'type', '_id', 'role', 'agentRole', 'createdAt', 'updatedAt'];
    
    for (const [key, value] of Object.entries(parsed)) {
      const lowerKey = key.toLowerCase();
      // Skip technical/metadata fields
      if (skipKeys.some(skip => lowerKey.includes(skip))) continue;
      
      if (typeof value === 'string' && value.trim().length > 0) {
        // Include meaningful text (longer strings or important fields)
        if (value.length > 15 || ['summary', 'rationale', 'description', 'content', 'text', 'message'].some(f => lowerKey.includes(f))) {
          stringValues.push(value);
        }
      } else if (Array.isArray(value) && value.length > 0) {
        // Handle arrays of strings or objects with text
        const arrayStrings = value
          .map(v => {
            if (typeof v === 'string' && v.trim().length > 0) {
              return `• ${v}`;
            } else if (typeof v === 'object' && v !== null) {
              // Try to extract text from objects in array
              const objText = Object.values(v).filter(val => typeof val === 'string' && val.length > 10).join(' ');
              return objText ? `• ${objText}` : null;
            }
            return null;
          })
          .filter(Boolean)
          .join('\n');
        if (arrayStrings) stringValues.push(arrayStrings);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively extract text from nested objects
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
    
    // Fallback: return formatted JSON (better than raw string)
    return JSON.stringify(parsed, null, 2);
  } catch {
    // If not JSON, return as-is
    return message;
  }
}

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
    <VisiblShell>
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
    </VisiblShell>
  );
}
