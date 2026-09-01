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
// Small helper: pauses execution for a given number of milliseconds
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Embeds many chunks, one at a time, with a short delay between each call
// to stay under free-tier rate limits. Retries with backoff if we still hit one.
export async function embedChunks(chunks) {
  const vectors = [];

  for (let i = 0; i < chunks.length; i++) {
    let attempt = 0;
    let success = false;

    while (!success && attempt < 5) {
      try {
        const vector = await embedText(chunks[i]);
        vectors.push(vector);
        success = true;
      } catch (err) {
        // 429 = rate limit exceeded — wait longer each retry (exponential backoff)
        if (err.status === 429) {
          attempt++;
          const waitTime = 2000 * attempt; // 2s, 4s, 6s, 8s, 10s
          console.log(`Rate limited, retrying chunk ${i} in ${waitTime}ms (attempt ${attempt})`);
          await sleep(waitTime);
        } else {
          throw err; // some other error — don't silently swallow it
        }
      }
    }

    if (!success) {
      throw new Error(`Failed to embed chunk ${i} after multiple retries`);
    }

    // Small pause between every chunk, even successful ones, to avoid
    // tripping the per-minute limit in the first place
    await sleep(1500);
  }

  return vectors;
}