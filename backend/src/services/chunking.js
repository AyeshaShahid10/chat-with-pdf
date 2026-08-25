// Splits a long text into overlapping chunks by word count.
// Overlap helps preserve context across chunk boundaries.
export function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/); // split on whitespace
  const chunks = [];

  let start = 0;
  while (start < words.length) {
    const end = start + chunkSize;
    const chunkWords = words.slice(start, end);
    chunks.push(chunkWords.join(" "));

    if (end >= words.length) break;
    start = end - overlap; // step back a bit so chunks overlap
  }

  return chunks;
}