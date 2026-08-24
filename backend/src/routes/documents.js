import express from "express";
import multer from "multer";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const router = express.Router();

// tell multer where to save uploaded files, and how to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// POST /api/documents/upload
// 'file' must match the field name the frontend sends
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // read the saved PDF and extract its text
    const dataBuffer = fs.readFileSync(req.file.path);
    const parsed = await pdfParse(dataBuffer);

    res.json({
      filename: req.file.originalname,
      pages: parsed.numpages,
      textPreview: parsed.text.slice(0, 500), // just first 500 chars for now
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

export default router;