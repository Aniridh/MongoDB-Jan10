'use client';

import { useState } from 'react';
import type { AnalyzeResponse, AgentMessage, Decision, AgentRole } from '@/types';

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

function getAgentName(role: AgentRole): string {
  const names: Record<AgentRole, string> = {
    analysis: 'Analysis Agent',
    review: 'Review Agent',
    tradeoff: 'Tradeoff Agent',
    historian: 'Historian Agent',
  };
  return names[role];
}

function getAgentColor(role: AgentRole): string {
  const colors: Record<AgentRole, string> = {
    analysis: 'bg-blue-500',
    review: 'bg-green-500',
    tradeoff: 'bg-purple-500',
    historian: 'bg-amber-500',
  };
  return colors[role];
}

function getAgentBorderColor(role: AgentRole): string {
  const colors: Record<AgentRole, string> = {
    analysis: 'border-blue-500',
    review: 'border-green-500',
    tradeoff: 'border-purple-500',
    historian: 'border-amber-500',
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

export default function Home() {
  const [artifactContent, setArtifactContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [expandedDecisions, setExpandedDecisions] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleLoadExample = () => {
    setArtifactContent(EXAMPLE_ARTIFACT);
    setAnalysisData(null);
  };

  const handleAnalyze = async () => {
    if (!artifactContent.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artifactContent }),
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze artifact. Please check your backend configuration.';
      setError(errorMessage);
      setAnalysisData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleDecision = (index: number) => {
    const newExpanded = new Set(expandedDecisions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDecisions(newExpanded);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Visibl</h1>
        <p className="mt-1 text-sm text-gray-600">AI‑Native Engineering Design Notebook</p>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-100px)] bg-gray-50">
        {/* Left Panel - 40% */}
        <div className="w-[40%] border-r border-gray-200 p-6 flex flex-col bg-white">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Design Artifact
            </label>
            <textarea
              value={artifactContent}
              onChange={(e) => setArtifactContent(e.target.value)}
              spellCheck={false}
              className="w-full h-[calc(100vh-280px)] p-4 border border-gray-300 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your design artifact here..."
            />
          </div>
          <div className="space-y-3">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleLoadExample}
                disabled={isAnalyzing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load Example
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !artifactContent.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - 60% */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tool Output */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Tool Output</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 min-h-[150px] max-h-[200px] overflow-y-auto">
              {analysisData?.toolReport ? (
                <pre className="font-mono text-xs text-gray-800 whitespace-pre-wrap">
                  {analysisData.toolReport}
                </pre>
              ) : (
                <p className="text-sm text-gray-500 italic">No analysis yet</p>
              )}
            </div>
          </section>

          {/* Agent Dialogue */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Agent Dialogue</h2>
            <div className="bg-white border border-gray-200 rounded-md p-4 min-h-[200px] max-h-[300px] overflow-y-auto space-y-3">
              {analysisData?.agentMessages && analysisData.agentMessages.length > 0 ? (
                analysisData.agentMessages.map((msg: AgentMessage, index: number) => (
                  <div key={index} className={`border-l-4 pl-4 py-2 ${getAgentBorderColor(msg.agentRole)} bg-gray-50`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2 h-2 rounded-full ${getAgentColor(msg.agentRole)}`} />
                      <span className="text-sm font-semibold text-gray-900">
                        {getAgentName(msg.agentRole)}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatTimestamp(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pl-4">{msg.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Run analysis to see agent reasoning</p>
              )}
            </div>
          </section>

          {/* Decision History */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Decision History</h2>
            <div className="bg-white border border-gray-200 rounded-md p-4 min-h-[150px] max-h-[250px] overflow-y-auto space-y-3">
              {analysisData?.decisions && analysisData.decisions.length > 0 ? (
                analysisData.decisions.map((decision: Decision, index: number) => (
                  <div
                    key={index}
                    className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <button
                          onClick={() => toggleDecision(index)}
                          className="text-left w-full"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {decision.summary}
                            </span>
                            <span className="text-xs text-gray-500">
                              {expandedDecisions.has(index) ? '▼' : '▶'}
                            </span>
                          </div>
                        </button>
                        <p className="text-xs text-gray-500 mb-2">
                          {formatTimestamp(decision.createdAt)}
                        </p>
                        {expandedDecisions.has(index) && (
                          <div className="mt-2 pl-4 border-l-2 border-gray-300">
                            <p className="text-sm text-gray-700 leading-relaxed">{decision.rationale}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No decisions recorded yet</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

