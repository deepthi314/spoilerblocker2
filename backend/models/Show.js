const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['movie', 'tv'],
        default: 'tv'
    },
    status: {
        type: String,
        enum: ['watching', 'completed'],
        default: 'watching'
    },
    posterUrl: {
        type: String
    }
}, {
    timestamps: true
});

const Show = mongoose.model('Show', showSchema);
module.exports = Show;
