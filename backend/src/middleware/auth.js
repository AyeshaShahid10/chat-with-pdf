import jwt from "jsonwebtoken";

// Protects routes — checks for a valid JWT in the Authorization header,
// and attaches the decoded userId to req for downstream handlers to use.
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next(); // proceed to the actual route handler
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}