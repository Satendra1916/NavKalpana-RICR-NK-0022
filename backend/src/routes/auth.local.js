// File: backend/src/routes/auth.local.js
// ✅ FULL READY-TO-PASTE (CommonJS) — Signup + OTP Send + Resend + Verify + Login

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ✅ email utils (make sure this file exists)
const { sendMail, otpEmailTemplate } = require("../utils/sendMail");

// Parsers (safe even if server.js already has them)
router.use(express.json({ limit: "1mb" }));
router.use(express.urlencoded({ extended: true }));

// ===== Helpers =====
function safeBody(req) {
    if (typeof req.body === "string") {
        try {
            return JSON.parse(req.body || "{}");
        } catch {
            return {};
        }
    }
    return req.body || {};
}

function normalizeEmail(email) {
    return String(email || "").toLowerCase().trim();
}

function generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

async function makeOtpBlock(plainOtp) {
    const codeHash = await bcrypt.hash(String(plainOtp), 10);
    const expiresMin = Number(process.env.OTP_EXPIRES_MIN || 10);
    const expiresAt = new Date(Date.now() + expiresMin * 60 * 1000);

    return {
        codeHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
        verified: false,
    };
}

function isOtpExpired(expiresAt) {
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() < Date.now();
}

async function sendOtpEmail(toEmail, otp) {
    const expiresMin = Number(process.env.OTP_EXPIRES_MIN || 10);

    await sendMail({
        to: toEmail,
        subject: "Your Career Runway OTP",
        html: otpEmailTemplate(otp, expiresMin),
        text: `Your OTP is ${otp}. It expires in ${expiresMin} minutes.`,
    });
}

// Cooldown for resend
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 sec
const MAX_OTP_ATTEMPTS = 5;

// DEV ONLY: return OTP in response?
const RETURN_OTP_IN_RESPONSE = process.env.RETURN_OTP_IN_RESPONSE === "true";

// ===== Routes =====

// ✅ SIGNUP (create user OR resend OTP if existing but not verified)
router.post("/signup", async (req, res) => {
    try {
        const body = safeBody(req);
        const name = String(body.name || "").trim();
        const email = normalizeEmail(body.email);
        const password = String(body.password || "");

        if (!name) return res.status(400).json({ error: "Name required" });
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });
        if (password.length < 6) return res.status(400).json({ error: "Password must be 6+ characters" });

        const existing = await User.findOne({ email });

        // ✅ Case 1: already verified -> block
        if (existing && existing.isEmailVerified) {
            return res.status(409).json({ error: "Email already exists" });
        }

        // ✅ Generate OTP + hashes
        const otp = generateOTP();
        const otpBlock = await makeOtpBlock(otp);

        // ✅ Case 2: exists but NOT verified -> update & resend OTP
        if (existing && !existing.isEmailVerified) {
            const lastSent = existing.otp?.lastSentAt ? new Date(existing.otp.lastSentAt).getTime() : 0;
            if (lastSent && Date.now() - lastSent < RESEND_COOLDOWN_MS) {
                const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
                return res.status(429).json({ error: `Please wait ${waitSec}s before requesting OTP again.` });
            }

            // Update name if provided, update passwordHash (user might re-try)
            existing.name = name || existing.name;
            existing.passwordHash = await bcrypt.hash(password, 10);
            existing.provider = existing.provider || "local";
            existing.isEmailVerified = false;

            existing.otp = otpBlock;
            await existing.save();

            // ✅ SEND OTP EMAIL
            await sendOtpEmail(email, otp);

            return res.json({
                ok: true,
                message: "OTP resent. Please verify your email.",
                userId: existing._id,
                ...(RETURN_OTP_IN_RESPONSE ? { otp } : {}),
            });
        }

        // ✅ Case 3: new user create
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
            provider: "local",
            isEmailVerified: false,
            otp: otpBlock,
        });

        // ✅ SEND OTP EMAIL
        await sendOtpEmail(email, otp);

        return res.json({
            ok: true,
            message: "Signup success. OTP sent for verification.",
            userId: user._id,
            ...(RETURN_OTP_IN_RESPONSE ? { otp } : {}),
        });
    } catch (e) {
        console.error("signup error:", e);
        return res.status(500).json({ error: "Server error" });
    }
});

// ✅ RESEND OTP (explicit)
router.post("/otp/resend", async (req, res) => {
    try {
        const body = safeBody(req);
        const email = normalizeEmail(body.email);

        if (!email) return res.status(400).json({ error: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.isEmailVerified) {
            return res.status(400).json({ error: "Email already verified. Please login." });
        }

        const lastSent = user.otp?.lastSentAt ? new Date(user.otp.lastSentAt).getTime() : 0;
        if (lastSent && Date.now() - lastSent < RESEND_COOLDOWN_MS) {
            const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
            return res.status(429).json({ error: `Please wait ${waitSec}s before requesting OTP again.` });
        }

        const otp = generateOTP();
        user.otp = await makeOtpBlock(otp);
        await user.save();

        // ✅ SEND OTP EMAIL
        await sendOtpEmail(email, otp);

        return res.json({
            ok: true,
            message: "OTP resent.",
            ...(RETURN_OTP_IN_RESPONSE ? { otp } : {}),
        });
    } catch (e) {
        console.error("resend otp error:", e);
        return res.status(500).json({ error: "Server error" });
    }
});

// ✅ VERIFY OTP
router.post("/otp/verify", async (req, res) => {
    try {
        const body = safeBody(req);
        const email = normalizeEmail(body.email);
        const otp = String(body.otp || "").trim();

        if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.isEmailVerified) {
            return res.json({ ok: true, message: "Email already verified" });
        }

        if (!user.otp?.codeHash || !user.otp?.expiresAt) {
            return res.status(400).json({ error: "OTP not requested" });
        }

        if (isOtpExpired(user.otp.expiresAt)) {
            return res.status(400).json({ error: "OTP expired. Please resend OTP." });
        }

        const attempts = user.otp.attempts || 0;
        if (attempts >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({ error: "Too many attempts. Please resend OTP." });
        }

        const ok = await bcrypt.compare(String(otp), user.otp.codeHash);

        if (!ok) {
            user.otp.attempts = attempts + 1;
            await user.save();
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // ✅ success
        user.isEmailVerified = true;
        user.otp.verified = true;

        // ✅ clear OTP secrets after verification
        user.otp.codeHash = "";
        user.otp.expiresAt = null;
        user.otp.attempts = 0;

        await user.save();

        return res.json({ ok: true, message: "Email verified successfully" });
    } catch (e) {
        console.error("verify otp error:", e);
        return res.status(500).json({ error: "Server error" });
    }
});

// ✅ LOGIN (email + password) + creates session if passport is available
router.post("/login", async (req, res) => {
    try {
        const body = safeBody(req);
        const email = normalizeEmail(body.email);
        const password = String(body.password || "");

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const user = await User.findOne({ email });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: "Invalid credentials" });

        if (!user.isEmailVerified) {
            return res.status(403).json({ error: "Email not verified. Please verify OTP." });
        }

        // If passport session is configured, create login session
        if (typeof req.login === "function") {
            return req.login(user, (err) => {
                if (err) return res.status(500).json({ ok: false, error: "Session create failed" });

                return res.json({
                    ok: true,
                    message: "Login success",
                    user: { id: user._id, name: user.name, email: user.email },
                });
            });
        }

        // Fallback (no passport)
        return res.json({
            ok: true,
            message: "Login success (no session)",
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (e) {
        console.error("login error:", e);
        return res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;