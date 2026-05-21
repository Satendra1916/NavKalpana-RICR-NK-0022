const mongoose = require("mongoose");

const RoleBasedQuestionSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        topic: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "easy",
            index: true,
        },
        question: {
            type: String,
            required: true,
            trim: true,
        },
        options: {
            type: [String],
            required: true,
            validate: {
                validator: function (v) {
                    return Array.isArray(v) && v.length >= 2;
                },
                message: "A question must have at least 2 options",
            },
        },
        correctAnswer: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (v) {
                    // Ensures that the correct answer is one of the available options
                    return this.options ? this.options.includes(v) : true;
                },
                message: "The correct answer must be one of the provided options",
            },
        },
        explanation: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RoleBasedQuestion", RoleBasedQuestionSchema);
