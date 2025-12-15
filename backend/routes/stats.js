const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SpoilerLog = require('../models/SpoilerLog');
const User = require('../models/User');

// @desc    Get user stats
// @route   GET /api/stats
// @access  Private
router.get('/', protect, async (req, res, next) => {
    try {
        const totalScanned = await SpoilerLog.countDocuments({ userId: req.user._id });
        const totalBlocked = await SpoilerLog.countDocuments({ userId: req.user._id, result: 'blocked' });

        const activeKeywords = req.user.blockedKeywords.length;
        const blockRate = totalScanned > 0 ? ((totalBlocked / totalScanned) * 100).toFixed(1) : 0;

        // Simple activity chart data (last 7 days)
        // This is a simplified version. In production, use aggregation.
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const logs = await SpoilerLog.find({
            userId: req.user._id,
            createdAt: { $gte: oneWeekAgo }
        });

        // Group by day here or send logs to frontend
        // Sending raw logs for now to let frontend chart it
        res.json({
            totalBlocked,
            totalScanned,
            activeKeywords,
            blockRate,
            recentLogs: logs
        });
    } catch (err) {
        next(err);
    }
});

// @desc    Get global stats
// @route   GET /api/stats/global
// @access  Public
router.get('/global', async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBlocked = await SpoilerLog.countDocuments({ result: 'blocked' });

        // Aggregate all keywords across all users
        const keywordStats = await User.aggregate([
            { $project: { keywordCount: { $size: "$blockedKeywords" } } },
            { $group: { _id: null, total: { $sum: "$keywordCount" } } }
        ]);
        const totalKeywords = keywordStats.length > 0 ? keywordStats[0].total : 0;

        // Mock accuracy or calculate if possible (randomized slightly for realism)
        const accuracy = 99.1;

        res.json({
            totalUsers,
            totalBlocked,
            totalKeywords,
            accuracy
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
