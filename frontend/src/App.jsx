import { useState, useEffect } from "react";
import Auth from "./Auth";

function App() {
  const [backendStatus, setBackendStatus] = useState("checking...");
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userEmail, setUserEmail] = useState(localStorage.getItem("email"));
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Chat-related state
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', text }
  const [asking, setAsking] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setToken(null);
    setUserEmail(null);
    setUploadResult(null);
    setSelectedDocument(null);
    setDocuments([]);
    setMessages([]);
  };

  useEffect(() => {
    fetch("http://localhost:4000/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message))
      .catch(() => setBackendStatus("Could not reach backend"));
  }, []);

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:4000/api/documents", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch(() => setDocuments([]));
  }, [token]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadResult(null);
    setError(null);
    setMessages([]); // reset chat when a new file is chosen
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:4000/api/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setUploadResult(data);
      setSelectedDocument(data);
      setMessages([]);

      // Refresh the document list to include this new upload
      fetch("http://localhost:4000/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((docs) => setDocuments(docs));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || !selectedDocument) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setAsking(true);

    try {
      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentId: selectedDocument.documentId || selectedDocument._id,
          question: userMessage.text,
        }),
      });
      if (!res.ok) throw new Error("Failed to get answer");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${err.message}` },
      ]);
    } finally {
      setAsking(false);
    }
  };

  // Let users press Enter to send, instead of only clicking a button
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !asking) {
      handleAsk();
    }
  };

  if (!token) {
    return <Auth onAuthSuccess={(t, e) => { setToken(t); setUserEmail(e); }} />;
  }

  // Normalize field names — a fresh upload response uses "pages"/"chunkCount",
  // while a document from the list uses "pageCount". This lets the summary box
  // below work no matter which source selectedDocument came from.
  const displayName = selectedDocument?.filename;
  const displayPages = selectedDocument?.pages ?? selectedDocument?.pageCount;
  const displayChunkCount = selectedDocument?.chunkCount;

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 600 }}>
      <h1>Chat with your PDF</h1>
      <p>Backend status: {backendStatus}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Logged in as {userEmail}</span>
        <button onClick={handleLogout}>Log out</button>
      </div>

      <hr style={{ margin: "1.5rem 0" }} />

      <h2>Upload a PDF</h2>

      {documents.length > 0 && (
        <div style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
          <h3>Your documents</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {documents.map((doc) => (
              <li key={doc._id} style={{ marginBottom: "0.5rem" }}>
                <button
                  onClick={() => {
                    setSelectedDocument(doc);
                    setUploadResult(null); // clear stale upload-only data
                    setMessages([]); // fresh conversation when switching documents
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.5rem",
                    background: selectedDocument?._id === doc._id ? "#0070f3" : "#f0f0f0",
                    color: selectedDocument?._id === doc._id ? "white" : "black",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {doc.filename} ({doc.pageCount} pages)
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading} style={{ marginLeft: "1rem" }}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {selectedDocument && (
        <div style={{ marginTop: "1rem", background: "#f5f5f5", padding: "1rem" }}>
          <p><strong>Filename:</strong> {displayName}</p>
          <p><strong>Pages:</strong> {displayPages}</p>
          {displayChunkCount != null && (
            <p><strong>Chunks created:</strong> {displayChunkCount}</p>
          )}
          <p style={{ color: "green" }}>✓ Ready to chat with this document</p>
        </div>
      )}

      {selectedDocument && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Ask a question</h2>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1rem",
              minHeight: "150px",
              maxHeight: "400px",
              overflowY: "auto",
              marginBottom: "1rem",
            }}
          >
            {messages.length === 0 && (
              <p style={{ color: "#888" }}>Ask something about the document...</p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  textAlign: msg.role === "user" ? "right" : "left",
                  margin: "0.5rem 0",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    background: msg.role === "user" ? "#0070f3" : "#e5e5e5",
                    color: msg.role === "user" ? "white" : "black",
                    padding: "0.5rem 1rem",
                    borderRadius: "12px",
                    maxWidth: "80%",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {asking && <p style={{ color: "#888" }}>Thinking...</p>}
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              style={{ flex: 1, padding: "0.5rem" }}
              disabled={asking}
            />
            <button onClick={handleAsk} disabled={asking || !question.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;