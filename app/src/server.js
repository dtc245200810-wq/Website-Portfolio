const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const logger = require('./logger');
const db = require('./db');
const { metricsMiddleware } = require('./metrics');
const { helmetConfig, generalLimiter } = require('./middleware/security');
const { csrfMiddleware, verifyCsrf } = require('./middleware/auth');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Trust first proxy (Nginx reverse proxy)
app.set('trust proxy', 1);

// Set view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Security headers with Helmet
app.use(helmetConfig);

// Body parsers
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Session store in MySQL
let sessionStore;
try {
    sessionStore = new MySQLStore({
        clearExpired: true,
        checkExpirationInterval: 900000, // 15 mins
        expiration: 86400000, // 24 hours
        createDatabaseTable: false,
        schema: {
            tableName: 'sessions',
            columnNames: {
                session_id: 'session_id',
                expires: 'expires',
                data: 'data'
            }
        }
    }, db.getPool());

    sessionStore.on('error', (err) => {
        // Handled silently when MySQL is temporarily offline
    });
} catch (e) {
    logger.warn('Failed to initialize MySQL session store, falling back to memory store', { error: e.message });
}

app.use(session({
    name: 'portfolio_sid',
    secret: process.env.SESSION_SECRET || 'dev_secret_key_32_characters_random_string_ictu',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true for HTTPS
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// CSRF tokens and verification
app.use(csrfMiddleware);
app.use(verifyCsrf);

// Global view variables
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.currentUser = req.session ? req.session.user : null;
    next();
});

// General rate limiter on all public requests
app.use(generalLimiter);

// Mount routes
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
    logger.warn('Resource not found', {
        event: 'http_404',
        path: req.originalUrl,
        ip: req.ip,
        method: req.method
    });
    res.status(404).render('public/error', {
        statusCode: 404,
        title: '404 - Trang Không Tồn Tại',
        message: `Đường dẫn "${req.originalUrl}" không tồn tại trên hệ thống.`,
        user: req.session ? req.session.user : null
    });
});

// 500 Error Handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    logger.error('Unhandled server error', {
        event: 'server_error',
        error: err.message,
        stack: err.stack,
        path: req.originalUrl,
        ip: req.ip
    });

    res.status(500).render('public/error', {
        statusCode: 500,
        title: '500 - Lỗi Máy Chủ Nội Bộ',
        message: 'Đã có sự cố xảy ra trong quá trình xử lý yêu cầu. Đội ngũ quản trị đã được thông báo.',
        user: req.session ? req.session.user : null
    });
});

// Start listening
const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Portfolio System server running on port ${PORT}`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        student: 'To Vu Dat (DTC245200810)'
    });
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    logger.info('Received shutdown signal, terminating server gracefully...');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
}

module.exports = app;
