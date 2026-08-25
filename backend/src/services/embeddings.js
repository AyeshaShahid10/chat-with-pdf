import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ quiet: true });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Turns a single piece of text into a vector (array of numbers).
export async function embedText(text) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  return result.embeddings[0].values; // the actual vector array
}

// Embeds many chunks at once, one by one.
// (Gemini also supports batching multiple texts in one call — we can optimize
// this later once the basic flow works.)
export async function embedChunks(chunks) {
  const vectors = [];
  for (const chunk of chunks) {
    const vector = await embedText(chunk);
    vectors.push(vector);
  }
  return vectors;
}