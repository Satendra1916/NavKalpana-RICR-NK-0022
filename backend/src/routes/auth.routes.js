const express = require("express");
const passport = require("passport");
const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  (req, res, next) => {
    if (!req.query.code) return res.redirect(FRONTEND_URL);
    next();
  },
  passport.authenticate("google", { failureRedirect: FRONTEND_URL }),
  (req, res) => {
    req.session.save(() => res.redirect(`${FRONTEND_URL}/dashboard`));
  }
);
router.get("/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) return res.json({ user: req.user });
  return res.json({ user: null });
});
router.get("/logout", (req, res) => {
  req.logout((err) => {
    // Even if logout throws error, we still redirect to login
    try {
      res.clearCookie("connect.sid");
    } catch {}

    const FRONTEND = process.env.FRONTEND_URL || "http://localhost:3000";

    if (err) {
      return res.redirect(`${FRONTEND}/login`);
    }

    // destroy session if exists
    if (req.session) {
      req.session.destroy(() => {
        return res.redirect(`${FRONTEND}/login`);
      });
    } else {
      return res.redirect(`${FRONTEND}/login`);
    }
  });
});
module.exports = router;
