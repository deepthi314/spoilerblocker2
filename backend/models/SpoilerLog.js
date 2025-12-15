const mongoose = require('mongoose');

const spoilerLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    result: {
        type: String,
        enum: ['blocked', 'safe'],
        required: true
    },
    confidence: {
        type: Number,
        required: true
    },
    detectedKeywords: [{
        type: String
    }],
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high']
    },
    source: {
        type: String,
        default: 'web'
    }
}, {
    timestamps: true
});

const SpoilerLog = mongoose.model('SpoilerLog', spoilerLogSchema);
module.exports = SpoilerLog;
