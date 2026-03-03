// src/server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo").default;

// ✅ init passport
const initPassport = require("./config/passport");
initPassport();

// ✅ routes
const interviewRoutes = require("./routes/interview");
const authRoutes = require("./routes/auth.routes");
const localAuthRoutes = require("./routes/auth.local");
const resumeRoutes = require("./routes/resume.routes");
const aiRoutes = require("./routes/ai");
const analyticsRoutes = require("./routes/analytics");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ✅ IMPORTANT for Render/NGINX/Proxy deployments
app.set("trust proxy", 1);

console.log(
  "GROQ_API_KEY present?",
  !!process.env.GROQ_API_KEY,
  "len=",
  process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0
);

// ✅ 1) CORS FIRST (proper + preflight fix)
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options(/.*/, cors());
// ✅ 2) BODY PARSER
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ 3) SESSION BEFORE PASSPORT
app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: process.env.MONGO_DBNAME,
      stringify: false,
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax", // production cross-site ho to "none"
      secure: false, // production https ho to true
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ✅ 4) PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// ✅ 5) ROUTES
app.use("/api/interview", interviewRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/auth", authRoutes);
app.use("/auth/local", localAuthRoutes);

app.get("/", (req, res) => res.send("✅ Backend running"));
app.get("/db/test", (req, res) => {
  res.json({ ok: true, dbName: mongoose.connection.name });
});

// ✅ Start only after DB is connected
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.log("❌ MongoDB error:", err.message);
    process.exit(1);
  }
}

start();





