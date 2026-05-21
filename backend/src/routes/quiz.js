const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const Question = require("../models/RoleBasedQuestion");
const QuizAttempt = require("../models/QuizAttempt");

const router = express.Router();

/**
 * GET /api/quiz
 */
router.get("/", (req, res) => {
  res.json({ ok: true, message: "Quiz route working" });
});

/**
 * POST /api/quiz/generate
 * body:
 * {
 *   role: "Java Developer",
 *   topic: "Java Basics",
 *   difficulty: "easy",
 *   count: 5
 * }
 */
router.post("/generate", async (req, res) => {
  try {
    const role = String(req.body.role || "").trim();
    const topic = String(req.body.topic || "").trim();
    const difficulty = String(req.body.difficulty || "").trim().toLowerCase();
    const count = Number(req.body.count || 5);

    if (!role) {
      return res.status(400).json({ ok: false, message: "role is required" });
    }

    if (!topic) {
      return res.status(400).json({ ok: false, message: "topic is required" });
    }

    if (!difficulty) {
      return res.status(400).json({ ok: false, message: "difficulty is required" });
    }

    if (!count || count < 1) {
      return res.status(400).json({ ok: false, message: "count must be at least 1" });
    }

    const query = {
      role,
      topic,
      difficulty,
    };

    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: count } },
      {
        $project: {
          _id: 1,
          qid: 1,
          role: 1,
          topic: 1,
          difficulty: 1,
          question: 1,
          options: 1,
          // correctAnswer and explanation hidden on generate
        },
      },
    ]);

    if (!questions.length) {
      return res.status(400).json({
        ok: false,
        message: `No questions found for ${role} / ${topic} / ${difficulty}`,
      });
    }

    return res.json({
      ok: true,
      questions,
    });
  } catch (err) {
    console.error("Quiz generate error:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to generate quiz",
    });
  }
});

/**
 * POST /api/quiz/submit
 * body:
 * {
 *   role,
 *   topic,
 *   difficulty,
 *   answers: [{ qid, chosen }]
 * }
 */
router.post("/submit", async (req, res) => {
  try {
    const role = String(req.body.role || "").trim();
    const topic = String(req.body.topic || "").trim();
    const difficulty = String(req.body.difficulty || "").trim().toLowerCase();
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];

    if (!role) {
      return res.status(400).json({ ok: false, message: "role is required" });
    }

    if (!topic) {
      return res.status(400).json({ ok: false, message: "topic is required" });
    }

    if (!difficulty) {
      return res.status(400).json({ ok: false, message: "difficulty is required" });
    }

    if (!answers.length) {
      return res.status(400).json({ ok: false, message: "answers are required" });
    }

    const qidList = answers.map((a) => String(a.qid || "").trim()).filter(Boolean);

    const objectIdLike = qidList.filter((id) => /^[a-f\d]{24}$/i.test(id));

    let dbQuestions = [];

    if (objectIdLike.length) {
      const mongoose = require("mongoose");
      dbQuestions = await Question.find({
        _id: { $in: objectIdLike.map((id) => new mongoose.Types.ObjectId(id)) },
      }).lean();
    } else {
      dbQuestions = await Question.find({
        qid: { $in: qidList },
      }).lean();
    }

    if (!dbQuestions.length) {
      return res.status(400).json({
        ok: false,
        message: "No matching questions found for submitted answers",
      });
    }

    const map = new Map();
    for (const q of dbQuestions) {
      const key = q.qid || String(q._id);
      map.set(String(key), q);
      map.set(String(q._id), q);
    }

    let score = 0;

    const resultAnswers = answers.map((a) => {
      const submittedId = String(a.qid || "").trim();
      const chosen = String(a.chosen || "").trim();
      const q = map.get(submittedId);

      if (!q) {
        return {
          qid: submittedId,
          chosen,
          correct: "",
          ok: false,
          question: "",
          explanation: "",
        };
      }

      const correct = String(q.correctAnswer || "").trim();
      const ok = chosen === correct;

      if (ok) score++;

      return {
        qid: q.qid || String(q._id),
        chosen,
        correct,
        ok,
        question: q.question,
        explanation: q.explanation || "",
      };
    });

    // save attempt
    try {
      await QuizAttempt.create({
        userId: req.user?._id,
        role,
        topic,
        difficulty,
        score,
        total: resultAnswers.length,
        answers: resultAnswers.map((a) => ({
          qid: a.qid,
          chosen: a.chosen,
          correct: a.correct,
          ok: a.ok,
        })),
      });
    } catch (saveErr) {
      console.error("QuizAttempt save error:", saveErr.message);
    }

    return res.json({
      ok: true,
      score,
      total: resultAnswers.length,
      answers: resultAnswers,
    });
  } catch (err) {
    console.error("Quiz submit error:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to submit quiz",
    });
  }
});

module.exports = router;