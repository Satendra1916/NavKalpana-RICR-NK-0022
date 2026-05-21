// backend/src/server.js

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo").default;

// quiz meta routes (roles + topics)
const quizMetaRoutes = require("./routes/quiz.meta.routes");

const initPassport = require("./config/passport");
initPassport();

// routes
const interviewRoutes = require("./routes/interview");
const authRoutes = require("./routes/auth.routes");
const localAuthRoutes = require("./routes/auth.local");
const resumeRoutes = require("./routes/resume.routes");
const resumeAnalyzeRoutes = require("./routes/resume.analyze");
const aiRoutes = require("./routes/ai");
const analyticsRoutes = require("./routes/analytics");
const quizRoutes = require("./routes/quiz");
const quizAiRoutes = require("./routes/quiz.ai");
const playgroundRoutes = require("./routes/playground");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.set("trust proxy", 1);

console.log(
  "GROQ_API_KEY present?",
  !!process.env.GROQ_API_KEY,
  "len=",
  process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0
);

console.log("MONGO_URI exists?", !!process.env.MONGO_URI);


// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(/.*/, cors());


// body parser
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));


async function start() {
  try {

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      family: 4,
    });

    console.log("✅ MongoDB connected");

    const mongoClient = mongoose.connection.getClient();

    // session store
    app.use(
      session({
        name: "connect.sid",
        secret: process.env.SESSION_SECRET || "secret",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          client: mongoClient,
          dbName: "navkalpana",
          stringify: false,
        }),
        cookie: {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
          maxAge: 1000 * 60 * 60 * 24 * 7,
        },
      })
    );


    // passport
    app.use(passport.initialize());
    app.use(passport.session());


    // =========================
    // API ROUTES
    // =========================

    app.use("/api/interview", interviewRoutes);

    app.use("/api/ai", aiRoutes);

    app.use("/api/resume", resumeAnalyzeRoutes);
    app.use("/api/resume", resumeRoutes);

    app.use("/api/analytics", analyticsRoutes);

    // quiz
    app.use("/api/quiz/meta", quizMetaRoutes);   // roles + topics
    app.use("/api/quiz", quizRoutes);
    app.use("/api/quiz/ai", quizAiRoutes);

    app.use("/api/playground", playgroundRoutes);

    // auth
    app.use("/auth", authRoutes);
    app.use("/auth/local", localAuthRoutes);


    // =========================
    // TEST ROUTES
    // =========================

    app.get("/", (req, res) => {
      res.send("✅ Backend running");
    });

    app.get("/db/test", (req, res) => {
      res.json({
        ok: true,
        dbName: mongoose.connection.name,
      });
    });


    // start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.log("❌ MongoDB error:", err.message);
    process.exit(1);
  }
}

start();