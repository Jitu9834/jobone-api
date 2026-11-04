// JobOne API v0.2 — Adzuna (India) proxy with CORS, validation and a small cache.
// Keys live in Render environment variables, never in the code or the repo.
import express from "express";
import cors from "cors";

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const COUNTRY = process.env.ADZUNA_COUNTRY || "in";
// Comma-separated list of allowed sites, e.g. https://jitu9834.github.io
const ORIGINS = (process.env.ALLOWED_ORIGINS || "https://jitu9834.github.io")
  .split(",").map(s => s.trim()).filter(Boolean);

const app = express();
app.use(cors({ origin: ORIGINS }));

// Tiny in-memory cache (5 min) so repeat searches don't burn API quota.
const cache = new Map();
const TTL = 5 * 60 * 1000;

app.get("/", (_req, res) => res.json({ service: "jobone-api", ok: true, configured: Boolean(APP_ID && APP_KEY) }));

app.get("/api/jobs", async (req, res) => {
  if (!APP_ID || !APP_KEY) {
    return res.status(503).json({ error: "Server missing ADZUNA_APP_ID / ADZUNA_APP_KEY." });
  }
  const what = String(req.query.q || "").slice(0, 100);
  const where = String(req.query.location || "").slice(0, 100);
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 50);
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);

  const cacheKey = JSON.stringify([what, where, page, days]);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.t < TTL) return res.json(hit.data);

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/${page}`);
  url.searchParams.set("app_id", APP_ID);
  url.searchParams.set("app_key", APP_KEY);
  url.searchParams.set("results_per_page", "20");
  url.searchParams.set("max_days_old", String(days));
  url.searchParams.set("sort_by", "date");
  url.searchParams.set("content-type", "application/json");
  if (what) url.searchParams.set("what", what);
  if (where) url.searchParams.set("where", where);

  try {
    const upstream = await fetch(url, { headers: { Accept: "application/json" } });
    if (!upstream.ok) {
      return res.status(502).json({ error: "Job source error", status: upstream.status });
    }
    const raw = await upstream.json();
    const data = {
      total: raw.count ?? 0,
      page,
      source: "Adzuna",
      jobs: (raw.results || []).map(j => ({
        id: String(j.id),
        title: j.title || "",
        company: j.company?.display_name || "",
        location: j.location?.display_name || "",
        snippet: j.description || "",
        url: j.redirect_url || "",
        posted: j.created || "",
        salaryMin: j.salary_min ?? null,
        salaryMax: j.salary_max ?? null,
        type: j.contract_time || ""
      }))
    };
    if (cache.size > 500) cache.clear();
    cache.set(cacheKey, { t: Date.now(), data });
    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch {
    res.status(502).json({ error: "Could not reach job source." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`JobOne API on :${port}`));
