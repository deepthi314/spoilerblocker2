const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @desc    Get all keywords
// @route   GET /api/keywords
// @access  Private
router.get('/', protect, async (req, res) => {
    res.json({ keywords: req.user.blockedKeywords });
});

// @desc    Add a keyword
// @route   POST /api/keywords
// @access  Private
router.post('/', protect, async (req, res, next) => {
    try {
        const { keyword, category } = req.body;
        const user = req.user;

        if (user.blockedKeywords.find(k => k.keyword.toLowerCase() === keyword.toLowerCase())) {
            res.status(400);
            throw new Error('Keyword already exists');
        }

        user.blockedKeywords.push({ keyword, category });
        await user.save();

        res.json({ keywords: user.blockedKeywords });
    } catch (err) {
        next(err);
    }
});

// @desc    Delete a keyword
// @route   DELETE /api/keywords/:keyword
// @access  Private
router.delete('/:keyword', protect, async (req, res, next) => {
    try {
        const user = req.user;
        const keywordToRemove = req.params.keyword;

        user.blockedKeywords = user.blockedKeywords.filter(
            k => k.keyword.toLowerCase() !== keywordToRemove.toLowerCase()
        );
        await user.save();

        res.json({ keywords: user.blockedKeywords });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
