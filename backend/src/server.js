require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

const initPassport = require("./config/passport");
initPassport();

const authRoutes = require("./routes/auth.routes");
const resumeRoutes = require("./routes/resume.routes");
const aiRoutes = require("./routes/ai");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const mongoose = require("mongoose");
require("dotenv").config();

// ✅ 1. CORS FIRST
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ✅ 2. body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 3. session BEFORE passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  })
);

// ✅ 4. passport
app.use(passport.initialize());
app.use(passport.session());
initPassport();

// ✅ 5. routes LAST
app.use("/api/ai", aiRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => res.send("✅ Backend running"));

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err.message));

app.get("/db/test", (req, res) => {
  res.json({ ok: true, dbName: mongoose.connection.name });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});







