/**
 * Verification script for environment variables and vector search index
 * Run with: npx tsx scripts/verify-setup.ts
 */

import { getDb } from "../lib/db";
import { embedText } from "../lib/embeddings";
import { findSimilarDecisions } from "../lib/vector-search";

async function verifyEnvironmentVariables() {
  console.log("🔍 Checking environment variables...\n");

  const required = {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "visibl (default)",
    LLM_API_KEY: process.env.LLM_API_KEY ? "✅ Set" : "❌ Missing",
    LLM_API_BASE_URL: process.env.LLM_API_BASE_URL ? "✅ Set" : "❌ Missing",
    LLM_MODEL: process.env.LLM_MODEL ? "✅ Set" : "❌ Missing",
    VOYAGE_API_KEY: process.env.VOYAGE_API_KEY ? "✅ Set" : "❌ Missing",
  };

  for (const [key, value] of Object.entries(required)) {
    if (key === "MONGODB_URI") {
      console.log(`${key}: ${value ? "✅ Set" : "❌ Missing"}`);
    } else {
      console.log(`${key}: ${value}`);
    }
  }

  const missing = Object.entries(required).filter(
    ([key, value]) => key !== "MONGODB_DB_NAME" && (value === "❌ Missing" || !value)
  );

  if (missing.length > 0) {
    console.log(`\n❌ Missing environment variables: ${missing.map(([k]) => k).join(", ")}`);
    return false;
  }

  console.log("\n✅ All required environment variables are set\n");
  return true;
}

async function verifyEmbeddingDimensions() {
  console.log("🔍 Verifying embedding dimensions...\n");

  try {
    const testEmbedding = await embedText("test");
    const dimensions = testEmbedding.length;
    console.log(`✅ Embedding dimensions: ${dimensions}`);
    console.log(`   Model: voyage-large-2`);
    console.log(`   ⚠️  Ensure your vector index uses exactly ${dimensions} dimensions\n`);
    return dimensions;
  } catch (error) {
    console.error(`❌ Failed to generate embedding: ${error instanceof Error ? error.message : error}\n`);
    return null;
  }
}

async function verifyVectorIndex(dimensions: number | null) {
  if (!dimensions) {
    console.log("⚠️  Skipping vector index verification (embedding test failed)\n");
    return false;
  }

  console.log("🔍 Verifying vector search index...\n");

  try {
    const db = await getDb();
    const collection = db.collection("decisions");

    // Try to run a vector search query
    const testEmbedding = await embedText("test query for index verification");
    
    if (testEmbedding.length !== dimensions) {
      console.log(`❌ Embedding dimension mismatch: expected ${dimensions}, got ${testEmbedding.length}\n`);
      return false;
    }

    const results = await findSimilarDecisions(testEmbedding, 1);
    console.log(`✅ Vector search index is working`);
    console.log(`   Index name: vector_index`);
    console.log(`   Field path: embedding`);
    console.log(`   Dimensions: ${dimensions}`);
    console.log(`   Test query returned: ${results.length} result(s)\n`);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("index") || errorMsg.includes("vector")) {
      console.error(`❌ Vector search index error: ${errorMsg}`);
      console.error(`   Make sure you have created the vector_index in MongoDB Atlas`);
      console.error(`   Collection: decisions`);
      console.error(`   Field path: embedding`);
      console.error(`   Dimensions: ${dimensions}\n`);
    } else {
      console.error(`❌ Vector search failed: ${errorMsg}\n`);
    }
    return false;
  }
}

async function main() {
  console.log("🚀 Visibl Setup Verification\n");
  console.log("=" .repeat(50) + "\n");

  const envOk = await verifyEnvironmentVariables();
  if (!envOk) {
    process.exit(1);
  }

  const dimensions = await verifyEmbeddingDimensions();
  const indexOk = await verifyVectorIndex(dimensions);

  console.log("=" .repeat(50));
  if (envOk && dimensions && indexOk) {
    console.log("\n✅ All checks passed! Your setup is ready.\n");
    process.exit(0);
  } else {
    console.log("\n❌ Some checks failed. Please fix the issues above.\n");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Verification script failed:", error);
  process.exit(1);
});
