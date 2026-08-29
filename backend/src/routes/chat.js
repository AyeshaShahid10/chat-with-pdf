import express from "express";
import { retrieveRelevantChunks } from "../services/retrieval.js";
import { generateAnswer } from "../services/answer.js";
import { requireAuth } from "../middleware/auth.js";
import Document from "../models/Document.js";

const router = express.Router();

// POST /api/chat
// body: { documentId, question }
router.post("/", requireAuth, async (req, res) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({ error: "documentId and question are required" });
    }

    // Verify this document belongs to the logged-in user
    const document = await Document.findOne({ _id: documentId, userId: req.userId });
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
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