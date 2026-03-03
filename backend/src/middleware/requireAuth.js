module.exports = function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ ok: false, message: "Unauthorized" });
    next();
};
