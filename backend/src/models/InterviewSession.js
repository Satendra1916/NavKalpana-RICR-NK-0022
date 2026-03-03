const mongoose = require("mongoose");

const InterviewSessionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        role: { type: String, default: "" },
        stack: { type: [String], default: [] },

        questions: { type: [String], default: [] },
        answers: { type: [String], default: [] },

        scores: { type: [Number], default: [] },
        avgScore: { type: Number, default: 0 },
        grade: { type: String, default: "" },
        verdict: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("InterviewSession", InterviewSessionSchema);
