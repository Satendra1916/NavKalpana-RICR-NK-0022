function requireAuth(req, res, next) {
    const ok = req.isAuthenticated?.() && req.user;
    if (ok) return next();
    return res.status(401).json({ ok: false, message: "Unauthorized" });
}

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;