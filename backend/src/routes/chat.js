import express from "express";
import { retrieveRelevantChunks } from "../services/retrieval.js";
import { generateAnswer } from "../services/answer.js";

const router = express.Router();

// POST /api/chat
// body: { documentId, question }
router.post("/", async (req, res) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({ error: "documentId and question are required" });
    }

    const relevantChunks = await retrieveRelevantChunks(question, documentId);
    const answer = await generateAnswer(question, relevantChunks);

    res.json({
      answer,
      sources: relevantChunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        score: c.score,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate answer" });
  }
});

export default router;