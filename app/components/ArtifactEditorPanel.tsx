import React, { useRef, useState } from 'react';
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

const EXAMPLE_ARTIFACT = `module datapath (input clk,
                 input [31:0] x, y, z,
                 output reg [31:0] result);

    always @(posedge clk) begin
        // potential timing bottleneck
        result <= (x * y) + (z << 2);
    end
endmodule

// Engineering intent:
// - sustain 500–700 MHz depending on synthesis
// - minimize dynamic power
// - avoid adding unnecessary pipeline depth

// Known problems in past versions:
// - multiplier → adder → shifter chain exceeded critical path
// - naive fixes increased area/power drastically

// Agents should:
// 1. Identify timing risks.
// 2. Propose possible fixes.
// 3. Argue tradeoffs (latency vs power vs area).
// 4. Use memory: compare to prior similar decisions stored in DB.`;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleLoadExample = () => {
    onArtifactContentChange(EXAMPLE_ARTIFACT);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    setIsExtracting(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;

          // Show preview
          setImagePreview(base64);

          // Call extraction API
          const response = await fetch('/api/extract-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: base64,
              mimeType: file.type,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Image extraction failed with status ${response.status}`);
          }

          const data = await response.json();
          const extractedText = data.extractedText;

          // Append extracted text to artifact content
          const prefix = artifactContent.trim() ? '\n\n' : '';
          onArtifactContentChange(artifactContent + prefix + `[Extracted from image]\n${extractedText}`);
        } catch (error) {
          console.error('Error extracting image:', error);
          alert(error instanceof Error ? error.message : 'Failed to extract text from image');
          setImagePreview(null);
        } finally {
          setIsExtracting(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        setIsExtracting(false);
        alert('Failed to read image file');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setIsExtracting(false);
      console.error('Error handling image upload:', error);
      alert('Failed to process image');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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

      {/* Image preview */}
      {imagePreview && (
        <div className="mb-4 p-3 bg-slate-800/50 border border-cyan-400/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Image preview</span>
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          </div>
          <img
            src={imagePreview}
            alt="Upload preview"
            className="max-h-32 max-w-full rounded border border-white/10"
          />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        disabled={disabled || isAnalyzing || isExtracting}
      />

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
          placeholder="Paste your RTL, firmware, or system design here, or upload an image..."
        />
      </div>

      {/* Analyze button and Load Example */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadExample}
            disabled={disabled || isAnalyzing || isExtracting}
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
            onClick={handleUploadClick}
            disabled={disabled || isAnalyzing || isExtracting}
            className="
              px-4 py-2.5 text-sm font-medium
              text-slate-300 bg-slate-800/50 border border-white/10 rounded-full
              hover:bg-slate-800/70 hover:border-white/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all backdrop-blur-sm shadow-sm
              flex items-center gap-2
            "
          >
            {isExtracting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-slate-300"
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
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Upload Image</span>
              </>
            )}
          </button>
        </div>

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
