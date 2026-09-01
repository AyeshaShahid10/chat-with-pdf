import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Core embedding call, with automatic retry + backoff on rate limits.
// Used by BOTH chunk embedding (upload) and question embedding (chat) —
// previously only chunks had this protection, which is why chat crashed instantly.
async function embedTextWithRetry(text, maxAttempts = 5) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      const result = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
      });
      return result.embeddings[0].values;
    } catch (err) {
      if (err.status === 429) {
        attempt++;
        // Free-tier quotas reset per minute, so short backoffs aren't enough —
        // wait close to a full minute on later attempts.
        const waitTime = Math.min(15000 * attempt, 65000);
        console.log(`Rate limited on embedding, waiting ${waitTime}ms (attempt ${attempt})`);
        await sleep(waitTime);
      } else {
        throw err;
      }
    }
  }

  throw new Error("Embedding failed after multiple retries due to rate limiting");
}

// Public function used elsewhere in the app for a single piece of text
export async function embedText(text) {
  return embedTextWithRetry(text);
}

// Embeds many chunks, one at a time, with a pause between each
// to avoid tripping the per-minute quota in the first place.
export async function embedChunks(chunks) {
  const vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    const vector = await embedTextWithRetry(chunks[i]);
    vectors.push(vector);
    await sleep(4000); // pace ourselves between chunks
  }

  return vectors;
}