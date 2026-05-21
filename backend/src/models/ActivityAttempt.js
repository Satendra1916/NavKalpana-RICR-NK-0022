const mongoose = require("mongoose");

const ActivityAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: String, // "bug_fix" | "order_steps" | "fill_blank" ...
    topic: String,
    difficulty: String,
    ok: Boolean,
    points: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityAttempt", ActivityAttemptSchema);