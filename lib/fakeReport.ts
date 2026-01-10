/**
 * Generate a deterministic fake tool report based on content.
 * No randomness, no real computation - just plausible engineering feedback.
 */
export function createFakeReport(content: string): string {
  const lines = content.split("\n").length;
  const hasFunctions = content.includes("function") || content.includes("=>");
  const hasClasses = content.includes("class ");
  const hasTests = content.toLowerCase().includes("test");
  const hasErrors = content.includes("error") || content.includes("Error");
  
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  if (lines > 500) {
    issues.push("Large file detected - consider splitting into smaller modules");
  }
  
  if (!hasFunctions && !hasClasses) {
    issues.push("No clear structure - missing function or class definitions");
  }
  
  if (hasErrors) {
    issues.push("Error handling could be improved");
  }
  
  if (!hasTests) {
    suggestions.push("Add unit tests for core functionality");
  }
  
  if (hasClasses && !content.includes("constructor")) {
    suggestions.push("Classes should initialize properties in constructor");
  }
  
  if (content.includes("any")) {
    suggestions.push("Avoid 'any' type - use specific TypeScript types");
  }
  
  if (content.includes("console.log")) {
    suggestions.push("Replace console.log with proper logging");
  }
  
  let report = "Tool Report\n";
  report += "===========\n\n";
  
  if (issues.length > 0) {
    report += "Issues Found:\n";
    issues.forEach((issue, idx) => {
      report += `${idx + 1}. ${issue}\n`;
    });
    report += "\n";
  }
  
  if (suggestions.length > 0) {
    report += "Suggestions:\n";
    suggestions.forEach((suggestion, idx) => {
      report += `${idx + 1}. ${suggestion}\n`;
    });
    report += "\n";
  }
  
  if (issues.length === 0 && suggestions.length === 0) {
    report += "No issues detected. Code structure looks good.\n";
  }
  
  report += `\nAnalysis complete. Lines analyzed: ${lines}`;
  
  return report;
}
