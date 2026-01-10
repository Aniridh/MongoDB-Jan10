/**
 * Atlas Vector Search implementation
 */

import { getDb } from "./db";
import { Decision } from "./types";

export interface SimilarDecision extends Decision {
  score: number;
}

export async function findSimilarDecisions(
  embedding: number[],
  limit: number = 5
): Promise<SimilarDecision[]> {
  if (!embedding || embedding.length === 0) {
    return [];
  }

  const db = await getDb();
  const collection = db.collection<Decision>("decisions");

  const pipeline = [
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: embedding,
        numCandidates: Math.max(limit * 10, 100),
        limit: limit,
      },
    },
    {
      $addFields: {
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  try {
    const results = await collection.aggregate<SimilarDecision>(pipeline).toArray();
    return results || [];
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("index") || errorMsg.includes("vector") || errorMsg.includes("$vectorSearch")) {
      throw new Error(`Vector search index error: ${errorMsg}. Make sure the 'vector_index' exists on the 'decisions' collection with field path 'embedding'.`);
    }
    throw error;
  }
}
