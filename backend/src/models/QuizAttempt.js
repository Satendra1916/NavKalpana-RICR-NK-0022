const mongoose = require("mongoose");

const QuizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: String,
    topic: String,
    difficulty: String,
    score: Number,
    total: Number,
    answers: [{ qid: String, chosen: String, correct: String, ok: Boolean }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
