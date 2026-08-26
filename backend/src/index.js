import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import documentsRouter from "./routes/documents.js";
import mongoose from "mongoose";
import chatRouter from "./routes/chat.js";

dotenv.config({ quiet: true });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected Successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

app.use(cors());         // allow requests from other origins (our React app)
app.use(express.json()); // parse incoming JSON request bodies
app.use("/api/documents", documentsRouter); // our upload/PDF routes
app.use("/api/chat", chatRouter); // our chat route

// simple health check route — proves the server is alive
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});