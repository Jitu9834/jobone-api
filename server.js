// JobOne Phase 2 starter backend (Node.js 18+)
import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.static("public"));

app.get("/api/jobs", async (req, res) => {
  const key = process.env.JOBVETTA_API_KEY;
  if (!key) return res.status(503).json({ error: "Add JOBVETTA_API_KEY to .env first." });

  const q = String(req.query.q || "").slice(0, 100);
  const location = String(req.query.location || "").slice(0, 100);
  const days = Math.min(Math.max(Number(req.query.days || 30), 1), 365);

  try {
    const url = new URL("https://api.jobvetta.com/v1/jobs");
    if (q) url.searchParams.set("q", q);
    if (location) url.searchParams.set("location", location);
    url.searchParams.set("days", String(days));
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: "Job source error", details: data });
    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: "Could not reach job source." });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`JobOne running at http://localhost:${port}`));
