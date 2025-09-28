const rateLimit = require('express-rate-limit');

const caseLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: {
        success: false,
        error: 'Too many case openings, please try again later'
    },
    keyGenerator: (req) => req.body.userId || req.ip
});

const depositLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Too many deposit attempts'
    }
});

module.exports = { caseLimiter, depositLimiter };