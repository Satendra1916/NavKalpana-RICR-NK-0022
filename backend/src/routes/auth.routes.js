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
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        return res.redirect(`${FRONTEND_URL}/`);
      });
    } else {
      res.clearCookie("connect.sid");
      return res.redirect(`${FRONTEND_URL}/`);
    }
  });
});
module.exports = router;
