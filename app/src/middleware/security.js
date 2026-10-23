const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Custom Helmet configuration for Nginx reverse proxy compatibility
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://avatars.githubusercontent.com"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

// General application rate limiter (300 requests per 15 minutes)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Too Many Requests',
        message: 'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau 15 phút.'
    }
});

// Strict rate limiter for Login attempts (10 failed attempts per 15 minutes)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        status: 429,
        error: 'Too Many Login Attempts',
        message: 'Tài khoản hoặc IP của bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng chờ 15 phút.'
    }
});

// Contact message submission limiter (5 submissions per 15 minutes)
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: 'Too Many Messages',
        message: 'Bạn đã gửi tối đa tin nhắn liên hệ cho phép. Vui lòng chờ trước khi gửi tiếp.'
    }
});

module.exports = {
    helmetConfig,
    generalLimiter,
    loginLimiter,
    contactLimiter
};
