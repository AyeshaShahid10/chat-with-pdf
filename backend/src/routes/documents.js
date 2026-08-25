import express from "express";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";
import Document from "../models/Document.js";
import Chunk from "../models/Chunk.js";
import { chunkText } from "../services/chunking.js";
import { embedChunks } from "../services/embeddings.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// POST /api/documents/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 1. Extract text from the PDF
    const dataBuffer = fs.readFileSync(req.file.path);
    const parsed = await pdfParse(dataBuffer);

    // 2. Save a Document record (metadata about the file)
    const document = await Document.create({
      filename: req.file.originalname,
      pageCount: parsed.numpages,
    });

    // 3. Split the extracted text into chunks
    const chunks = chunkText(parsed.text);
    console.log(`Split into ${chunks.length} chunks`);

    // 4. Turn each chunk into an embedding vector
    const vectors = await embedChunks(chunks);
    console.log(`Generated ${vectors.length} embeddings`);

    // 5. Save each chunk + its vector to MongoDB, linked to the document
    const chunkDocs = chunks.map((text, i) => ({
      documentId: document._id,
      text,
      embedding: vectors[i],
      chunkIndex: i,
    }));
    await Chunk.insertMany(chunkDocs);

    // 6. Respond with a summary (not the full text/vectors — too big)
    res.json({
      documentId: document._id,
      filename: document.filename,
      pages: document.pageCount,
      chunkCount: chunks.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

export default router;