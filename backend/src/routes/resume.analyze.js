const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const router = express.Router();

function clamp(n, a = 0, b = 100) {
    const x = Number(n);
    if (Number.isNaN(x)) return a;
    return Math.max(a, Math.min(b, x));
}

function uniq(arr) {
    return Array.from(
        new Set((arr || []).map((x) => String(x || "").trim()).filter(Boolean))
    );
}

function analyzeResume({ role, resumeText }) {
    const text = String(resumeText || "");
    const lower = text.toLowerCase();
    const roleStr = String(role || "Software Developer");

    const ROLE_KEYWORDS = {
        "Java Developer": [
            "java", "spring", "spring boot", "hibernate", "jpa", "jdbc", "rest", "api",
            "mysql", "sql", "maven", "gradle", "oop", "data structures", "dsa",
            "microservices", "jwt", "docker", "git"
        ],
        "Backend Developer": [
            "node", "express", "rest", "api", "authentication", "authorization", "jwt",
            "session", "cookie", "mongodb", "mysql", "sql", "redis", "docker",
            "deployment", "logging", "rate limiting", "validation", "git"
        ],
        "Full Stack Developer": [
            "react", "next.js", "node", "express", "rest", "api", "typescript",
            "javascript", "tailwind", "mongodb", "mysql", "auth", "jwt", "session",
            "git", "deployment", "ui", "responsive"
        ],
        "Frontend Developer": [
            "react", "next.js", "javascript", "typescript", "html", "css", "tailwind",
            "ui", "responsive", "accessibility", "state", "api", "fetch", "performance", "git"
        ],
        "Software Developer": [
            "problem solving", "data structures", "dsa", "oop", "java", "python", "sql",
            "git", "api", "testing", "debugging", "deployment"
        ],
        "Data Analyst": [
            "excel", "sql", "python", "pandas", "numpy", "visualization", "power bi",
            "tableau", "statistics", "dashboard", "data cleaning", "analysis", "reporting"
        ],
        "Android Developer": [
            "android", "kotlin", "java", "xml", "firebase", "api", "rest", "mvvm",
            "room", "sqlite", "gradle", "play store", "testing"
        ],
        "DevOps Engineer": [
            "docker", "kubernetes", "ci/cd", "github actions", "jenkins", "linux", "aws",
            "azure", "gcp", "nginx", "monitoring", "logging", "terraform", "deployment"
        ],
    };

    const kws = ROLE_KEYWORDS[roleStr] || ROLE_KEYWORDS["Software Developer"];

    let hit = 0;
    const missing = [];
    for (const k of kws) {
        const key = String(k).toLowerCase();
        if (lower.includes(key)) hit++;
        else missing.push(k);
    }

    const sections = {
        summary: /summary|objective|profile/i.test(text),
        skills: /skills|technologies|tech stack/i.test(text),
        projects: /projects|project/i.test(text),
        experience: /experience|internship|work/i.test(text),
        education: /education|degree|college/i.test(text),
    };
    const sectionCount = Object.values(sections).filter(Boolean).length;

    const keywordScore = (hit / Math.max(1, kws.length)) * 70;
    const sectionScore = (sectionCount / 5) * 30;
    const fitScore = clamp(keywordScore + sectionScore, 0, 100);

    const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
    const hasPhone = /\b(\+?\d{1,3}[- ]?)?\d{10}\b/.test(text);
    const hasBullets = /(^|\n)\s*[-•]\s+/.test(text);
    const hasDates = /\b(19|20)\d{2}\b/.test(text);

    let ats = 100;
    if (!hasEmail) ats -= 12;
    if (!hasPhone) ats -= 8;
    if (!hasBullets) ats -= 10;
    if (!hasDates) ats -= 6;
    if (text.length < 250) ats -= 10;
    if (text.length > 8000) ats -= 5;

    const atsScore = clamp(ats, 0, 100);

    const grammarIssues = [];
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    const longLines = lines.filter((l) => l.length > 140).slice(0, 3);
    for (const _l of longLines) {
        grammarIssues.push("Very long line — break into shorter bullet points.");
    }

    const weakPhrases = [
        "good coding skills",
        "hardworking",
        "quick learner",
        "can handle multiple tasks",
        "self motivated",
        "responsible",
    ];
    for (const p of weakPhrases) {
        if (lower.includes(p)) {
            grammarIssues.push(`Avoid vague phrase: "${p}" — replace with measurable proof.`);
        }
    }

    if (!hasBullets) grammarIssues.push("Use bullet points for projects/experience to improve readability.");
    if (!/github|leetcode|portfolio|linkedin/i.test(text)) {
        grammarIssues.push("Add GitHub/portfolio/LinkedIn links if available.");
    }

    const improvements = [];
    if (missing.length) improvements.push("Add missing role keywords naturally into Skills/Projects/Experience.");
    if (!sections.projects) improvements.push("Add a PROJECTS section with 2–3 projects (impact + tech stack).");
    if (!sections.experience) improvements.push("Add Internship/Experience section (even academic or freelancing).");
    if (!sections.skills) improvements.push("Add a SKILLS section with categorized tools (Backend/DB/Tools).");
    if (!hasBullets) improvements.push("Write projects in bullet format: Action + Tech + Result (numbers).");
    if (!hasDates) improvements.push("Add dates for education/experience (YYYY or MMM YYYY).");

    const strengths = [];
    if (sections.projects) strengths.push("Projects are present (good for freshers).");
    if (sections.skills) strengths.push("Skills section present.");
    if (hasEmail && hasPhone) strengths.push("Contact details present.");
    if (hit >= Math.ceil(kws.length * 0.35)) strengths.push("Contains several role-relevant keywords.");
    if (/api|rest/i.test(text)) strengths.push("Mentions API/REST concepts.");

    const weaknesses = [];
    if (missing.length > Math.ceil(kws.length * 0.55)) weaknesses.push("Too many missing role keywords for ATS.");
    if (!sections.projects) weaknesses.push("Missing projects section.");
    if (!sections.skills) weaknesses.push("Missing skills/tech stack section.");
    if (!hasBullets) weaknesses.push("Resume formatting is not bullet-friendly for ATS.");
    if (text.length < 250) weaknesses.push("Resume content is too short; expand projects and impact.");

    const rewriteSummary = (() => {
        const base =
            roleStr === "Java Developer"
                ? "Java Developer"
                : roleStr === "Backend Developer"
                    ? "Backend Developer"
                    : roleStr;

        const techBits = uniq(
            [
                lower.includes("spring") ? "Spring Boot" : null,
                lower.includes("mysql") ? "MySQL" : null,
                lower.includes("mongodb") ? "MongoDB" : null,
                lower.includes("react") ? "React" : null,
                lower.includes("next") ? "Next.js" : null,
                lower.includes("node") ? "Node.js" : null,
                lower.includes("express") ? "Express" : null,
            ].filter(Boolean)
        );

        const tech = techBits.length ? techBits.join(", ") : "modern tools";
        return `Fresher ${base} with hands-on project experience in ${tech}. Built end-to-end features (auth, APIs, dashboards) and focused on clean code, debugging, and performance. Seeking an opportunity to contribute to real-world product development and grow with a strong engineering team.`;
    })();

    const rewriteBullets = [
        "Built a full-stack project using (Tech Stack) with authentication, role-based access, and responsive UI; improved user flow and reduced manual work.",
        "Designed REST APIs for core modules (resume, interview, quiz) and integrated database operations with proper validation and error handling.",
        "Implemented PDF resume generation/download with clean A4 layout; ensured consistent formatting and zero blank pages.",
    ];

    return {
        fitScore,
        atsScore,
        strengths: uniq(strengths).slice(0, 10),
        weaknesses: uniq(weaknesses).slice(0, 10),
        missingKeywords: uniq(missing).slice(0, 30),
        grammarIssues: uniq(grammarIssues).slice(0, 12),
        improvements: uniq(improvements).slice(0, 12),
        rewriteSuggestions: {
            summary: rewriteSummary,
            projectBullets: rewriteBullets.slice(0, 6),
        },
    };
}

router.post("/analyze", requireAuth, async (req, res) => {
    try {
        const role = req.body?.role;
        const resumeText = req.body?.resumeText;

        if (!resumeText || String(resumeText).trim().length < 30) {
            return res.status(400).json({
                ok: false,
                error: "resumeText is required (min 30 chars).",
            });
        }

        const result = analyzeResume({ role, resumeText });
        return res.json({ ok: true, result });
    } catch (err) {
        console.error("resume.analyze error:", err);
        return res.status(500).json({ ok: false, error: "Resume analyze failed" });
    }
});

module.exports = router;