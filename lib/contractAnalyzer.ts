/**
 * Deterministic Contract Analyzer for API_CONTRACT goal
 * 
 * Analyzes markdown design artifacts for API contract completeness.
 * Runs before LLM calls and produces structured findings.
 */

export type ContractFinding = {
  id: string;
  category: "missing" | "ambiguous" | "risk";
  rule: string;
  evidence: string[];
  severity: "low" | "medium" | "high";
  autoFixable: boolean;
};

export type ContractAnalysisResult = {
  findings: ContractFinding[];
  metadata: {
    linesAnalyzed: number;
    analysisGoal: "API_CONTRACT";
    statistics: {
      total: number;
      bySeverity: {
        high: number;
        medium: number;
        low: number;
      };
      byCategory: {
        missing: number;
        ambiguous: number;
        risk: number;
      };
      autoFixable: number;
    };
  };
};

/**
 * Run deterministic contract analysis on a design artifact
 * 
 * @param text - Markdown design artifact string
 * @returns ContractAnalysisResult with findings and metadata
 */
export function runContractAnalyzer(text: string): ContractAnalysisResult {
  // Handle empty or invalid input gracefully
  if (!text || typeof text !== "string") {
    return {
      findings: [],
      metadata: {
        linesAnalyzed: 0,
        analysisGoal: "API_CONTRACT",
        statistics: {
          total: 0,
          bySeverity: { high: 0, medium: 0, low: 0 },
          byCategory: { missing: 0, ambiguous: 0, risk: 0 },
          autoFixable: 0,
        },
      },
    };
  }

  const lines = text.split("\n");
  const findings: ContractFinding[] = [];
  let findingIdCounter = 1;

  // Normalize text for analysis (lowercase for keyword detection)
  const textLower = text.toLowerCase();
  const normalizedText = text;

  // Helper: Extract sections (markdown headers)
  const sections: Array<{ title: string; content: string; lineStart: number }> = [];
  let currentSection = { title: "", content: "", lineStart: 0 };
  let lineNumber = 0;

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      if (currentSection.title) {
        sections.push({ ...currentSection });
      }
      currentSection = {
        title: headerMatch[2].trim(),
        content: line + "\n",
        lineStart: lineNumber,
      };
    } else {
      currentSection.content += line + "\n";
    }
    lineNumber++;
  }
  if (currentSection.title) {
    sections.push(currentSection);
  }

  // Helper: Add finding with unique ID
  const addFinding = (
    category: "missing" | "ambiguous" | "risk",
    rule: string,
    evidence: string[],
    severity: "low" | "medium" | "high",
    autoFixable: boolean
  ) => {
    findings.push({
      id: `contract-${findingIdCounter++}`,
      category,
      rule,
      evidence,
      severity,
      autoFixable,
    });
  };

  // Rule 1: Endpoints mentioned without HTTP methods
  // Look for endpoint-like patterns (paths starting with /) without HTTP verbs nearby
  const endpointPattern = /\/[a-zA-Z0-9\/\-_?={}]+/g;
  const httpMethods = /\b(get|post|put|patch|delete|head|options)\b/gi;
  const endpointMatches: Array<{ match: string; line: number; context: string }> = [];

  lines.forEach((line, idx) => {
    const matches = line.match(endpointPattern);
    if (matches) {
      const lineLower = line.toLowerCase();
      // Use match() instead of test() to avoid regex state consumption
      const hasHttpMethod = lineLower.match(httpMethods) !== null;
      matches.forEach((match) => {
        if (!hasHttpMethod && match.length > 1) {
          endpointMatches.push({
            match,
            line: idx + 1,
            context: line.trim(),
          });
        }
      });
    }
  });

  // Only flag if we have endpoint-like patterns but no clear HTTP methods
  if (endpointMatches.length > 0 && !textLower.match(/\b(get|post|put|patch|delete)\s+\/[a-zA-Z0-9\/\-_]+/i)) {
    const evidence = endpointMatches.slice(0, 5).map((e) => `Line ${e.line}: ${e.context}`);
    addFinding(
      "missing",
      "Endpoints mentioned without HTTP methods",
      evidence,
      "high",
      false
    );
  }

  // Rule 2: Missing response status codes
  // Look for endpoints or API descriptions without status codes
  const hasStatusCodePattern = /\b(200|201|202|204|400|401|403|404|409|422|500|502|503)\b/;
  const hasEndpointOrApi = /(endpoint|api|route|path|\/[a-zA-Z0-9\/\-_]+)/i;
  if (hasEndpointOrApi.test(text) && !hasStatusCodePattern.test(text)) {
    addFinding(
      "missing",
      "Missing response status codes",
      ["No HTTP status codes found (e.g., 200, 400, 404) in artifact"],
      "medium",
      false
    );
  }

  // Rule 3: Missing request/response schemas
  // Look for API descriptions without schema definitions
  const schemaKeywords = /(schema|request|response|body|payload|dto|model|type|interface|structure)/i;
  const hasApiDescription = /(endpoint|api|request|response|post|put|patch)/i;
  if (hasApiDescription.test(text) && !schemaKeywords.test(text)) {
    addFinding(
      "missing",
      "Missing request/response schemas",
      ["No schema, request/response, or type definitions found"],
      "high",
      false
    );
  }

  // Rule 4: Missing authentication/authorization definition
  // Look for API endpoints without auth definitions
  const authKeywords = /(auth|authentication|authorization|jwt|token|bearer|api.?key|oauth|security|permission|role)/i;
  if (hasEndpointOrApi.test(text) && !authKeywords.test(text)) {
    addFinding(
      "missing",
      "Missing authentication/authorization definition",
      ["No authentication or authorization mechanisms defined"],
      "high",
      false
    );
  }

  // Rule 5: Caching mentioned without invalidation strategy
  // Look for cache mentions without invalidation
  const cacheKeywords = /(cache|caching|redis|memcached|ttl)/i;
  const invalidationKeywords = /(invalidation|invalidate|evict|expire|purge|clear|refresh|stale)/i;
  if (cacheKeywords.test(text) && !invalidationKeywords.test(text)) {
    addFinding(
      "missing",
      "Caching mentioned without invalidation strategy",
      ["Caching is mentioned but no invalidation strategy is defined"],
      "medium",
      false
    );
  }

  // Rule 6: Ambiguous endpoint definitions (mentioned but incomplete)
  // Look for endpoints in lists or descriptions that seem incomplete
  const ambiguousPatterns = [
    {
      pattern: /endpoint[^:]*[:]\s*\/[^/\n]*(?:\n|$)/gi,
      rule: "Endpoint definitions may be incomplete or ambiguous",
      category: "ambiguous" as const,
      severity: "low" as const,
    },
  ];

  ambiguousPatterns.forEach(({ pattern, rule, category, severity }) => {
    const matches = text.matchAll(pattern);
    const matchArray = Array.from(matches);
    if (matchArray.length > 0) {
      const evidence = matchArray.slice(0, 3).map((m) => {
        const lineNum = text.substring(0, m.index).split("\n").length;
        return `Line ${lineNum}: ${m[0].trim().substring(0, 80)}`;
      });
      if (evidence.length > 0) {
        addFinding(category, rule, evidence, severity, false);
      }
    }
  });

  // Rule 7: Risk - Rate limiting not mentioned
  // Look for API descriptions without rate limiting
  const rateLimitKeywords = /(rate.?limit|throttle|quota|rps|requests.?per.?second|qps)/i;
  if (hasEndpointOrApi.test(text) && !rateLimitKeywords.test(text)) {
    addFinding(
      "risk",
      "Rate limiting not mentioned",
      ["No rate limiting or throttling strategy defined"],
      "low",
      false
    );
  }

  // Rule 8: Risk - Error handling not defined
  // Look for APIs without error response definitions
  const errorHandlingKeywords = /(error|exception|failure|status.?code|4[0-9]{2}|5[0-9]{2})/i;
  if (hasEndpointOrApi.test(text) && !errorHandlingKeywords.test(text)) {
    addFinding(
      "risk",
      "Error handling not defined",
      ["No error response formats or status codes defined"],
      "medium",
      false
    );
  }

  // Calculate statistics
  const statistics = {
    total: findings.length,
    bySeverity: {
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
    },
    byCategory: {
      missing: findings.filter((f) => f.category === "missing").length,
      ambiguous: findings.filter((f) => f.category === "ambiguous").length,
      risk: findings.filter((f) => f.category === "risk").length,
    },
    autoFixable: findings.filter((f) => f.autoFixable).length,
  };

  return {
    findings,
    metadata: {
      linesAnalyzed: lines.length,
      analysisGoal: "API_CONTRACT",
      statistics,
    },
  };
}

