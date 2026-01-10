/**
 * Seed memory with similar artifacts to test vector search
 * Run with: npx tsx scripts/seed-memory.ts
 * 
 * This will:
 * 1. Run with a buggy artifact
 * 2. Run with the same artifact slightly modified
 * 3. Verify the second run's historian mentions the previous decision
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

const BUGGY_ARTIFACT = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
    // Missing: quantity multiplication
    // Missing: tax calculation
    // Missing: discount logic
  }
  return total;
  // No input validation
  // No error handling
  // No edge case handling for empty array
}`;

const MODIFIED_ARTIFACT = `function calculateTotal(items) {
  let total = 0;
  // Added: input validation check
  if (!items || items.length === 0) {
    return 0;
  }
  
  for (let i = 0; i < items.length; i++) {
    // Modified: now includes quantity
    const item = items[i];
    total += item.price * (item.quantity || 1);
  }
  
  // Still missing: tax calculation
  // Still missing: discount logic
  
  return total;
}`;

interface AnalyzeResponse {
  toolReport: string;
  agentMessages: Array<{
    agentRole: string;
    message: string;
    createdAt: string;
  }>;
  decisions: Array<{
    _id: string;
    summary: string;
    rationale: string;
    createdAt: string;
  }>;
}

async function analyzeArtifact(artifactContent: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ artifactContent }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function seedMemory() {
  console.log("🌱 Seeding memory with similar artifacts...\n");
  console.log("=" .repeat(60) + "\n");

  try {
    // Run 1: Buggy artifact
    console.log("📤 Run 1: Submitting buggy artifact...");
    console.log("Artifact preview:");
    console.log(BUGGY_ARTIFACT.substring(0, 100) + "...\n");

    let run1Response: AnalyzeResponse;
    try {
      run1Response = await analyzeArtifact(BUGGY_ARTIFACT);
    } catch (error) {
      console.error("❌ Run 1 failed:", error instanceof Error ? error.message : error);
      console.error("");
      if (error instanceof Error && error.message.includes("fetch")) {
        console.error("💡 Make sure the server is running:");
        console.error("   npm run dev");
        console.error("");
      }
      throw error;
    }
    
    console.log("✅ Run 1 completed");
    console.log(`   toolReport: ${run1Response.toolReport?.length || 0} chars`);
    console.log(`   agentMessages: ${run1Response.agentMessages?.length || 0}`);
    console.log(`   decisions: ${run1Response.decisions?.length || 0}`);
    
    if (!run1Response.decisions || run1Response.decisions.length === 0) {
      console.error("❌ Run 1: No decisions created - cannot proceed with Run 2");
      process.exit(1);
    }
    
    if (run1Response.decisions.length > 0) {
      console.log(`   First decision summary: "${run1Response.decisions[0].summary?.substring(0, 80) || "N/A"}..."`);
      console.log(`   First decision ID: ${run1Response.decisions[0]._id || "N/A"}`);
    }
    console.log("");

    // Wait for MongoDB to index the first decision
    // Vector search indexes can take a moment to update, especially on free tier
    console.log("⏳ Waiting 3 seconds for MongoDB vector index to update...\n");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Run 2: Modified artifact
    console.log("📤 Run 2: Submitting modified artifact...");
    console.log("Artifact preview:");
    console.log(MODIFIED_ARTIFACT.substring(0, 100) + "...\n");
    console.log("Changes: Added validation, included quantity, minor improvements\n");

    let run2Response: AnalyzeResponse;
    try {
      run2Response = await analyzeArtifact(MODIFIED_ARTIFACT);
    } catch (error) {
      console.error("❌ Run 2 failed:", error instanceof Error ? error.message : error);
      console.error("");
      console.error("Note: Run 1 succeeded and created decision, but Run 2 failed.");
      console.error("Check server logs for details.");
      console.error("");
      throw error;
    }
    
    console.log("✅ Run 2 completed");
    console.log(`   toolReport: ${run2Response.toolReport?.length || 0} chars`);
    console.log(`   agentMessages: ${run2Response.agentMessages?.length || 0}`);
    console.log(`   decisions: ${run2Response.decisions?.length || 0}`);
    
    if (!run2Response.decisions || run2Response.decisions.length === 0) {
      console.error("❌ Run 2: No decisions created - cannot verify memory recall");
      process.exit(1);
    }
    
    console.log("");

    // Verify decisions count
    const decisionsCount = run2Response.decisions.length;
    if (decisionsCount >= 1) {
      console.log(`✅ decisions: ${decisionsCount} document(s) in response`);
    } else {
      console.log(`❌ decisions: expected >= 1, got ${decisionsCount}`);
    }

    // Check historian rationale from Run 2
    console.log("\n🔍 Analyzing Historian rationale from Run 2...\n");
    
    const historianMessage = run2Response.agentMessages.find(
      (msg) => msg.agentRole === "historian"
    );

    if (!historianMessage) {
      console.log("❌ No historian message found in Run 2 response");
      process.exit(1);
    }

    let historianOutput: { decisionSummary?: string; decisionRationale?: string };
    try {
      historianOutput = JSON.parse(historianMessage.message);
    } catch (error) {
      console.log("❌ Failed to parse historian message as JSON");
      console.log(`Historian message: ${historianMessage.message.substring(0, 200)}...`);
      process.exit(1);
    }

    const rationale = historianOutput.decisionRationale || run2Response.decisions[0]?.rationale || "";
    
    if (!rationale) {
      console.log("❌ No rationale found in historian output or decision");
      process.exit(1);
    }

    console.log("Historian rationale:");
    console.log("-" .repeat(60));
    console.log(rationale);
    console.log("-" .repeat(60));
    console.log("");

    // Check if rationale mentions previous decision
    const lowerRationale = rationale.toLowerCase();
    const mentionsPrevious = 
      lowerRationale.includes("previous") ||
      lowerRationale.includes("similar") ||
      lowerRationale.includes("past") ||
      lowerRationale.includes("earlier") ||
      lowerRationale.includes("prior") ||
      lowerRationale.includes("this is similar") ||
      lowerRationale.includes("similar to a previous");

    if (mentionsPrevious) {
      console.log("✅ SUCCESS: Historian rationale mentions previous/similar decisions!");
      console.log("   The 'shared brain' is working - vector search found similar decisions.");
      console.log("");
      
      // Show key phrases
      const phrases = [
        "previous",
        "similar",
        "past",
        "earlier",
        "prior",
        "this is similar",
        "similar to a previous",
      ];
      
      const foundPhrases = phrases.filter((phrase) =>
        lowerRationale.includes(phrase)
      );
      
      if (foundPhrases.length > 0) {
        console.log(`   Found phrases: ${foundPhrases.join(", ")}`);
      }
    } else {
      console.log("⚠️  WARNING: Historian rationale does not explicitly mention previous decisions");
      console.log("   This could mean:");
      console.log("   1. Vector search found no similar decisions (index may not be working)");
      console.log("   2. Historian agent didn't use similar decisions in its reasoning");
      console.log("   3. Not enough time passed for MongoDB to index the first decision");
      console.log("");
      console.log("   Check:");
      console.log("   - MongoDB Atlas vector index exists and is configured correctly");
      console.log("   - First decision was actually saved to MongoDB");
      console.log("   - Similar decisions were found in the API call (check logs)");
    }

    console.log("\n" + "=" .repeat(60));
    console.log("\n📊 Summary:\n");
    console.log(`Run 1: Created ${run1Response.decisions.length} decision(s)`);
    console.log(`Run 2: Created ${run2Response.decisions.length} decision(s)`);
    console.log(`Total decisions in system: ${run1Response.decisions.length + run2Response.decisions.length}`);
    console.log(`Vector search connection: ${mentionsPrevious ? "✅ Working" : "⚠️  May not be working"}`);
    console.log("");

    // Verify MongoDB collections
    console.log("🔍 Verifying MongoDB collections...\n");
    const { getDb } = await import("../lib/db");
    const db = await getDb();
    
    const decisionsCollection = db.collection("decisions");
    const totalDecisions = await decisionsCollection.countDocuments();
    console.log(`MongoDB decisions collection: ${totalDecisions} document(s)`);
    
    if (totalDecisions >= 2) {
      console.log("✅ MongoDB has at least 2 decisions (correct)\n");
    } else {
      console.log(`⚠️  MongoDB has ${totalDecisions} decision(s), expected >= 2\n`);
    }

    if (mentionsPrevious && totalDecisions >= 2) {
      console.log("🎉 SUCCESS! The shared brain is working!");
      console.log("   - Vector search found similar decisions");
      console.log("   - Historian agent referenced previous decisions");
      console.log("   - Memory is being seeded correctly\n");
      process.exit(0);
    } else {
      console.log("⚠️  Setup incomplete or needs verification\n");
      process.exit(mentionsPrevious && totalDecisions >= 2 ? 0 : 1);
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error instanceof Error ? error.message : error);
    console.error("");
    if (error instanceof Error && error.message.includes("fetch")) {
      console.error("💡 Make sure the server is running:");
      console.error("   npm run dev");
      console.error("");
    }
    process.exit(1);
  }
}

seedMemory();
