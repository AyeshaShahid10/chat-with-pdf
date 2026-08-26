import Chunk from "../models/Chunk.js";
import { embedText } from "./embeddings.js";
import { cosineSimilarity } from "./similarity.js";

// Given a question and a documentId, find the most relevant chunks.
export async function retrieveRelevantChunks(question, documentId, topK = 3) {
  // 1. Turn the question into a vector, same way we embedded the chunks
  const questionVector = await embedText(question);

  // 2. Get all chunks belonging to this document
  const chunks = await Chunk.find({ documentId });

  // 3. Score each chunk against the question
  const scored = chunks.map((chunk) => ({
    text: chunk.text,
    chunkIndex: chunk.chunkIndex,
    score: cosineSimilarity(questionVector, chunk.embedding),
  }));

  // 4. Sort by score, descending — best matches first
  scored.sort((a, b) => b.score - a.score);

  // 5. Return only the top K
  return scored.slice(0, topK);
}