const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema(
  {
    // ✅ store ONLY hashed OTP (never plain)
    codeHash: { type: String, default: "" },

    // ✅ expiry time
    expiresAt: { type: Date, default: null },

    // ✅ brute-force protection
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: null },

    // ✅ optional flag (you can rely on isEmailVerified too)
    verified: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    // 🔐 Google OAuth (optional)
    // sparse: true allows many docs without googleId
    googleId: { type: String, index: true, sparse: true },

    // 👤 Basic info
    name: { type: String, trim: true, default: "" },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    avatar: { type: String, default: "" },

    // 🔑 Local auth
    // for Google users this can be empty string (or undefined)
    passwordHash: { type: String, default: "" },

    // ✅ final verification flag
    isEmailVerified: { type: Boolean, default: false },

    // 📩 OTP block
    otp: { type: OTPSchema, default: () => ({}) },

    // ✅ optional: track provider (helps logic in routes)
    provider: { type: String, enum: ["local", "google"], default: "local" },
  },
  { timestamps: true }
);

// ✅ Ensure email is unique case-insensitively (your lowercase:true already helps)
// Extra safety: normalize email before save
UserSchema.pre("save", function () {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
});

module.exports = mongoose.model("User", UserSchema);