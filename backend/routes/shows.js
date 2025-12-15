const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Show = require('../models/Show');

// @desc    Get all shows
// @route   GET /api/shows
// @access  Private
router.get('/', protect, async (req, res, next) => {
    try {
        const shows = await Show.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ shows });
    } catch (err) {
        next(err);
    }
});

// @desc    Add a show
// @route   POST /api/shows
// @access  Private
router.post('/', protect, async (req, res, next) => {
    try {
        const { title, type, posterUrl, status } = req.body;

        const show = await Show.create({
            userId: req.user._id,
            title,
            type,
            posterUrl,
            status
        });

        res.status(201).json({ show });
    } catch (err) {
        next(err);
    }
});

// @desc    Delete a show
// @route   DELETE /api/shows/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const show = await Show.findById(req.params.id);

        if (show) {
            if (show.userId.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized');
            }
            await show.deleteOne();
            const shows = await Show.find({ userId: req.user._id }).sort({ createdAt: -1 });
            res.json({ shows });
        } else {
            res.status(404);
            throw new Error('Show not found');
        }
    } catch (err) {
        next(err);
    }
});

// @desc    Update show status
// @route   PUT /api/shows/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
    try {
        const show = await Show.findById(req.params.id);

        if (show) {
            if (show.userId.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized');
            }
            show.status = req.body.status || show.status;
            const updatedShow = await show.save();
            res.json({ show: updatedShow });
        } else {
            res.status(404);
            throw new Error('Show not found');
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;
