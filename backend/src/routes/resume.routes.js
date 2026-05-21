// backend/src/routes/resume.analyze.js
const express = require("express");
const requireAuth = require("../middleware/requireAuth");

// ✅ try to load groqChat in a safe way (works even if groq.js exports differently)
let groqChat = null;
try {
  const g = require("../utils/groq");
  groqChat = g?.groqChat || g?.default || g;
} catch (e) {
  groqChat = null;
}

const router = express.Router();

/**
 * POST /api/resume/analyze
 * body: { role: string, resumeText: string }
 */
router.post("/analyze", requireAuth, async (req, res) => {
  try {
    const { role, resumeText } = req.body || {};

    if (!role || typeof role !== "string") {
      return res.status(400).json({ ok: false, error: "role is required" });
    }
    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 30) {
      return res.status(400).json({ ok: false, error: "resumeText is required (min 30 chars)" });
    }

    // ✅ If groqChat is available, use AI analyzer
    if (typeof groqChat === "function") {
      const system = `
You are an expert resume reviewer and ATS optimizer.
Return STRICT JSON ONLY (no markdown, no extra text).
The JSON schema must be exactly:
{
  "fitScore": number,
  "atsScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "missingKeywords": string[],
  "grammarIssues": string[],
  "improvements": string[],
  "rewriteSuggestions": {
     "summary": string,
     "projectBullets": string[]
  }
}
Rules:
- Keep arrays 4-10 items (except missingKeywords can be 5-20).
- Do NOT invent fake companies or experience.
- If something is unknown, make safe suggestions without fabricating facts.
`;

      const user = `Target Role: ${role}\n\nResume Text:\n${resumeText}\n`;

      const raw = await groqChat({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      });

      let json;
      try {
        json = JSON.parse(raw);
      } catch (e) {
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          json = JSON.parse(raw.slice(start, end + 1));
        } else {
          return res.status(500).json({ ok: false, error: "AI returned invalid JSON", raw });
        }
      }

      const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));
      json.fitScore = clamp(json.fitScore);
      json.atsScore = clamp(json.atsScore);

      return res.json({ ok: true, result: json });
    }

    // ✅ fallback (if groqChat not available) — basic response so API never breaks
    return res.json({
      ok: true,
      result: {
        fitScore: 50,
        atsScore: 50,
        strengths: ["Resume analyzer service is running."],
        weaknesses: ["AI analyzer not available (groqChat not loaded)."],
        missingKeywords: [],
        grammarIssues: [],
        improvements: ["Fix groqChat export in backend/src/utils/groq.js OR install/configure it."],
        rewriteSuggestions: { summary: "", projectBullets: [] },
      },
    });
  } catch (err) {
    console.error("Resume analyze error:", err);
    return res.status(500).json({ ok: false, error: "Resume analyze failed" });
  }
});

module.exports = router;