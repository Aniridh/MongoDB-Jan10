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
  const db = await getDb();
  const collection = db.collection<Decision>("decisions");

  const pipeline = [
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: embedding,
        numCandidates: limit * 10,
        limit: limit,
      },
    },
    {
      $addFields: {
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  const results = await collection.aggregate<SimilarDecision>(pipeline).toArray();
  return results;
}
