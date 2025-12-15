password,
});

if (user) {
    res.status(201).json({
        token: generateToken(user._id),
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            settings: user.settings
        }
    });
} else {
    res.status(400);
    throw new Error('Invalid user data');
}
    } catch (err) {
    next(err);
}
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    settings: user.settings,
                    blockedKeywords: user.blockedKeywords,
                    status: 'active'
                }
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (err) {
        next(err);
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    res.json({ user: req.user });
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Public/Private
router.post('/logout', (req, res) => {
    // Client side just drops the token, but we can send a response
    res.json({ message: 'Logged out successfully' });
});

// @desc    Update Settings
// @route   PUT /api/user/settings
// @access  Private
router.put('/settings', protect, async (req, res, next) => {
    try {
        const user = req.user;
        const { sensitivity, autoBlock, notifications } = req.body;

        if (user) {
            user.settings.sensitivity = sensitivity || user.settings.sensitivity;
            // Need to check specific boolean existence because false is falsy
            if (autoBlock !== undefined) user.settings.autoBlock = autoBlock;
            if (notifications !== undefined) user.settings.notifications = notifications;

            const updatedUser = await user.save();
            res.json({ settings: updatedUser.settings });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (err) {
        next(err);
    }
});

// @desc    Change Password
// @route   PUT /api/user/password
// @access  Private
router.put('/password', protect, async (req, res, next) => {
    try {
        const user = req.user;
        const { currentPassword, newPassword } = req.body;

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401);
            throw new Error('Invalid current password');
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;
