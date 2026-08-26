import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Builds a prompt from retrieved chunks + the user's question,
// and asks Gemini to answer using ONLY that context.
export async function generateAnswer(question, relevantChunks) {
  const context = relevantChunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.text}`)
    .join("\n\n");

  const prompt = `You are answering questions based ONLY on the provided document context.
If the answer isn't in the context, say "I couldn't find that in the document" — do not make anything up.

Context from the document:
${context}

Question: ${question}

Answer:`;

  const result = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  return result.text;
}