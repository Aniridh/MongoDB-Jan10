import { NextRequest, NextResponse } from "next/server";

/**
 * Extract text from an uploaded image using a vision model
 * Accepts base64 encoded image and returns extracted text
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required and must be a string" },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const apiKey = process.env.LLM_API_KEY;
    const apiBaseUrl = process.env.LLM_API_BASE_URL || "";
    const model = process.env.LLM_MODEL || "";

    if (!apiKey || !apiBaseUrl || !model) {
      return NextResponse.json(
        { error: "LLM API configuration is missing" },
        { status: 500 }
      );
    }

    // Detect if using Gemini native API (vs OpenAI-compatible service)
    const isGeminiNative =
      apiBaseUrl.includes("generativelanguage.googleapis.com") ||
      model.toLowerCase().startsWith("gemini");

    let extractedText: string;

    if (isGeminiNative) {
      // Gemini native API with vision support
      // Vision-capable models (gemini-1.5-*) require v1 API, not v1beta
      let visionApiUrl = apiBaseUrl;
      if (apiBaseUrl.includes("v1beta")) {
        // Switch to v1 API for vision models
        visionApiUrl = apiBaseUrl.replace("v1beta", "v1");
      }
      
      // Use the user's configured model - they should set LLM_MODEL to a vision-capable model
      // like gemini-1.5-pro or gemini-1.5-flash if they want to use vision features
      const url = `${visionApiUrl}/models/${model}:generateContent?key=${apiKey}`;

      const prompt = `Analyze this engineering diagram, blueprint, or design artifact image. Extract all text, code, labels, annotations, and describe the structure, components, and relationships you see. 

IMPORTANT: Output ALL text in English only. If the image contains text in other languages (Russian, Chinese, etc.), translate it to English. Translate all component labels, descriptions, and annotations to English. Format the output as clear, structured English text that can be analyzed like a design document.`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || "image/png",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new Error("Invalid response from Gemini API: missing candidates array");
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("Invalid response from Gemini API: missing content parts");
      }

      extractedText = candidate.content.parts[0].text || "";
    } else {
      // OpenAI-compatible API (assumes vision support like GPT-4 Vision)
      const url = apiBaseUrl.includes("/v1/") ? `${apiBaseUrl}/chat/completions` : `${apiBaseUrl}/chat/completions`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this engineering diagram, blueprint, or design artifact image. Extract all text, code, labels, annotations, and describe the structure, components, and relationships you see. IMPORTANT: Output ALL text in English only. If the image contains text in other languages (Russian, Chinese, etc.), translate it to English. Translate all component labels, descriptions, and annotations to English. Format the output as clear, structured English text that can be analyzed like a design document.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType || "image/png"};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      extractedText = data.choices[0]?.message?.content || "";
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Failed to extract text from image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ extractedText: extractedText.trim() });
  } catch (error) {
    console.error("Error extracting image:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
