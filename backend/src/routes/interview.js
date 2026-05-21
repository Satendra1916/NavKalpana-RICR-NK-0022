const express = require("express");
const router = express.Router();

// Body parsers (safe for JSON + form)
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// In-memory sessions (mock)
const sessions = new Map();

/**
 * Safe body parser:
 * Sometimes body might come as a string from certain clients.
 */
function safeBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return {};
    }
  }
  return req.body || {};
}

/**
 * Node fetch availability:
 * Node 18+ has global fetch. If not available, we fallback to non-AI path.
 */
function hasFetch() {
  return typeof global.fetch === "function";
}

// ✅ START interview
router.post("/start", (req, res) => {
  const body = safeBody(req);

  const {
    role = "Software Developer",
    level = "Fresher",
    type = "Mixed",
  } = body;

  const sessionId = "mock-" + Date.now();

  // Create session
  sessions.set(sessionId, {
    createdAt: Date.now(),
    role,
    level,
    type,
    turns: [],
  });

  const firstQuestion = getQuestion({ type, index: 0, role });

  return res.json({
    sessionId,
    role,
    level,
    type,
    turn: 1,
    question: firstQuestion,
  });
});

// ✅ REPLY + AI feedback
router.post("/reply", async (req, res) => {
  const body = safeBody(req);

  const {
    sessionId,
    type = "Mixed",
    turn = 1,
    question = "",
    answer = "",
    role: bodyRole, // optional if frontend sends it
  } = body;

  console.log("✅ /reply HIT hasKey=", !!process.env.GROQ_API_KEY);

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "sessionId is required" });
  }

  const s = sessions.get(sessionId);
  if (!s) {
    return res.status(404).json({ error: "Session not found" });
  }

  const effectiveRole = bodyRole || s.role || "Software Developer";
  const effectiveType = type || s.type || "Mixed";

  if (!answer || !answer.trim()) {
    return res.status(400).json({ error: "Answer is required" });
  }

  // Score + feedback
  const score = scoreAnswer(answer);
  const feedback = buildFeedback(score);

  // AI improvement (safe)
  const improved = await generateAIImprovement(question, answer);

  // Next question uses role + type
  const nextQuestion = getQuestion({
    type: effectiveType,
    index: Number(turn) || 1,
    role: effectiveRole,
  });

  // Save turn
  s.turns.push({
    turn: Number(turn) || 1,
    question,
    answer,
    score,
    improvedAnswer: improved,
    ts: Date.now(),
  });

  return res.json({
    sessionId,
    turn: (Number(turn) || 1) + 1,
    score,
    feedback,
    improvedAnswer: improved,
    nextQuestion,
  });
});

// ✅ SUMMARY REPORT
router.get("/summary/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const s = sessions.get(sessionId);

  if (!s) {
    return res.status(404).json({ error: "Session not found" });
  }

  const turns = s.turns || [];
  const total = turns.reduce((sum, t) => sum + (t.score || 0), 0);
  const avgScore = turns.length ? Math.round((total / turns.length) * 10) / 10 : 0;

  // Grade + Verdict (hackathon polish)
  const grade = avgScore >= 8 ? "A" : avgScore >= 6 ? "B" : "C";

  const verdict =
    grade === "A"
      ? "Strong performance. You’re interview-ready—add metrics for extra impact."
      : grade === "B"
        ? "Good foundation. Improve structure and add one strong project result."
        : "Needs work. Focus on clear structure, examples, and confidence.";

  // SMART ANALYSIS
  const strengths = [];
  const weaknesses = [];

  const allAnswers = turns.map((t) => (t.answer || "").toLowerCase()).join(" ");
  const avgLen =
    turns.length === 0
      ? 0
      : Math.round(
        turns.reduce((sum, t) => sum + (t.answer || "").length, 0) / turns.length
      );

  // Strength rules
  if (avgScore >= 7.5) strengths.push("Good overall communication and confidence.");
  if (allAnswers.includes("project") || allAnswers.includes("example"))
    strengths.push("You support answers with examples/projects.");
  if (allAnswers.includes("because")) strengths.push("Your answers show reasoning ability.");

  // Weakness rules
  if (avgScore < 7) weaknesses.push("Answers need stronger structure and clarity.");
  if (!allAnswers.includes("project") && !allAnswers.includes("example"))
    weaknesses.push("Add at least one real project example with measurable impact.");
  if (avgLen < 80) weaknesses.push("Answers are too brief — add more depth and details.");
  if (!allAnswers.includes("result") && !allAnswers.includes("%"))
    weaknesses.push("Include quantified results (e.g., improved speed by 20%).");

  // Safety: ensure at least one weakness/strength
  if (weaknesses.length === 0)
    weaknesses.push("Try adding more quantified impact and structured storytelling.");
  if (strengths.length === 0)
    strengths.push("You have a clear starting point—now expand with structure and examples.");

  const tips = [
    "Use STAR: Situation → Task → Action → Result.",
    "Add 1 real project example with a measurable result (numbers/impact).",
    "Keep answers 4–6 lines: intro → skills → example → result → closing.",
    "End with confidence: 'I’m excited to contribute in this role.'",
  ];

  return res.json({
    sessionId,
    meta: {
      role: s.role,
      level: s.level,
      type: s.type,
      createdAt: s.createdAt,
      turns: turns.length,
    },
    avgScore,
    grade,
    verdict,
    strengths,
    weaknesses,
    tips,
    history: turns.map((t) => ({
      turn: t.turn,
      question: t.question,
      score: t.score,
      answer: t.answer,
      improvedAnswer: t.improvedAnswer,
    })),
  });
});

// ---------------- HELPERS ----------------

function getQuestion({ type, index, role = "" }) {
  const r = (role || "").toLowerCase();

  // Role-based banks
  const roleBanks = {
    java: [
      "Explain OOP concepts in Java with a real example.",
      "What is JVM and how does Java achieve platform independence?",
      "Difference between ArrayList and LinkedList in Java.",
      "How does Spring Boot simplify Java development?",
    ],
    data: [
      "Explain the difference between SQL and NoSQL.",
      "How do you handle missing data in a dataset?",
      "What is normalization in databases?",
      "Explain one data visualization project you built.",
    ],
    web: [
      "Explain the difference between client-side and server-side rendering.",
      "What is REST API and why do we use it?",
      "How does React improve UI performance?",
      "Explain your full-stack project architecture.",
    ],
  };

  // Type-based generic bank
  const typeBanks = {
    HR: [
      "Tell me about yourself.",
      "Why should we hire you?",
      "What are your strengths and weaknesses?",
    ],
    Technical: [
      "Explain OOP concepts with an example.",
      "What is REST API and why do we use it?",
      "Difference between SQL and NoSQL?",
    ],
    Mixed: [
      "Tell me about yourself.",
      "Explain OOP concepts with an example.",
      "Why should we hire you?",
    ],
  };

  let selectedBank = null;
  if (r.includes("java")) selectedBank = roleBanks.java;
  else if (r.includes("data")) selectedBank = roleBanks.data;
  else if (r.includes("web") || r.includes("frontend") || r.includes("react"))
    selectedBank = roleBanks.web;

  const list = selectedBank || typeBanks[type] || typeBanks.Mixed;
  const safeIndex = Number(index) || 0;

  return list[safeIndex % list.length];
}

function scoreAnswer(answer) {
  let score = 4;
  const a = (answer || "").toLowerCase();

  if (answer.length > 120) score += 2;
  if (a.includes("example") || a.includes("project")) score += 2;
  if (a.includes("because")) score += 1;
  if (answer.length < 30) score -= 2;

  return Math.max(1, Math.min(10, score));
}

function buildFeedback(score) {
  if (score >= 8) return "Strong answer ✅ Add metrics/impact to make it even better.";
  if (score >= 6) return "Good 👍 Add a concrete example and structured flow.";
  return "Needs improvement ⚠️ Add example and result.";
}

async function generateAIImprovement(question, answer) {
  try {
    // If no key OR no fetch support => fallback
    if (!process.env.GROQ_API_KEY || !hasFetch()) {
      return buildImprovedAnswer(question, answer);
    }

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are an interview coach for an Indian fresher candidate (Java/CS). Rewrite the answer in professional English in 4-6 lines. Use a confident tone. Mention 1 relevant skill (Java/Spring/MySQL/DSA) and 1 project-style impact line. Fix grammar. End with a strong closing line. Return ONLY the improved answer (no headings, no bullets).",
          },
          {
            role: "user",
            content: `Question: ${question}
Candidate answer: ${answer}

Extra context:
- Name: Ranjeet Patel
- Education: B.Tech CSE (NIIST, Bhopal)
- Skills: Java, MySQL, basic web dev
- Goal: Fresher role

Now rewrite the answer.`,
          },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return `AI error (status ${resp.status}): ${errText.slice(0, 150)}`;
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content;
    return (text || "").trim() || "AI improvement unavailable.";
  } catch (e) {
    return buildImprovedAnswer(question, answer);
  }
}

function buildImprovedAnswer(question, answer) {
  const q = (question || "").trim();
  const a = (answer || "").trim();
  return `I would answer this confidently by keeping it structured. For "${q}", I would highlight my skills, share a real example from a project, and mention the result/impact. I would keep the explanation clear and professional, and end by showing excitement for the role. (Original: ${a})`;
}

module.exports = router;