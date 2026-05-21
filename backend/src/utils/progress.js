const UserProgress = require("../models/UserProgress");

async function getProgress(userId) {
    let p = await UserProgress.findOne({ userId });
    if (!p) p = await UserProgress.create({ userId });
    return p;
}

function bumpStreak(progress) {
    const now = new Date();
    const last = progress.lastActiveAt ? new Date(progress.lastActiveAt) : null;

    if (!last) {
        progress.streak = 1;
    } else {
        const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
            // same day -> streak unchanged
        } else if (diffDays === 1) {
            progress.streak += 1;
        } else {
            progress.streak = 1;
        }
    }
    progress.lastActiveAt = now;
}

async function awardBadge(progress, key, title, description, points = 10) {
    const has = progress.badges?.some((b) => b.key === key);
    if (has) return false;
    progress.badges.push({ key, earnedAt: new Date() });
    progress.xp += points;
    // optional: store badge catalog separately, but simple for hackathon
    return true;
}

module.exports = { getProgress, bumpStreak, awardBadge };