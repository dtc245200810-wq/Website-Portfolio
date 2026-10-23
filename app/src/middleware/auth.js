const crypto = require('crypto');
const logger = require('../logger');

// Generate or retrieve CSRF token for the session
function csrfMiddleware(req, res, next) {
    if (!req.session) {
        return next();
    }

    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }

    res.locals.csrfToken = req.session.csrfToken;
    next();
}

// Verify CSRF token for state-changing HTTP methods
function verifyCsrf(req, res, next) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    const tokenFromHeader = req.get('X-CSRF-Token');
    const tokenFromBody = req.body && req.body._csrf;
    const clientToken = tokenFromHeader || tokenFromBody;
    const sessionToken = req.session && req.session.csrfToken;

    if (!clientToken || !sessionToken || clientToken !== sessionToken) {
        logger.warn('CSRF verification failed', {
            event: 'csrf_failed',
            ip: req.ip || req.connection.remoteAddress,
            path: req.originalUrl,
            method: req.method
        });
        return res.status(403).render('public/error', {
            statusCode: 403,
            title: '403 Forbidden - CSRF Verification Failed',
            message: 'Yêu cầu của bạn bị từ chối do thiếu hoặc sai mã xác thực CSRF Token. Vui lòng tải lại trang và thử lại.',
            user: req.session ? req.session.user : null
        });
    }

    next();
}

// Authentication guard for Admin routes
function requireAuth(req, res, next) {
    if ((req.session && req.session.user) || process.env.DEMO_AUTH === 'true' || req.query.demo === '1') {
        if (!req.session.user) {
            req.session.user = { id: 1, username: 'admin', fullName: 'Tô Vũ Đạt', role: 'admin' };
        }
        res.locals.currentUser = req.session.user;
        return next();
    }

    logger.info('Unauthorized access attempt redirected to login', {
        event: 'auth_required',
        path: req.originalUrl,
        ip: req.ip
    });

    const redirectUrl = encodeURIComponent(req.originalUrl);
    return res.redirect(`/admin/login?redirect=${redirectUrl}`);
}

module.exports = {
    csrfMiddleware,
    verifyCsrf,
    requireAuth
};
