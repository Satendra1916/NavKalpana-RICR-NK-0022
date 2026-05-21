require("dotenv").config();
const mongoose = require("mongoose");
const QuizRole = require("../models/QuizRole");
const QuizTopic = require("../models/QuizTopic");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/navkalpana";

const roles = [
  { name: "Java Developer" },
  { name: "Frontend Developer" },
  { name: "Backend Developer" },
  { name: "Full Stack Developer" },
];

const topics = [
  { role: "Java Developer", name: "Java Basics" },
  { role: "Java Developer", name: "OOP" },
  { role: "Java Developer", name: "Collections" },
  { role: "Java Developer", name: "Exception Handling" },
  { role: "Java Developer", name: "Multithreading" },
  { role: "Java Developer", name: "JDBC" },
  { role: "Java Developer", name: "Spring Boot" },

  { role: "Frontend Developer", name: "HTML" },
  { role: "Frontend Developer", name: "CSS" },
  { role: "Frontend Developer", name: "JavaScript" },
  { role: "Frontend Developer", name: "React" },

  { role: "Backend Developer", name: "Node.js" },
  { role: "Backend Developer", name: "Express" },
  { role: "Backend Developer", name: "MongoDB" },
  { role: "Backend Developer", name: "API" },

  { role: "Full Stack Developer", name: "Frontend" },
  { role: "Full Stack Developer", name: "Backend" },
  { role: "Full Stack Developer", name: "Database" },
  { role: "Full Stack Developer", name: "Authentication" },
];

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    await QuizRole.deleteMany({});
    await QuizTopic.deleteMany({});

    await QuizRole.insertMany(roles);
    await QuizTopic.insertMany(topics);

    console.log("Quiz roles and topics seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

run();