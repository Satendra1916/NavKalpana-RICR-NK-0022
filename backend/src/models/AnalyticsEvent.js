const mongoose = require("mongoose");

const AnalyticsEventSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // ✅ string: supports Google sub/id
    type: { type: String, required: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AnalyticsEvent", AnalyticsEventSchema);
