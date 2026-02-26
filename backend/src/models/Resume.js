const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    role: String,
    content: String,
    improved: String,
    title: { type: String, default: "My Resume" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", ResumeSchema);