const express = require("express");
const QuizRole = require("../models/QuizRole");
const QuizTopic = require("../models/QuizTopic");

const router = express.Router();

router.get("/roles", async (req, res) => {
  try {
    const roles = await QuizRole.find({ isActive: true })
      .sort({ name: 1 })
      .select("name -_id");

    res.json({
      ok: true,
      roles: roles.map((r) => r.name),
    });
  } catch (err) {
    console.error("roles fetch error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch roles" });
  }
});

router.get("/topics", async (req, res) => {
  try {
    const role = String(req.query.role || "").trim();

    if (!role) {
      return res.status(400).json({
        ok: false,
        message: "role is required",
      });
    }

    const topics = await QuizTopic.find({ role, isActive: true })
      .sort({ name: 1 })
      .select("name -_id");

    res.json({
      ok: true,
      topics: topics.map((t) => t.name),
    });
  } catch (err) {
    console.error("topics fetch error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch topics" });
  }
});

module.exports = router;