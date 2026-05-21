const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    qid: { type: String, trim: true },
    role: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true, trim: true },
    explanation: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);