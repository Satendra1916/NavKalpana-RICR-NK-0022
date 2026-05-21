const mongoose = require("mongoose");

const BadgeSchema = new mongoose.Schema(
    {
        key: { type: String, unique: true }, // e.g. "first_interview"
        title: String,
        description: String,
        icon: String, // "🎯" or icon name
        points: { type: Number, default: 10 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Badge", BadgeSchema);