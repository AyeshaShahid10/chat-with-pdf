import { useState, useEffect } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("checking...");
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message))
      .catch(() => setBackendStatus("Could not reach backend"));
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    // FormData is how browsers package files for upload —
    // matches what multer expects on the backend
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:4000/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setUploadResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 600 }}>
      <h1>Chat with your PDF</h1>
      <p>Backend status: {backendStatus}</p>

      <hr style={{ margin: "1.5rem 0" }} />

      <h2>Upload a PDF</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading} style={{ marginLeft: "1rem" }}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {uploadResult && (
        <div style={{ marginTop: "1rem", background: "#f5f5f5", padding: "1rem" }}>
          <p><strong>Filename:</strong> {uploadResult.filename}</p>
          <p><strong>Pages:</strong> {uploadResult.pages}</p>
          <p><strong>Preview:</strong> {uploadResult.textPreview}</p>
        </div>
      )}
    </div>
  );
}

export default App;