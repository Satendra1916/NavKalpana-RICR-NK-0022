const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const ActivityAttempt = require("../models/ActivityAttempt");
const { getProgress, bumpStreak, awardBadge } = require("../utils/progress");

const ACTIVITIES = [
    {
        id: "bugfix_1",
        type: "bug_fix",
        topic: "Java",
        difficulty: "easy",
        prompt: "Fix the bug: NullPointerException in this code",
        code: `String s = null;
System.out.println(s.length());`,
        options: [
            "Use try/catch only",
            "Check null before calling length()",
            "Make s static",
            "Use final keyword"
        ],
        correctIndex: 1,
        explain: "Null check prevents calling methods on null."
    },
    {
        id: "order_1",
        type: "order_steps",
        topic: "Backend",
        difficulty: "easy",
        prompt: "Arrange correct order to create Express route",
        items: ["Create router", "Define route handler", "Export router", "Mount in server.js"],
        correctOrder: [0, 1, 2, 3]
    }
];

router.get("/next", requireAuth, (req, res) => {
    const { topic } = req.query;
    const pool = topic ? ACTIVITIES.filter(a => a.topic === topic) : ACTIVITIES;
    const a = pool[Math.floor(Math.random() * pool.length)];
    res.json({ ok: true, activity: a });
});

router.post("/submit", requireAuth, async (req, res) => {
    const { id, answer } = req.body || {};
    const a = ACTIVITIES.find(x => x.id === id);
    if (!a) return res.status(404).json({ ok: false, error: "Activity not found" });

    let ok = false;

    if (a.type === "bug_fix") {
        ok = Number(answer) === a.correctIndex;
    } else if (a.type === "order_steps") {
        // answer should be array of indices
        const arr = Array.isArray(answer) ? answer : [];
        ok = JSON.stringify(arr) === JSON.stringify(a.correctOrder);
    }

    const points = ok ? 15 : 3;

    await ActivityAttempt.create({
        userId: req.user._id,
        type: a.type,
        topic: a.topic,
        difficulty: a.difficulty,
        ok,
        points
    });

    const progress = await getProgress(req.user._id);
    bumpStreak(progress);
    progress.stats.activitiesCompleted += 1;
    progress.xp += points;

    if (progress.stats.activitiesCompleted === 1) await awardBadge(progress, "first_activity", "First Activity", "Completed your first activity", 10);
    if (progress.stats.activitiesCompleted >= 5) await awardBadge(progress, "playground_pro", "Playground Pro", "Completed 5 activities", 30);

    await progress.save();

    res.json({
        ok: true,
        correct: ok,
        points,
        explain: a.explain || null
    });
});

module.exports = router;