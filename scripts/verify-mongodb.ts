/**
 * Verify MongoDB collections after smoke test
 * Run with: npx tsx scripts/verify-mongodb.ts
 */

import { getDb } from "../lib/db";

async function verifyCollections() {
  console.log("🔍 Verifying MongoDB collections after smoke test\n");

  try {
    const db = await getDb();

    // Check artifacts collection
    const artifactsCollection = db.collection("artifacts");
    const artifactsCount = await artifactsCollection.countDocuments();
    console.log(`artifacts: ${artifactsCount} document(s)`);
    if (artifactsCount === 1) {
      console.log("✅ artifacts: 1 document (correct)\n");
    } else {
      console.log(`❌ artifacts: expected 1 document, got ${artifactsCount}\n`);
    }

    // Check reports collection
    const reportsCollection = db.collection("reports");
    const reportsCount = await reportsCollection.countDocuments();
    console.log(`reports: ${reportsCount} document(s)`);
    if (reportsCount === 1) {
      console.log("✅ reports: 1 document (correct)\n");
    } else {
      console.log(`❌ reports: expected 1 document, got ${reportsCount}\n`);
    }

    // Check agent_messages collection
    const agentMessagesCollection = db.collection("agent_messages");
    const agentMessagesCount = await agentMessagesCollection.countDocuments();
    console.log(`agent_messages: ${agentMessagesCount} document(s)`);
    if (agentMessagesCount === 4) {
      console.log("✅ agent_messages: 4 documents (correct)\n");
      
      // Verify roles
      const roles = await agentMessagesCollection.distinct("agentRole");
      const sortedRoles = roles.sort();
      const expectedRoles = ["analysis", "historian", "review", "tradeoff"].sort();
      
      if (JSON.stringify(sortedRoles) === JSON.stringify(expectedRoles)) {
        console.log(`✅ agent_messages: all 4 roles present (${sortedRoles.join(", ")})\n`);
      } else {
        console.log(`❌ agent_messages: missing roles. Expected: ${expectedRoles.join(", ")}, Got: ${sortedRoles.join(", ")}\n`);
      }
    } else {
      console.log(`❌ agent_messages: expected 4 documents, got ${agentMessagesCount}\n`);
    }

    // Check decisions collection
    const decisionsCollection = db.collection("decisions");
    const decisionsCount = await decisionsCollection.countDocuments();
    console.log(`decisions: ${decisionsCount} document(s)`);
    if (decisionsCount >= 1) {
      console.log(`✅ decisions: ${decisionsCount} document(s) (correct)\n`);
      
      // Verify latest decision structure
      const latestDecision = await decisionsCollection
        .findOne({}, { sort: { createdAt: -1 } });
      
      if (latestDecision) {
        const checks: Array<{ field: string; passed: boolean }> = [];
        
        if (latestDecision.summary) checks.push({ field: "summary", passed: true });
        else checks.push({ field: "summary", passed: false });
        
        if (latestDecision.rationale) checks.push({ field: "rationale", passed: true });
        else checks.push({ field: "rationale", passed: false });
        
        if (Array.isArray(latestDecision.embedding) && latestDecision.embedding.length > 100) {
          checks.push({ field: "embedding", passed: true });
          console.log(`✅ decision.embedding: present (length: ${latestDecision.embedding.length})\n`);
        } else {
          checks.push({ field: "embedding", passed: false });
          console.log(`❌ decision.embedding: missing or too short (length: ${Array.isArray(latestDecision.embedding) ? latestDecision.embedding.length : 0})\n`);
        }
        
        if (Array.isArray(latestDecision.agentRolesInvolved)) {
          const roles = [...latestDecision.agentRolesInvolved].sort();
          const expectedRoles = ["analysis", "historian", "review", "tradeoff"].sort();
          if (JSON.stringify(roles) === JSON.stringify(expectedRoles)) {
            checks.push({ field: "agentRolesInvolved", passed: true });
            console.log(`✅ decision.agentRolesInvolved: correct (${roles.join(", ")})\n`);
          } else {
            checks.push({ field: "agentRolesInvolved", passed: false });
            console.log(`❌ decision.agentRolesInvolved: incorrect. Expected: ${expectedRoles.join(", ")}, Got: ${roles.join(", ")}\n`);
          }
        } else {
          checks.push({ field: "agentRolesInvolved", passed: false });
          console.log(`❌ decision.agentRolesInvolved: missing or not an array\n`);
        }
        
        if (latestDecision.createdAt) {
          checks.push({ field: "createdAt", passed: true });
        } else {
          checks.push({ field: "createdAt", passed: false });
        }
        
        checks.forEach((check) => {
          if (check.field !== "embedding" && check.field !== "agentRolesInvolved") {
            console.log(`${check.passed ? "✅" : "❌"} decision.${check.field}: ${check.passed ? "present" : "missing"}`);
          }
        });
        console.log("");
      }
    } else {
      console.log(`❌ decisions: expected >= 1 document, got ${decisionsCount}\n`);
    }

    // Summary
    const allPassed = 
      artifactsCount === 1 &&
      reportsCount === 1 &&
      agentMessagesCount === 4 &&
      decisionsCount >= 1;

    console.log("=".repeat(50));
    if (allPassed) {
      console.log("\n✅ All MongoDB collection checks passed!");
      process.exit(0);
    } else {
      console.log("\n❌ Some MongoDB collection checks failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ MongoDB verification failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

verifyCollections();
