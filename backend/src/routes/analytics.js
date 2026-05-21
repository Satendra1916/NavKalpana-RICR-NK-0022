const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const AnalyticsEvent = require("../models/AnalyticsEvent");

// ✅ if you already have auth middleware, use it here
// const requireAuth = require("../middleware/requireAuth");

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

router.get("/overview", async (req, res) => {
    try {
        // If your app uses session auth, user is in req.user
       const uid =
  (req.user?._id && String(req.user._id)) ||   // local users (mongo)
  req.user?.id ||                               // google profile id
  req.user?._json?.sub;                         // google "sub"

if (!uid) {
  return res.status(401).json({ ok: false, message: "Unauthorized" });
}        const now = new Date();
        const from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)); // last 7 days

        // 1) daily events count (all events)
        const eventsDaily = await AnalyticsEvent.aggregate([
            { $match: { userId: uid, createdAt: { $gte: from } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // 2) counts by type
        const countsByType = await AnalyticsEvent.aggregate([
            { $match: { userId: uid } },
            { $group: { _id: "$type", count: { $sum: 1 } } },
        ]);

        const map = Object.fromEntries(countsByType.map((x) => [x._id, x.count]));

        const resumeAiCount = map["RESUME_AI"] || 0;
        const interviewCount = map["INTERVIEW_AI"] || 0;

        // 3) interview trend (last 7 days)
        const interviewTrend = await AnalyticsEvent.aggregate([
            { $match: { userId: uid, type: "INTERVIEW_AI", createdAt: { $gte: from } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return res.json({
            ok: true,
            eventsDaily,
            interviewTrend,
            resumeAiCount,
            interviewCount,
        });
    } catch (e) {
        console.error("ANALYTICS OVERVIEW ERROR:", e);
        return res.status(500).json({ ok: false, message: "Analytics failed" });
    }
});

module.exports = router;