const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
module.exports = function initPassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.BACKEND_URL
          ? `${process.env.BACKEND_URL.replace(/\/$/, "")}/auth/google/callback`
          : "http://localhost:5000/auth/google/callback",
      },
      (accessToken, refreshToken, profile, done) => done(null, profile)
    )
  );
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));
};
