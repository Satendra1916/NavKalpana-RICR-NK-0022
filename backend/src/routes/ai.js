// File: backend/src/routes/ai.js
// ✅ READY-TO-COPY (CommonJS) — Node v24 compatible
// Mount at: app.use("/api/ai", require("./routes/ai"))
//
// Provides:
//   GET  /api/ai/ai-test
//   POST /api/ai/resume
//   POST /api/ai/resume/analyze
//   POST /api/ai/resume/extract
//   POST /api/ai/interview
//   POST /api/ai/career
//   GET  /api/ai/dashboard/analytics
//
// ✅ Fix included:
// - Resume Analyze: strengths ONLY positive, weaknesses ONLY gaps
// - Auto-correct: if negative lines slip into strengths, move to weaknesses
// - Analytics: userId stored as STRING for google/local users

const express = require("express");
const router = express.Router();

const multer = require("multer");
const mammoth = require("mammoth");

const AnalyticsEvent = require("../models/AnalyticsEvent");

// ---------- Groq (OpenAI-compatible SDK) ----------
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const upload = multer({ storage: multer.memoryStorage() });

// ---------- PDF.js loader (Node v24 compatible) ----------
let _pdfjs = null;

async function getPdfJs() {
  if (_pdfjs) return _pdfjs;

  const candidates = ["pdfjs-dist/legacy/build/pdf.mjs", "pdfjs-dist/build/pdf.mjs"];
  let lastErr = null;

  for (const p of candidates) {
    try {
      const mod = await import(p);
      const lib = mod?.default || mod;
      if (lib?.getDocument) {
        _pdfjs = lib;
        return _pdfjs;
      }
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(
    "pdfjs-dist module not found for known paths. " + (lastErr ? String(lastErr) : "")
  );
}

// ---------- helpers ----------
function safeUserId(req) {
  const uid = String(
    (req.user?._id && String(req.user._id)) ||
    req.user?.id ||
    req.user?._json?.sub ||
    ""
  ).trim();

  return uid || null;
}

async function trackEvent(req, type, meta = {}) {
  try {
    const uid = safeUserId(req);
    if (!uid) return;

    await AnalyticsEvent.create({
      userId: uid, // ✅ always string
      type,
      meta,
    });
  } catch (e) {
    console.log("Analytics save failed:", e?.message || e);
  }
}

function pickJsonBlock(text) {
  const t = String(text || "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return t.slice(start, end + 1);
  return t;
}

function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

// ✅ If AI mistakenly puts negative points in strengths, move them to weaknesses
function looksNegative(s = "") {
  const t = String(s).toLowerCase();
  return (
    t.includes("no ") ||
    t.includes("lack") ||
    t.includes("not ") ||
    t.includes("missing") ||
    t.includes("minimal") ||
    t.includes("insufficient") ||
    t.includes("not relevant") ||
    t.includes("none") ||
    t.includes("without")
  );
}

function normalizeBullets(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 30);
}

// ================= AI TEST =================
router.get("/ai-test", async (req, res) => {
  try {
    const response = await openai.responses.create({
      model: "llama-3.1-8b-instant",
      input: "Reply with just: AI OK",
    });
    return res.json({ ok: true, text: response.output_text });
  } catch (e) {
    console.error("AI TEST ERROR:", e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// ================= Resume Improve (REAL AI - Groq) =================
router.post("/resume", async (req, res) => {
  try {
    const { role = "Software Developer", resumeText = "" } = req.body || {};
    if (!String(resumeText).trim()) {
      return res.status(400).json({ error: "resumeText is required" });
    }

    const response = await openai.responses.create({
      model: "llama-3.1-8b-instant",
      instructions:
        "You are an ATS resume coach. DO NOT rewrite the resume. " +
        "Analyze the resume and give improvement suggestions only. " +
        "Return STRICT JSON with this schema: { suggestions: string[], summary: string }",
      input: `
TARGET ROLE: ${role}

RESUME:
${resumeText}

TASK:
- Do NOT rewrite resume
- Give improvement suggestions
- Focus on ATS, impact, keywords
- Keep suggestions actionable
`,
    });

    await trackEvent(req, "RESUME_AI", { feature: "resume_improve", role });

    const raw = String(response.output_text || "").trim();
    const jsonText = pickJsonBlock(raw);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return res.status(500).json({ error: "AI did not return valid JSON" });
    }

    return res.json(parsed);
  } catch (e) {
    console.error("RESUME AI ERROR:", e);
    return res.status(500).json({ error: "AI failed", detail: String(e?.message || e) });
  }
});

// ================= Resume Analyze (REAL AI - Groq) =================
router.post("/resume/analyze", async (req, res) => {
  try {
    const { role = "Software Developer", resumeText = "" } = req.body || {};
    if (!String(resumeText).trim()) {
      return res.status(400).json({ error: "resumeText is required" });
    }

    const prompt = `
You are an ATS resume reviewer for the target role.
Return STRICT JSON only (no markdown, no extra text) with this schema:

{
  "fitScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "missingKeywords": string[],
  "improvements": string[]
}

Rules (VERY IMPORTANT):
- strengths MUST contain only positive evidence explicitly present in the resume text.
- DO NOT put missing items in strengths. No negative wording in strengths.
- weaknesses MUST contain only gaps / missing info / problems.
- Keep each bullet short (max 12 words).
- fitScore must be 0-100.
- missingKeywords: 8-20 keywords relevant to role.
- improvements: 6-12 actionable steps.
`;

    const response = await openai.responses.create({
      model: "llama-3.1-8b-instant",
      input: `${prompt}\n\nTARGET ROLE:\n${role}\n\nRESUME:\n${resumeText}`,
    });

    const raw = String(response.output_text || "").trim();
    const jsonText = pickJsonBlock(raw);

    let out;
    try {
      out = JSON.parse(jsonText);
    } catch {
      console.error("ANALYZE JSON PARSE FAIL:", raw);
      return res.status(500).json({
        error: "AI did not return valid JSON",
        detail: "Try again (model sometimes adds extra text).",
      });
    }

    let strengths = normalizeBullets(out?.strengths);
    let weaknesses = normalizeBullets(out?.weaknesses);
    const missingKeywords = normalizeBullets(out?.missingKeywords).slice(0, 25);
    const improvements = normalizeBullets(out?.improvements).slice(0, 20);

    // move negative from strengths -> weaknesses
    const moved = [];
    strengths = strengths.filter((s) => {
      if (looksNegative(s)) {
        moved.push(s);
        return false;
      }
      return true;
    });
    if (moved.length) weaknesses = [...moved, ...weaknesses];

    if (strengths.length === 0) strengths = ["Basic resume text provided", "At least one project/role mentioned"];
    if (weaknesses.length === 0) weaknesses = ["Add more details to improve role match"];

    const payload = {
      fitScore: clamp(out?.fitScore ?? 0, 0, 100),
      strengths: strengths.slice(0, 10),
      weaknesses: weaknesses.slice(0, 10),
      missingKeywords,
      improvements,
    };

    await trackEvent(req, "RESUME_ANALYZE", { feature: "resume_analyze", role });

    return res.json(payload);
  } catch (e) {
    console.error("RESUME ANALYZE ERROR:", e);
    return res.status(500).json({ error: "Analyze failed", detail: String(e?.message || e) });
  }
});

// ================= Resume Extract (REAL) =================
router.post("/resume/extract", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const name = file.originalname || "resume";
    const ext = (name.split(".").pop() || "").toLowerCase();

    let extractedText = "";

    if (ext === "txt") {
      extractedText = file.buffer.toString("utf8");
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value || "";
    } else if (ext === "pdf") {
      const pdfjsLib = await getPdfJs();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(file.buffer) });
      const pdf = await loadingTask.promise;

      let text = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const strings = content.items.map((it) => it.str);
        text += strings.join(" ") + "\n";
      }
      extractedText = text;
    } else {
      return res.status(400).json({ message: "Unsupported file type. Use PDF/DOCX/TXT." });
    }

    extractedText = String(extractedText || "").replace(/\r/g, "").trim();

    await trackEvent(req, "RESUME_EXTRACT", { feature: "resume_extract", ext });

    return res.json({
      extractedText: extractedText || "(No text found in file)",
      meta: { fileName: name, fileType: file.mimetype, size: file.size },
    });
  } catch (err) {
    console.error("RESUME EXTRACT ERROR:", err);
    return res.status(500).json({ message: "Extraction failed", error: err?.stack || String(err) });
  }
});

// ================= Interview (REAL AI - Groq) =================
router.post("/interview", async (req, res) => {
  try {
    const { role = "Software Developer", message = "", history = [] } = req.body || {};
    if (!String(message).trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const historyText = Array.isArray(history)
      ? history
        .slice(-10)
        .map((h) => `${(h.role || "user").toUpperCase()}: ${h.text || ""}`)
        .join("\n")
      : "";

    const response = await openai.responses.create({
      model: "llama-3.1-8b-instant",
      instructions:
        "You are a strict but friendly mock interviewer. Ask ONE question at a time. " +
        "If user answers, give 2-3 line feedback then ask next question.",
      input: `Role: ${role}\n\nConversation:\n${historyText}\n\nUSER: ${message}`,
    });

    await trackEvent(req, "INTERVIEW_AI", { feature: "interview", role });

    return res.json({ reply: response.output_text });
  } catch (e) {
    console.error("INTERVIEW AI ERROR:", e);
    return res.status(500).json({ error: "AI failed", detail: String(e?.message || e) });
  }
});

// ================= Career Path (REAL AI - Groq) =================
router.post("/career", async (req, res) => {
  try {
    const profile = req.body?.profile || {};
    const raw = profile.raw || "";
    const skills = Array.isArray(profile.skills) ? profile.skills : [];

    const prompt = `
You are an AI career coach. Given a user profile, generate a personalized career plan.
Return STRICT JSON only (no markdown, no extra text) with this schema:

{
  "recommendedRoles": [
    { "name": string, "description": string, "whyFits": string, "fitScore": number }
  ],
  "skillGapAnalysis": {
    "alreadyHas": string[],
    "missingByRole": { "<roleName>": string[] }
  },
  "roadmap": {
    "3months": [{ "task": string, "weeklyHours": number }],
    "6months": [{ "task": string, "weeklyHours": number }],
    "12months": [{ "task": string, "weeklyHours": number }]
  },
  "resources": [{ "skill": string, "types": string[] }],
  "checkpoints": string[]
}

Rules:
- FitScore 0-100
- Use provided skills + raw profile text
- Keep concise but useful
`;

    const response = await openai.responses.create({
      model: "llama-3.1-8b-instant",
      input: `${prompt}\n\nUSER PROFILE:\nraw: ${raw}\nskills: ${skills.join(", ")}`,
    });

    const rawText = String(response.output_text || "").trim();
    const jsonText = pickJsonBlock(rawText);

    let json;
    try {
      json = JSON.parse(jsonText);
    } catch {
      return res.status(500).json({ error: "Career AI did not return valid JSON", detail: "Try again." });
    }

    await trackEvent(req, "CAREER_AI", { feature: "career_path" });

    return res.json(json);
  } catch (e) {
    console.error("CAREER AI ERROR:", e);
    return res.status(500).json({ error: "Career AI failed", detail: String(e?.message || e) });
  }
});

// ================= Dashboard Analytics =================
// Your frontend fetch uses: `${API}/api/ai/dashboard/analytics`
router.get("/dashboard/analytics", async (req, res) => {
  try {
    const uid = safeUserId(req); // ✅ string uid (google sub or mongo _id)

    // not logged-in => safe demo
    if (!uid) {
      return res.json({
        ok: true,
        stats: { resumesCreated: 0, mockInterviewsDone: 0, companiesSaved: 0, profileStrength: 0 },
        progress: 0,
        practiceOverTime: [],
        upcomingSessions: [],
      });
    }

    const [resumeAiCount, interviewCount] = await Promise.all([
      AnalyticsEvent.countDocuments({ userId: uid, type: "RESUME_AI" }),
      AnalyticsEvent.countDocuments({ userId: uid, type: "INTERVIEW_AI" }),
    ]);

    const stats = {
      resumesCreated: resumeAiCount,
      mockInterviewsDone: interviewCount,
      companiesSaved: 0,
      profileStrength: clamp(40 + resumeAiCount * 5 + interviewCount * 5, 0, 100),
    };

    const progress = clamp(10 + resumeAiCount * 10 + interviewCount * 10, 0, 100);

    return res.json({
      ok: true,
      stats,
      progress,
      practiceOverTime: [
        { month: "Jan", value: 1 },
        { month: "Feb", value: 2 },
        { month: "Mar", value: 2 },
        { month: "Apr", value: 3 },
        { month: "May", value: 4 },
        { month: "Jun", value: 5 },
      ],
      upcomingSessions: [
        { date: "Feb 24", title: "Behavioral Interview", link: "" },
        { date: "Feb 26", title: "Coding Challenge", link: "" },
        { date: "Mar 1", title: "Career Coaching", link: "" },
      ],
    });
  } catch (e) {
    console.error("DASHBOARD ANALYTICS ERROR:", e);
    return res.status(500).json({ ok: false, error: "dashboard analytics failed" });
  }
});

module.exports = router;