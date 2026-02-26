const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, enum: ["interview", "career", "resume"], required: true },
    messages: [{ role: String, content: String }],
    score: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", SessionSchema);