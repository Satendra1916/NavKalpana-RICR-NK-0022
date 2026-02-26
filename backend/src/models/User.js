const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true },
    name: String,
    email: { type: String, index: true },
    avatar: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);