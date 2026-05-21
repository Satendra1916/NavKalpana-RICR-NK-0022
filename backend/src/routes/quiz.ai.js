const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { groqChat } = require("../utils/groq");

const router = express.Router();

function extractJson(raw) {
    try {
        return JSON.parse(raw);
    } catch (e) {
        const start = raw.indexOf("[");
        const end = raw.lastIndexOf("]");
        if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(raw.slice(start, end + 1));
        }
        const startObj = raw.indexOf("{");
        const endObj = raw.lastIndexOf("}");
        if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
            return JSON.parse(raw.slice(startObj, endObj + 1));
        }
        throw new Error("Invalid JSON from AI");
    }
}

router.post("/generate", requireAuth, async (req, res) => {
    try {
        const role = String(req.body?.role || "").trim();
        const topic = String(req.body?.topic || "").trim();
        const difficulty = String(req.body?.difficulty || "Easy").trim();
        const count = Math.max(1, Math.min(10, Number(req.body?.count || 5)));

        if (!role) {
            return res.status(400).json({ ok: false, error: "role is required" });
        }

        if (!topic) {
            return res.status(400).json({ ok: false, error: "topic is required" });
        }

        const system = `
You are an expert technical quiz generator.
Return STRICT JSON ONLY.
Output must be a JSON array.
Each item must follow this schema:
{
 "question": "string",
 "options": ["string","string","string","string"],
 "correctAnswer": "string",
 "explanation": "string"
}
Rules:
- Exactly ${count} questions
- 4 options
- correctAnswer must match one option
- No markdown
`;

        const user = `
Role: ${role}
Topic: ${topic}
Difficulty: ${difficulty}
Generate ${count} MCQs
`;

        const raw = await groqChat({
            messages: [
                { role: "system", content: system },
                { role: "user", content: user }
            ],
            temperature: 0.4,
            max_tokens: 1500
        });

        const parsed = extractJson(raw);

        if (!Array.isArray(parsed)) {
            return res.status(500).json({ ok: false, error: "AI did not return array" });
        }

        const questions = parsed.map((q, i) => ({
            id: `ai-${Date.now()}-${i}`,
            question: String(q.question || ""),
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: String(q.correctAnswer || ""),
            explanation: String(q.explanation || "")
        }));

        res.json({
            ok: true,
            questions
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: "AI quiz generation failed" });
    }
});

module.exports = router;