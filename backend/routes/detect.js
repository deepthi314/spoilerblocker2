const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const spoilerDetector = require('../utils/spoilerDetector');
const SpoilerLog = require('../models/SpoilerLog');

// @desc    Detect spoiler in text
// @route   POST /api/detect
// @access  Private (or Public for demo, but spec says Private for managing data)
router.post('/', protect, async (req, res, next) => {
    try {
        const { text } = req.body;

        // Get user's custom keywords
        const userKeywords = req.user.blockedKeywords.map(k => k.keyword);

        // Analyze
        const result = spoilerDetector.detect(text, userKeywords);

        // Save log
        const log = await SpoilerLog.create({
            userId: req.user._id,
            content: text.substring(0, 500), // Truncate for storage if too long
            result: result.isSpoiler ? 'blocked' : 'safe',
            confidence: result.confidence,
            detectedKeywords: result.detectedKeywords,
            riskLevel: result.riskLevel
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
});

// @desc    Get detection history
// @route   GET /api/detect/history
// @access  Private
router.get('/history', protect, async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const count = await SpoilerLog.countDocuments({ userId: req.user._id });
        const logs = await SpoilerLog.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        res.json({
            logs,
            page,
            pages: Math.ceil(count / limit),
            total: count
        });
    } catch (err) {
        next(err);
    }
});

// @desc    Delete a log entry
// @route   DELETE /api/detect/history/:id
// @access  Private
router.delete('/history/:id', protect, async (req, res, next) => {
    try {
        const log = await SpoilerLog.findById(req.params.id);

        if (log) {
            if (log.userId.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized');
            }
            await log.deleteOne();
            res.json({ message: 'Log removed' });
        } else {
            res.status(404);
            throw new Error('Log not found');
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;
