const mongoose = require("mongoose");

const UserProgressSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
        xp: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastActiveAt: { type: Date, default: null },
        badges: [{ key: String, earnedAt: Date }],
        stats: {
            interviewsCompleted: { type: Number, default: 0 },
            quizzesCompleted: { type: Number, default: 0 },
            activitiesCompleted: { type: Number, default: 0 },
            bestQuizScore: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("UserProgress", UserProgressSchema);