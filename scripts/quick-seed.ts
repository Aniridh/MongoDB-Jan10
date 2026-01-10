/**
 * Quick memory seeding script - minimal output
 * Run with: npx tsx scripts/quick-seed.ts
 */

const API_URL = process.env.API_URL || "http://localhost:3000";

const BUGGY_ARTIFACT = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`;

const MODIFIED_ARTIFACT = `function calculateTotal(items) {
  let total = 0;
  if (!items || items.length === 0) return 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * (items[i].quantity || 1);
  }
  return total;
}`;

async function analyze(artifactContent: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ artifactContent }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

async function main() {
  console.log("🌱 Quick seeding...\n");
  
  // Run 1
  console.log("Run 1...");
  const r1 = await analyze(BUGGY_ARTIFACT);
  console.log(`✅ Created ${r1.decisions.length} decision(s)`);
  
  // Wait for indexing
  await new Promise((r) => setTimeout(r, 3000));
  
  // Run 2
  console.log("Run 2...");
  const r2 = await analyze(MODIFIED_ARTIFACT);
  console.log(`✅ Created ${r2.decisions.length} decision(s)`);
  
  // Check rationale
  const rationale = r2.decisions[0]?.rationale || "";
  const mentionsPrevious = /previous|similar|past|earlier|prior/i.test(rationale);
  
  console.log(`\nVector search: ${mentionsPrevious ? "✅ Working" : "⚠️  Check setup"}`);
  console.log(`Total decisions: ${r1.decisions.length + r2.decisions.length}\n`);
  
  if (mentionsPrevious) {
    console.log("✅ Historian referenced previous decisions!");
    console.log(`Sample: "${rationale.substring(0, 150)}..."\n`);
  }
}

main().catch(console.error);
