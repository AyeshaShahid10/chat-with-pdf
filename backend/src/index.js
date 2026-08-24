import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import documentsRouter from "./routes/documents.js";

dotenv.config(); // loads variables from .env into process.env

app.use("/api/documents", documentsRouter);

const app = express();
app.use(cors());        // allow requests from other origins (our React app later)
app.use(express.json()); // parse incoming JSON request bodies

// simple health check route — proves the server is alive
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});