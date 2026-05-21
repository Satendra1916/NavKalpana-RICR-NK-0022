const mongoose = require("mongoose");

const QuizTopicSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

QuizTopicSchema.index({ role: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("QuizTopic", QuizTopicSchema);
