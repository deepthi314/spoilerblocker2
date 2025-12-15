// Helper functions
const generateToken = (id) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

module.exports = {
    generateToken
};
