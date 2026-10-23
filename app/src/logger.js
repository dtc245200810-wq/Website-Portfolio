const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    try {
        fs.mkdirSync(logDir, { recursive: true });
    } catch (e) {
        // Fallback silently if read-only or handled by init container
    }
}

// Custom sanitizer to prevent sensitive data leak in logs
const sanitizeFormat = winston.format((info) => {
    const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'cookie', '_csrf', 'session_id'];
    const sanitizeObj = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const cleaned = Array.isArray(obj) ? [] : {};
        for (const [key, val] of Object.entries(obj)) {
            if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
                cleaned[key] = '[REDACTED]';
            } else if (typeof val === 'object' && val !== null) {
                cleaned[key] = sanitizeObj(val);
            } else {
                cleaned[key] = val;
            }
        }
        return cleaned;
    };
    return sanitizeObj(info);
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        sanitizeFormat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'portfolio-app' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
                sanitizeFormat(),
                winston.format.json()
            )
        })
    ]
});

// Add file transport if directory is writable
try {
    const logFilePath = path.join(logDir, 'app.log');
    logger.add(new winston.transports.File({
        filename: logFilePath,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
    }));
} catch (err) {
    console.warn('File logging disabled or unwritable:', err.message);
}

module.exports = logger;
