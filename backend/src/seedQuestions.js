require("dotenv").config();
const mongoose = require("mongoose");

const RoleBasedQuestion = require("./models/RoleBasedQuestion");
const questions = require("./data/seedQuestions");

async function seed() {
    try {
        const MONGO_URI =
            process.env.MONGO_URI || "mongodb://127.0.0.1:27017/navkalpana";

        await mongoose.connect(MONGO_URI);

        console.log("✅ MongoDB connected");

        await RoleBasedQuestion.deleteMany({});
        console.log("Old role-based questions removed");

        // Transform old questions format to RoleBasedQuestion format
        const transformedQuestions = questions.map((q) => {
            const optionsTexts = q.options.map((opt) => opt.text);
            const correctOpt = q.options.find((opt) => opt.key === q.answer.correctOption);
            const correctAnswer = correctOpt ? correctOpt.text : "";

            return {
                role: q.role,
                topic: q.topic,
                difficulty: q.difficulty,
                question: q.questionText,
                options: optionsTexts,
                correctAnswer: correctAnswer,
                explanation: q.answer.explanation || "",
            };
        });

        await RoleBasedQuestion.insertMany(transformedQuestions);

        console.log("✅ Role-based questions inserted successfully");

        process.exit();
    } catch (err) {
        console.error("❌ Seed failed:", err);
        process.exit(1);
    }
}

seed();