/**
 * Voyage AI embeddings implementation
 */

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY environment variable is not set");
  }

  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: "voyage-large-2",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Voyage AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error("Invalid response from Voyage AI API: missing embedding data");
  }

  const embedding = data.data[0].embedding;
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Invalid embedding returned from Voyage AI API");
  }

  return embedding;
}
