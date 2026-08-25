import { embedText } from "./services/embeddings.js";

const vector = await embedText("Hello world, this is a test sentence.");
console.log("Vector length:", vector.length);
console.log("First 5 values:", vector.slice(0, 5));