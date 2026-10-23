const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger');
const { register } = require('../metrics');
const { contactLimiter } = require('../middleware/security');

// 1. Homepage Portfolio
router.get('/', async (req, res, next) => {
    try {
        // Fetch Profile
        const profiles = await db.query('SELECT * FROM profile ORDER BY id ASC LIMIT 1');
        const profile = profiles[0] || {
            full_name: 'Tô Vũ Đạt',
            student_id: 'DTC245200810',
            class_name: 'CNTT K23I',
            headline: 'Fullstack Web Developer & DevOps Enthusiast',
            bio: 'Sinh viên CNTT K23I - Trường ĐH CNTT & Truyền thông Thái Nguyên.',
            email: 'dtc245200810@ictu.edu.vn',
            github_url: 'https://github.com/dtc245200810-wq'
        };

        // Fetch Projects (ordered by sort_order and featured)
        const projects = await db.query('SELECT * FROM projects ORDER BY featured DESC, sort_order ASC');

        // Fetch Skills
        const skillsRaw = await db.query('SELECT * FROM skills ORDER BY sort_order ASC');
        const skillsByCategory = {
            'Frontend': skillsRaw.filter(s => s.category === 'Frontend'),
            'Backend': skillsRaw.filter(s => s.category === 'Backend'),
            'DevOps & System': skillsRaw.filter(s => s.category === 'DevOps & System'),
            'Database': skillsRaw.filter(s => s.category === 'Database')
        };

        // Fetch Experiences
        const experiences = await db.query('SELECT * FROM experiences ORDER BY sort_order ASC');

        res.render('public/index', {
            title: `${profile.full_name} | Portfolio Cá Nhân`,
            profile,
            projects,
            skillsByCategory,
            experiences,
            contactSuccess: req.query.sent === 'true',
            contactError: req.query.error || null,
            user: req.session ? req.session.user : null
        });
    } catch (err) {
        next(err);
    }
});

// 2. Project Detail Page
router.get('/project/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;
        const projects = await db.query('SELECT * FROM projects WHERE slug = ? LIMIT 1', [slug]);
        
        if (projects.length === 0) {
            return res.status(404).render('public/error', {
                statusCode: 404,
                title: '404 - Không Tìm Thấy Dự Án',
                message: `Dự án với đường dẫn "${slug}" không tồn tại hoặc đã được gỡ bỏ.`,
                user: req.session ? req.session.user : null
            });
        }

        const project = projects[0];
        const otherProjects = await db.query(
            'SELECT id, title, slug, category, image_url FROM projects WHERE id != ? ORDER BY sort_order ASC LIMIT 3',
            [project.id]
        );

        res.render('public/project_detail', {
            title: `${project.title} | Chi Tiết Dự Án`,
            project,
            otherProjects,
            user: req.session ? req.session.user : null
        });
    } catch (err) {
        next(err);
    }
});

// 3. Contact Form Submission
router.post('/contact', contactLimiter, async (req, res) => {
    try {
        const { sender_name, sender_email, subject, message } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

        // Basic validation
        if (!sender_name || !sender_email || !subject || !message) {
            return res.redirect('/?error=Vui+lòng+điền+đầy+đủ+tất+cả+các+trường#contact');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sender_email)) {
            return res.redirect('/?error=Địa+chỉ+email+không+hợp+lệ#contact');
        }

        // Insert into database
        const result = await db.query(
            'INSERT INTO contacts (sender_name, sender_email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?)',
            [sender_name.trim(), sender_email.trim(), subject.trim(), message.trim(), ipAddress]
        );

        // Record in audit log
        await db.addAuditLog(
            sender_name.trim(),
            'SUBMIT_CONTACT',
            'contact',
            result.insertId,
            `Gửi tin nhắn liên hệ mới với tiêu đề: ${subject.trim()}`,
            ipAddress
        );

        logger.info('New contact message received', {
            event: 'contact_received',
            sender: sender_email,
            subject,
            ip: ipAddress
        });

        res.redirect('/?sent=true#contact');
    } catch (err) {
        logger.error('Error handling contact submission', { error: err.message });
        res.redirect('/?error=Có+lỗi+xảy+ra+khi+gửi+tin+nhắn.+Vui+lòng+thử+lại+sau#contact');
    }
});

// 4. System Healthcheck Endpoint
router.get('/health', async (req, res) => {
    const dbHealth = await db.checkHealth();
    const isHealthy = dbHealth.status === 'CONNECTED';

    const healthData = {
        status: isHealthy ? 'UP' : 'DEGRADED',
        service: 'portfolio-app',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        student: {
            name: 'Tô Vũ Đạt',
            studentId: 'DTC245200810',
            class: 'CNTT K23I',
            topic: 'Đề 13: Website Portfolio / Giới thiệu Cá nhân'
        },
        database: dbHealth
    };

    return res.status(isHealthy ? 200 : 503).json(healthData);
});

// 5. Prometheus Scrape Endpoint
router.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(err.message);
    }
});

module.exports = router;
