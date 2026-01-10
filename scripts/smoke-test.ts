/**
 * Smoke test for /api/analyze endpoint
 * Run with: npx tsx scripts/smoke-test.ts
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

const TEST_PAYLOAD = {
  artifactContent: `module counter(input clk, input reset, output reg [3:0] count);
  always @(posedge clk or posedge reset) begin
    if (reset) count <= 4'b0000;
    else count <= count + 1;
  end
endmodule`,
};

interface TestResult {
  passed: boolean;
  message: string;
}

async function testEndpoint(): Promise<void> {
  console.log("🚀 Running smoke test for /api/analyze endpoint");
  console.log(`API URL: ${API_URL}\n`);

  try {
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(TEST_PAYLOAD),
    });

    const statusCode = response.status;
    console.log(`HTTP Status Code: ${statusCode}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Request failed with status ${statusCode}`);
      console.error(`Response: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log("✅ Request successful\n");
    console.log("Response Body:");
    console.log(JSON.stringify(data, null, 2));
    console.log("");

    // Validate response structure
    console.log("🔍 Validating response structure...\n");

    const results: TestResult[] = [];

    // Check toolReport
    if (data.toolReport && typeof data.toolReport === "string" && data.toolReport.trim().length > 0) {
      results.push({ passed: true, message: "✅ toolReport: present and non-empty" });
    } else {
      results.push({ passed: false, message: "❌ toolReport: missing or empty" });
    }

    // Check agentMessages
    if (Array.isArray(data.agentMessages) && data.agentMessages.length === 4) {
      results.push({ passed: true, message: "✅ agentMessages: length is 4" });

      const roles = data.agentMessages.map((msg: any) => msg.agentRole).sort();
      const expectedRoles = ["analysis", "historian", "review", "tradeoff"].sort();
      
      if (JSON.stringify(roles) === JSON.stringify(expectedRoles)) {
        results.push({ 
          passed: true, 
          message: "✅ agentMessages: all 4 roles present (analysis, review, tradeoff, historian)" 
        });
      } else {
        results.push({ 
          passed: false, 
          message: `❌ agentMessages: missing roles. Expected: ${JSON.stringify(expectedRoles)}, Got: ${JSON.stringify(roles)}` 
        });
      }

      // Check all messages have required fields
      const allMessagesValid = data.agentMessages.every((msg: any) => 
        msg.agentRole && msg.message && msg.createdAt
      );
      if (allMessagesValid) {
        results.push({ passed: true, message: "✅ agentMessages: all have required fields (agentRole, message, createdAt)" });
      } else {
        results.push({ passed: false, message: "❌ agentMessages: some messages missing required fields" });
      }
    } else {
      results.push({ 
        passed: false, 
        message: `❌ agentMessages: expected length 4, got ${Array.isArray(data.agentMessages) ? data.agentMessages.length : "not an array"}` 
      });
    }

    // Check decisions
    if (Array.isArray(data.decisions) && data.decisions.length >= 1) {
      results.push({ 
        passed: true, 
        message: `✅ decisions: length >= 1 (got ${data.decisions.length})` 
      });

      const decision = data.decisions[0];
      
      if (decision.summary && typeof decision.summary === "string") {
        results.push({ passed: true, message: "✅ decision.summary: present" });
      } else {
        results.push({ passed: false, message: "❌ decision.summary: missing or invalid" });
      }

      if (decision.rationale && typeof decision.rationale === "string") {
        results.push({ passed: true, message: "✅ decision.rationale: present" });
      } else {
        results.push({ passed: false, message: "❌ decision.rationale: missing or invalid" });
      }

      if (Array.isArray(decision.embedding) && decision.embedding.length > 100) {
        results.push({ 
          passed: true, 
          message: `✅ decision.embedding: present as long array (length: ${decision.embedding.length})` 
        });
      } else {
        results.push({ 
          passed: false, 
          message: `❌ decision.embedding: missing or too short (length: ${Array.isArray(decision.embedding) ? decision.embedding.length : 0})` 
        });
      }

      const agentRoles = decision.agentRolesInvolved;
      const expectedAgentRoles = ["analysis", "historian", "review", "tradeoff"].sort();
      const actualAgentRoles = Array.isArray(agentRoles) ? [...agentRoles].sort() : [];
      
      if (JSON.stringify(actualAgentRoles) === JSON.stringify(expectedAgentRoles)) {
        results.push({ 
          passed: true, 
          message: "✅ decision.agentRolesInvolved: correct (analysis, review, tradeoff, historian)" 
        });
      } else {
        results.push({ 
          passed: false, 
          message: `❌ decision.agentRolesInvolved: incorrect. Expected: ${JSON.stringify(expectedAgentRoles)}, Got: ${JSON.stringify(actualAgentRoles)}` 
        });
      }

      if (decision.createdAt && typeof decision.createdAt === "string") {
        results.push({ passed: true, message: "✅ decision.createdAt: present" });
      } else {
        results.push({ passed: false, message: "❌ decision.createdAt: missing or invalid" });
      }
    } else {
      results.push({ 
        passed: false, 
        message: `❌ decisions: expected length >= 1, got ${Array.isArray(data.decisions) ? data.decisions.length : "not an array"}` 
      });
    }

    // Print all results
    results.forEach((result) => console.log(result.message));

    const failedCount = results.filter((r) => !r.passed).length;
    console.log("");

    if (failedCount === 0) {
      console.log("✅ All validations passed!");
      console.log("");
      console.log("📊 Next step: Verify MongoDB collections have:");
      console.log("   - artifacts: 1 document");
      console.log("   - reports: 1 document");
      console.log("   - agent_messages: 4 documents");
      console.log("   - decisions: 1 document");
      console.log("");
      process.exit(0);
    } else {
      console.log(`❌ Found ${failedCount} validation error(s)`);
      console.log("");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error instanceof Error ? error.message : error);
    console.error("");
    if (error instanceof Error && error.message.includes("fetch")) {
      console.error("💡 Make sure the server is running. Try:");
      console.error("   npm run dev");
      console.error("");
    }
    process.exit(1);
  }
}

testEndpoint();
