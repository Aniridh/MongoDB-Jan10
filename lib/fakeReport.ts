/**
 * Generate a deterministic fake tool report based on content and goal.
 * No randomness, no real computation - just plausible engineering feedback.
 */
export function createFakeReport(content: string, goal: string | null = null): string {
  const lines = content.split("\n").length;
  const hasFunctions = content.includes("function") || content.includes("=>");
  const hasClasses = content.includes("class ");
  const hasTests = content.toLowerCase().includes("test");
  const hasErrors = content.includes("error") || content.includes("Error");
  const hasApi = content.toLowerCase().includes("api") || content.toLowerCase().includes("endpoint");
  const hasAuth = content.toLowerCase().includes("auth") || content.toLowerCase().includes("authentication");
  
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Goal-specific analysis
  switch (goal) {
    case 'RISKS':
      if (hasErrors) {
        issues.push("Error handling gaps detected - potential runtime failures");
      }
      if (!hasTests) {
        issues.push("Missing test coverage - unknown failure modes");
      }
      if (hasApi && !hasAuth) {
        issues.push("API endpoints lack authentication - security risk");
      }
      if (lines > 500) {
        issues.push("High complexity increases maintenance risk");
      }
      suggestions.push("Perform security audit on external interfaces");
      suggestions.push("Add monitoring and alerting for critical paths");
      break;

    case 'IMPLEMENTABLE':
      if (!hasFunctions && !hasClasses) {
        issues.push("Design lacks implementation details - no clear structure");
      }
      if (!content.includes("interface") && !content.includes("type")) {
        issues.push("Missing type definitions - implementation unclear");
      }
      suggestions.push("Break down into smaller, testable modules");
      suggestions.push("Define clear input/output contracts");
      if (hasClasses && !content.includes("constructor")) {
        suggestions.push("Specify initialization requirements");
      }
      break;

    case 'API_CONTRACT':
      if (hasApi) {
        if (!content.includes("method") && !content.includes("GET") && !content.includes("POST")) {
          issues.push("HTTP methods not specified for endpoints");
        }
        if (!content.includes("status") && !content.includes("code")) {
          issues.push("Response status codes not defined");
        }
        suggestions.push("Define request/response schemas");
        suggestions.push("Specify authentication requirements per endpoint");
        suggestions.push("Document error response formats");
      } else {
        issues.push("No API endpoints identified in design");
      }
      break;

    case 'TEST_PLAN':
      if (!hasTests) {
        issues.push("No existing test structure found");
      }
      suggestions.push("Define unit test coverage targets");
      suggestions.push("Plan integration test scenarios");
      suggestions.push("Design load/performance test cases");
      if (hasApi) {
        suggestions.push("Include API contract testing");
      }
      break;

    case 'DECISION':
      if (!content.includes("option") && !content.includes("approach")) {
        issues.push("No decision alternatives clearly defined");
      }
      suggestions.push("Identify all viable options");
      suggestions.push("Document trade-offs for each option");
      suggestions.push("Establish decision criteria");
      break;

    default:
      // Generic analysis
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
  }
  
  let reportTitle = "Tool Report";
  if (goal) {
    const goalTitles: Record<string, string> = {
      'RISKS': 'Risk Scan Report',
      'IMPLEMENTABLE': 'Implementation Readiness Check',
      'API_CONTRACT': 'API Contract Analysis',
      'TEST_PLAN': 'Test Coverage Assessment',
      'DECISION': 'Decision Context Analysis',
    };
    reportTitle = goalTitles[goal] || reportTitle;
  }
  
  let report = `${reportTitle}\n`;
  report += "=".repeat(reportTitle.length) + "\n\n";
  
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
    report += "No issues detected. Structure looks good.\n";
  }
  
  report += `\nAnalysis complete. Lines analyzed: ${lines}`;
  if (goal) {
    report += ` | Goal: ${goal}`;
  }
  
  return report;
}
