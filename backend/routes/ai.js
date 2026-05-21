const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const { groqChat } = require("../utils/groq");

function safeString(v, fallback = "") {
  return typeof v === "string" ? v.trim() : fallback;
}

function clamp(n, a = 0, b = 100) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function tryParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch (e) {
    const arrStart = raw.indexOf("[");
    const arrEnd = raw.lastIndexOf("]");
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      return JSON.parse(raw.slice(arrStart, arrEnd + 1));
    }

    const objStart = raw.indexOf("{");
    const objEnd = raw.lastIndexOf("}");
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      return JSON.parse(raw.slice(objStart, objEnd + 1));
    }

    throw new Error("Invalid JSON returned by AI");
  }
}

/* =========================================================
   CAREER PATH
========================================================= */
router.post("/career", requireAuth, async (req, res) => {
  try {
    const profile = req.body?.profile || {};

    const skills = Array.isArray(profile.skills)
      ? profile.skills
      : ["Java", "JavaScript", "SQL", "Web Basics"];

    const education = safeString(profile.education, "B.Tech (CSE) student");
    const projects = Array.isArray(profile.projects)
      ? profile.projects
      : ["Basic web + auth project"];
    const interests = Array.isArray(profile.interests)
      ? profile.interests
      : ["Backend", "Full-stack"];

    const result = {
      recommendedRoles: [
        {
          name: "Backend Developer (Java / Spring Boot)",
          description: "Build APIs, auth, databases, scalable backend services.",
          whyFits:
            "You already know Java, SQL, and you’re building real web app flows (auth + dashboard). Backend fits India job market well.",
          fitScore: 86,
        },
        {
          name: "Full-Stack Developer (Next.js + Node.js)",
          description: "Build complete apps: UI + APIs + database + deployment.",
          whyFits:
            "You’re already using Next.js and Node/Express in AI-CAREER-COACH.",
          fitScore: 82,
        },
        {
          name: "Software Engineer (DSA + Projects)",
          description: "General SDE track: strong CS + DSA + projects.",
          whyFits:
            "You’re learning DSA and doing projects. This opens more companies.",
          fitScore: 78,
        },
      ],

      skillGapAnalysis: {
        alreadyHas: [
          ...skills,
          "Basic Auth flow understanding",
          "Basic REST concepts",
        ],
        missingByRole: {
          "Backend Developer (Java / Spring Boot)": [
            "Spring Boot deep (MVC, Security, JPA/Hibernate)",
            "API design + validation",
            "Caching basics (Redis concept)",
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
            "Computer Networks / OS revision",
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
          { task: "Internship/job applications weekly", weeklyHours: 3 },
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

      profileSummary: {
        education,
        projects,
        interests,
      },
    };

    return res.json({ ok: true, result });
  } catch (err) {
    console.error("career route error:", err);
    return res.status(500).json({ ok: false, error: "Career route failed" });
  }
});

/* =========================================================
   RESUME REWRITE / IMPROVE
   POST /api/ai/resume
========================================================= */
router.post("/resume", requireAuth, async (req, res) => {
  try {
    const role = safeString(req.body?.role, "Software Developer");
    const resumeText = safeString(req.body?.resumeText);

    if (!resumeText || resumeText.length < 30) {
      return res.status(400).json({
        ok: false,
        error: "resumeText is required (min 30 chars)",
      });
    }

    const system = `
You are an expert resume improvement assistant.
Return STRICT JSON ONLY.
Schema:
{
  "summary": "string",
  "suggestions": ["string", "string"],
  "improvedBullets": ["string", "string", "string"]
}
Rules:
- Keep response concise and useful.
- Do not invent fake experience or achievements.
- Improve wording for the target role.
- suggestions should be actionable.
`;

    const user = `
Target Role: ${role}

Resume Text:
${resumeText}
`;

    const raw = await groqChat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const parsed = tryParseJson(raw);

    return res.json({
      ok: true,
      summary: safeString(parsed?.summary),
      suggestions: Array.isArray(parsed?.suggestions)
        ? parsed.suggestions.map(String).filter(Boolean).slice(0, 10)
        : [],
      improvedBullets: Array.isArray(parsed?.improvedBullets)
        ? parsed.improvedBullets.map(String).filter(Boolean).slice(0, 6)
        : [],
    });
  } catch (err) {
    console.error("resume rewrite error:", err);
    return res.status(500).json({ ok: false, error: "Resume rewrite failed" });
  }
});

/* =========================================================
   INTERVIEW QUESTIONS / FEEDBACK
   POST /api/ai/interview
========================================================= */
router.post("/interview", requireAuth, async (req, res) => {
  try {
    const role = safeString(req.body?.role, "Software Developer");
    const level = safeString(req.body?.level, "Fresher");
    const type = safeString(req.body?.type, "Mixed");
    const count = Math.max(1, Math.min(10, Number(req.body?.count || 5)));
    const answer = safeString(req.body?.answer);
    const question = safeString(req.body?.question);

    if (question && answer) {
      const system = `
You are an interview evaluator.
Return STRICT JSON ONLY.
Schema:
{
  "score": number,
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "betterAnswer": "string"
}
Rules:
- score between 0 and 10
- feedback should be short and useful
- betterAnswer must be improved but realistic
`;

      const user = `
Role: ${role}
Level: ${level}
Question: ${question}
Candidate Answer: ${answer}
`;

      const raw = await groqChat({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.3,
        max_tokens: 900,
      });

      const parsed = tryParseJson(raw);

      return res.json({
        ok: true,
        mode: "evaluate",
        result: {
          score: clamp(parsed?.score, 0, 10),
          feedback: safeString(parsed?.feedback),
          strengths: Array.isArray(parsed?.strengths)
            ? parsed.strengths.map(String).filter(Boolean).slice(0, 6)
            : [],
          improvements: Array.isArray(parsed?.improvements)
            ? parsed.improvements.map(String).filter(Boolean).slice(0, 6)
            : [],
          betterAnswer: safeString(parsed?.betterAnswer),
        },
      });
    }

    const system = `
You are an interview question generator.
Return STRICT JSON ONLY.
Schema:
{
  "questions": [
    {
      "question": "string",
      "category": "string",
      "difficulty": "string"
    }
  ]
}
Rules:
- Generate exactly ${count} questions
- Questions must match the given role and level
- Include technical + HR style if type is Mixed
- No markdown
`;

    const user = `
Role: ${role}
Level: ${level}
Interview Type: ${type}
Number of Questions: ${count}
`;

    const raw = await groqChat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: 1200,
    });

    const parsed = tryParseJson(raw);

    const questions = Array.isArray(parsed?.questions)
      ? parsed.questions
        .map((q, i) => ({
          id: `int-${Date.now()}-${i + 1}`,
          question: safeString(q?.question),
          category: safeString(q?.category, "General"),
          difficulty: safeString(q?.difficulty, level),
        }))
        .filter((q) => q.question)
      : [];

    return res.json({
      ok: true,
      mode: "generate",
      meta: { role, level, type, count: questions.length },
      questions,
    });
  } catch (err) {
    console.error("interview ai error:", err);
    return res.status(500).json({ ok: false, error: "Interview AI failed" });
  }
});

/* =========================================================
   AI QUIZ GENERATOR
   POST /api/ai/quiz
========================================================= */
router.post("/quiz", requireAuth, async (req, res) => {
  try {
    const role = safeString(req.body?.role, "Software Developer");
    const topic = safeString(req.body?.topic, "General Programming");
    const difficulty = safeString(req.body?.difficulty, "Easy");
    const count = Math.max(1, Math.min(10, Number(req.body?.count || 5)));

    const system = `
You are an expert technical MCQ generator.
Return STRICT JSON ONLY.
Output schema:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}
Rules:
- Generate exactly ${count} MCQs
- 4 options only
- correctAnswer must exactly match one option
- Questions must match role="${role}", topic="${topic}", difficulty="${difficulty}"
- No markdown
- No extra text
`;

    const user = `
Role: ${role}
Topic: ${topic}
Difficulty: ${difficulty}
Question Count: ${count}
`;

    const raw = await groqChat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 1800,
    });

    const parsed = tryParseJson(raw);

    const questions = Array.isArray(parsed?.questions)
      ? parsed.questions
        .map((q, i) => {
          const options = Array.isArray(q?.options)
            ? q.options.map(String).filter(Boolean).slice(0, 4)
            : [];

          const correctAnswer = safeString(q?.correctAnswer);

          return {
            id: `ai-q-${Date.now()}-${i + 1}`,
            question: safeString(q?.question),
            options,
            correctAnswer,
            explanation: safeString(q?.explanation),
          };
        })
        .filter(
          (q) =>
            q.question &&
            q.options.length === 4 &&
            q.correctAnswer &&
            q.options.includes(q.correctAnswer)
        )
      : [];

    return res.json({
      ok: true,
      meta: {
        role,
        topic,
        difficulty,
        count: questions.length,
        source: "ai",
      },
      questions,
    });
  } catch (err) {
    console.error("quiz ai error:", err);
    return res.status(500).json({ ok: false, error: "AI quiz generation failed" });
  }
});

module.exports = router;