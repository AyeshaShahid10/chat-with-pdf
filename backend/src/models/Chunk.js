import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
  text: String,
  embedding: [Number], // the vector, stored as an array of numbers
  chunkIndex: Number,  // its order within the document
});

export default mongoose.model("Chunk", chunkSchema);