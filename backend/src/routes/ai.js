const express = require("express");
const router = express.Router();

const multer = require("multer");
const mammoth = require("mammoth");

// ---------- Groq (OpenAI-compatible) ----------
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

  const candidates = [
    "pdfjs-dist/legacy/build/pdf.mjs",
    "pdfjs-dist/build/pdf.mjs",
  ];

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

// ================= AI TEST (route check) =================
// ================= AI TEST (REAL) =================
router.get("/ai-test", async (req, res) => {
  try {
    const response = await openai.responses.create({
      model: "llama-3.1-8b-instant" ,
      input: "Reply with just: AI OK",
    });

    res.json({ ok: true, text: response.output_text });
  } catch (e) {
    console.error("AI TEST ERROR:", e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// ================= Resume Improve (REAL AI - Groq) =================
router.post("/resume", async (req, res) => {
  try {
    const { role = "Software Developer", resumeText = "" } = req.body || {};
    if (!resumeText.trim()) {
      return res.status(400).json({ error: "resumeText is required" });
    }

    const response = await openai.responses.create({
      model: "llama-3.1-8b-instant",
      instructions:
        "You are an expert resume writer. Improve the resume for the target role. ATS-friendly, action verbs, concise bullet points, quantify impact when possible. Return only improved resume text.",
      input: `Target role: ${role}\n\nResume:\n${resumeText}`,
    });

    return res.json({ improved: response.output_text });
  } catch (e) {
    console.error("RESUME AI ERROR:", e);
    return res.status(500).json({ error: "AI failed", detail: String(e?.message || e) });
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
      return res
        .status(400)
        .json({ message: "Unsupported file type. Use PDF/DOCX/TXT." });
    }

    extractedText = (extractedText || "").replace(/\r/g, "").trim();

    return res.json({
      extractedText: extractedText || "(No text found in file)",
      meta: {
        fileName: name,
        fileType: file.mimetype,
        size: file.size,
      },
    });
  } catch (err) {
    console.error("RESUME EXTRACT ERROR:", err);
    return res.status(500).json({
      message: "Extraction failed",
      error: err?.stack || String(err),
    });
  }
});

// ================= Interview (REAL AI - Groq) =================
router.post("/interview", async (req, res) => {
  try {
    const { role = "Software Developer", message = "", history = [] } = req.body || {};
    if (!message.trim()) {
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
        "You are a strict but friendly mock interviewer. Ask one question at a time. After each user answer, give short feedback and then ask the next question.",
      input: `Role: ${role}\n\nConversation:\n${historyText}\n\nUSER: ${message}`,
    });

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
- Use the provided skills and raw profile text.
- Make it DIFFERENT when inputs differ.
- Keep it concise but useful.
`;

    const response = await openai.responses.create({
      model: "llama-3.1-8b-instant",
      input: `${prompt}\n\nUSER PROFILE:\nraw: ${raw}\nskills: ${skills.join(", ")}`,
    });

    // Try to parse strict JSON
    const text = (response.output_text || "").trim();

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      // fallback: extract JSON block if model adds text
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        json = JSON.parse(text.slice(start, end + 1));
      } else {
        throw new Error("AI did not return valid JSON");
      }
    }

    return res.json(json);
  } catch (e) {
    console.error("CAREER AI ERROR:", e);
    return res.status(500).json({
      error: "Career AI failed",
      detail: String(e?.message || e),
    });
  }
});

// ================= Dashboard Analytics =================
router.get("/dashboard/analytics", (req, res) => {
  res.json({
    stats: {
      resumesCreated: 12,
      mockInterviewsDone: 8,
      companiesSaved: 15,
      profileStrength: 78,
    },
    progress: 45,
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
});

module.exports = router;