const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to Database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Logging
app.use(morgan('dev'));

// Body Parser
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/detect', require('./routes/detect'));
app.use('/api/keywords', require('./routes/keywords'));
app.use('/api/shows', require('./routes/shows'));
app.use('/api/stats', require('./routes/stats'));

// Root Route
app.get('/', (req, res) => {
    res.send('Spoiler Blocker API is running');
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
