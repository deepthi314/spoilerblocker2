const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SpoilerLog = require('../models/SpoilerLog');
const { detectSpoiler } = require('../utils/spoilerEngine');

// Middleware to verify token
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Get User Profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Update Preferences
router.put('/preferences', auth, async (req, res) => {
    try {
        const { blockedKeywords, protectedShows, strictMode } = req.body;
        const user = await User.findById(req.user.id);

        if (blockedKeywords) user.preferences.blockedKeywords = blockedKeywords;
        if (protectedShows) user.preferences.protectedShows = protectedShows;
        if (strictMode !== undefined) user.preferences.strictMode = strictMode;

        await user.save();
        res.json(user.preferences);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// RESTful Spoiler Detection (for batch processing)
router.post('/detect', auth, async (req, res) => {
    try {
        const { text } = req.body;
        const user = await User.findById(req.user.id);

        const result = detectSpoiler(text, user.preferences);

        // Log it async (fire and forget for perf)
        if (result.isSpoiler) {
            new SpoilerLog({
                userId: user.id,
                originalText: text.substring(0, 200), // Truncate for safety/storage
                detectedKeywords: result.detectedTerms,
                confidenceScore: result.confidence
            }).save();
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Stats Dashboard
router.get('/stats', auth, async (req, res) => {
    try {
        const totalLogs = await SpoilerLog.countDocuments({ userId: req.user.id });
        const recentSpoilers = await SpoilerLog.find({ userId: req.user.id })
            .sort({ timestamp: -1 })
            .limit(5);

        res.json({
            blockedCount: totalLogs,
            recent: recentSpoilers
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
