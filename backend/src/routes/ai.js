const express = require("express");
const router = express.Router();

const multer = require("multer");
const mammoth = require("mammoth");


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

// ================= Resume Improve (mock) =================
router.post("/resume", (req, res) => {
  res.json({
    improved: "AI improved resume content will appear here (mock).",
  });
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

// ================= Interview mock =================
router.post("/interview", (req, res) => {
  res.json({
    reply: "AI interview response (mock).",
  });
});

// ================= Career Path mock =================
router.post("/career", async (req, res) => {
  const profile = req.body?.profile || {};
  const skills = profile.skills || ["Java", "JavaScript", "SQL", "Web Basics"];

  const result = {
    recommendedRoles: [
      {
        name: "Backend Developer (Java / Spring Boot)",
        description: "Build APIs, auth, databases, scalable backend services.",
        whyFits: "You already know Java, SQL, and are building real web app flows.",
        fitScore: 86,
      },
      {
        name: "Full-Stack Developer (Next.js + Node.js)",
        description: "Build complete apps: UI + APIs + database + deployment.",
        whyFits: "You’re already using Next.js and Node/Express in your project.",
        fitScore: 82,
      },
      {
        name: "Software Engineer (DSA + Projects)",
        description: "General SDE track: strong CS + DSA + projects.",
        whyFits: "You’re learning DSA and doing projects.",
        fitScore: 78,
      },
    ],

    skillGapAnalysis: {
      alreadyHas: [...skills, "Basic Auth flow understanding", "Basic REST concepts"],
      missingByRole: {
        "Backend Developer (Java / Spring Boot)": [
          "Spring Boot deep (MVC, Security, JPA/Hibernate)",
          "API design + validation",
          "Caching basics",
          "Deployment basics",
        ],
        "Full-Stack Developer (Next.js + Node.js)": [
          "State management patterns",
          "Database modeling",
          "Deployment + env management",
        ],
        "Software Engineer (DSA + Projects)": [
          "150–300 DSA questions practice",
          "OOP + SOLID",
          "System Design basics",
          "OS / CN revision",
        ],
      },
    },

    roadmap: {
      "3months": [
        { task: "DSA foundations", weeklyHours: 8 },
        { task: "Java OOP mastery", weeklyHours: 5 },
        { task: "Build 1 REST project", weeklyHours: 6 },
        { task: "Git + README polish", weeklyHours: 2 },
      ],
      "6months": [
        { task: "2 solid projects", weeklyHours: 8 },
        { task: "Spring Boot + DB integration", weeklyHours: 6 },
        { task: "Weekly job applications", weeklyHours: 3 },
        { task: "Interview prep", weeklyHours: 4 },
      ],
      "12months": [
        { task: "System design basics", weeklyHours: 5 },
        { task: "DSA target 250+", weeklyHours: 8 },
        { task: "Networking + referrals", weeklyHours: 3 },
        { task: "Target companies apply cycle", weeklyHours: 3 },
      ],
    },

    resources: [
      { skill: "DSA", types: ["coding practice platforms", "topic sheets"] },
      { skill: "Spring Boot", types: ["official docs", "security guide"] },
      { skill: "Full-stack", types: ["Next.js docs", "deployment guides"] },
      { skill: "Interview", types: ["mock interview sets", "SQL question sets"] },
    ],

    checkpoints: [
      "Build and deploy 2 full-stack apps",
      "Solve 150 DSA questions",
      "Complete 10 mock interviews",
      "Prepare Backend + Full-stack resumes",
    ],
  };

  return res.json(result);
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