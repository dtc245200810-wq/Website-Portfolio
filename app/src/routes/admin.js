const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const logger = require('../logger');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/security');
const { activeSessionsGauge } = require('../metrics');

// 1. Admin Login Form
router.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', {
        title: 'Đăng Nhập Quản Trị | Portfolio System',
        error: req.query.error || null,
        redirect: req.query.redirect || '/admin/dashboard'
    });
});

// 2. Handle Admin Login
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password, redirect } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    try {
        if (!username || !password) {
            logger.warn('Login attempt with missing credentials', {
                event: 'login_failed',
                username: username || 'empty',
                reason: 'missing_fields',
                ip: ipAddress
            });
            return res.status(401).render('admin/login', {
                title: 'Đăng Nhập Quản Trị | Portfolio System',
                error: 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.',
                redirect: redirect || '/admin/dashboard'
            });
        }

        const users = await db.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username.trim()]);
        
        if (users.length === 0) {
            logger.warn('Login failed: user not found', {
                event: 'login_failed',
                username: username.trim(),
                reason: 'user_not_found',
                ip: ipAddress
            });
            await db.addAuditLog(username.trim(), 'LOGIN_FAILED', 'user', null, 'Đăng nhập thất bại: người dùng không tồn tại', ipAddress);
            return res.status(401).render('admin/login', {
                title: 'Đăng Nhập Quản Trị | Portfolio System',
                error: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
                redirect: redirect || '/admin/dashboard'
            });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            logger.warn('Login failed: password mismatch', {
                event: 'login_failed',
                username: user.username,
                reason: 'invalid_password',
                ip: ipAddress
            });
            await db.addAuditLog(user.username, 'LOGIN_FAILED', 'user', user.id, 'Đăng nhập thất bại: sai mật khẩu', ipAddress);
            return res.status(401).render('admin/login', {
                title: 'Đăng Nhập Quản Trị | Portfolio System',
                error: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
                redirect: redirect || '/admin/dashboard'
            });
        }

        // Login successful: regenerate session to prevent session fixation
        req.session.regenerate((err) => {
            if (err) {
                logger.error('Session regeneration error', { error: err.message });
                return res.redirect('/admin/login?error=Lỗi+khởi+tạo+phiên+làm+việc');
            }

            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            };

            activeSessionsGauge.inc();

            logger.info('Admin login successful', {
                event: 'login_success',
                username: user.username,
                ip: ipAddress
            });

            db.addAuditLog(user.username, 'LOGIN_SUCCESS', 'user', user.id, 'Quản trị viên đăng nhập thành công', ipAddress);

            const safeRedirect = redirect && redirect.startsWith('/') ? redirect : '/admin/dashboard';
            res.redirect(safeRedirect);
        });

    } catch (err) {
        logger.error('Login process error', { error: err.message });
        res.status(500).render('admin/login', {
            title: 'Đăng Nhập Quản Trị | Portfolio System',
            error: 'Lỗi hệ thống trong quá trình xác thực. Vui lòng thử lại sau.',
            redirect: redirect || '/admin/dashboard'
        });
    }
});

// 3. Handle Admin Logout
router.post('/logout', requireAuth, (req, res) => {
    const username = req.session.user ? req.session.user.username : 'admin';
    const ipAddress = req.ip || '127.0.0.1';

    logger.info('Admin logged out', { event: 'logout', username, ip: ipAddress });
    db.addAuditLog(username, 'LOGOUT', 'user', null, 'Quản trị viên đã đăng xuất', ipAddress);

    activeSessionsGauge.dec();

    req.session.destroy(() => {
        res.clearCookie('portfolio_sid');
        res.redirect('/admin/login?error=Đã+đăng+xuất+thành+công');
    });
});

// All following routes require authentication
router.use(requireAuth);

// 4. Admin Dashboard Overview
router.get('/dashboard', async (req, res, next) => {
    try {
        const [projectCount] = await db.query('SELECT COUNT(*) AS total FROM projects');
        const [skillCount] = await db.query('SELECT COUNT(*) AS total FROM skills');
        const [contactCount] = await db.query('SELECT COUNT(*) AS total FROM contacts');
        const [unreadContactCount] = await db.query('SELECT COUNT(*) AS total FROM contacts WHERE is_read = 0');
        const [auditCount] = await db.query('SELECT COUNT(*) AS total FROM audit_logs');
        
        const recentProjects = await db.query('SELECT * FROM projects ORDER BY created_at DESC LIMIT 5');
        const recentContacts = await db.query('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5');
        const recentAudits = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 6');
        const dbHealth = await db.checkHealth();

        res.render('admin/dashboard', {
            title: 'Bảng Điều Khiển Quản Trị | Portfolio System',
            stats: {
                projects: projectCount.total,
                skills: skillCount.total,
                contacts: contactCount.total,
                unreadContacts: unreadContactCount.total,
                audits: auditCount.total
            },
            recentProjects,
            recentContacts,
            recentAudits,
            dbHealth,
            uptimeSeconds: Math.floor(process.uptime()),
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
});

// 5. Admin Profile Management
router.get('/profile', async (req, res, next) => {
    try {
        const profiles = await db.query('SELECT * FROM profile ORDER BY id ASC LIMIT 1');
        res.render('admin/profile', {
            title: 'Quản Lý Hồ Sơ Cá Nhân | Portfolio System',
            profile: profiles[0] || {},
            success: req.query.success === 'true',
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
});

router.post('/profile', async (req, res, next) => {
    try {
        const { full_name, student_id, class_name, university, headline, bio, email, phone, location, github_url, linkedin_url } = req.body;
        const ipAddress = req.ip || '127.0.0.1';

        await db.query(`
            UPDATE profile SET 
                full_name = ?, student_id = ?, class_name = ?, university = ?, 
                headline = ?, bio = ?, email = ?, phone = ?, location = ?, 
                github_url = ?, linkedin_url = ?
            WHERE id = 1
        `, [
            full_name.trim(), student_id.trim(), class_name.trim(), university.trim(),
            headline.trim(), bio.trim(), email.trim(), phone.trim(), location.trim(),
            github_url.trim(), linkedin_url.trim()
        ]);

        await db.addAuditLog(req.session.user.username, 'UPDATE_PROFILE', 'profile', 1, 'Cập nhật thông tin hồ sơ cá nhân', ipAddress);
        logger.info('Profile updated by admin', { username: req.session.user.username, ip: ipAddress });

        res.redirect('/admin/profile?success=true');
    } catch (err) {
        next(err);
    }
});

// 6. Admin Projects Management (List, New, Edit, Delete)
router.get('/projects', async (req, res, next) => {
    try {
        const projects = await db.query('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC');
        res.render('admin/projects_list', {
            title: 'Quản Lý Dự Án | Portfolio System',
            projects,
            message: req.query.msg || null,
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
});

router.get('/projects/new', (req, res) => {
    res.render('admin/projects_form', {
        title: 'Thêm Dự Án Mới | Portfolio System',
        project: null,
        user: req.session.user
    });
});

router.post('/projects/new', async (req, res, next) => {
    try {
        const { title, slug, category, description, full_content, technologies, demo_url, github_url, featured, sort_order } = req.body;
        const ipAddress = req.ip || '127.0.0.1';

        const result = await db.query(`
            INSERT INTO projects (title, slug, category, description, full_content, technologies, demo_url, github_url, featured, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title.trim(),
            slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            category.trim(),
            description.trim(),
            full_content.trim(),
            technologies.trim(),
            demo_url ? demo_url.trim() : null,
            github_url ? github_url.trim() : null,
            featured ? 1 : 0,
            parseInt(sort_order || 0, 10)
        ]);

        await db.addAuditLog(req.session.user.username, 'CREATE_PROJECT', 'project', result.insertId, `Thêm dự án mới: ${title}`, ipAddress);
        logger.info('Project created', { id: result.insertId, title, user: req.session.user.username });

        res.redirect('/admin/projects?msg=Tạo+dự+án+mới+thành+công');
    } catch (err) {
        next(err);
    }
});

router.get('/projects/:id/edit', async (req, res, next) => {
    try {
        const { id } = req.params;
        const projects = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
        if (projects.length === 0) return res.redirect('/admin/projects?msg=Dự+án+không+tồn+tại');

        res.render('admin/projects_form', {
            title: 'Chỉnh Sửa Dự Án | Portfolio System',
            project: projects[0],
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
});

router.post('/projects/:id/edit', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, slug, category, description, full_content, technologies, demo_url, github_url, featured, sort_order } = req.body;
        const ipAddress = req.ip || '127.0.0.1';

        await db.query(`
            UPDATE projects SET
                title = ?, slug = ?, category = ?, description = ?, full_content = ?,
                technologies = ?, demo_url = ?, github_url = ?, featured = ?, sort_order = ?
            WHERE id = ?
        `, [
            title.trim(),
            slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            category.trim(),
            description.trim(),
            full_content.trim(),
            technologies.trim(),
            demo_url ? demo_url.trim() : null,
            github_url ? github_url.trim() : null,
            featured ? 1 : 0,
            parseInt(sort_order || 0, 10),
            id
        ]);

        await db.addAuditLog(req.session.user.username, 'UPDATE_PROJECT', 'project', id, `Cập nhật dự án ID ${id}: ${title}`, ipAddress);
        logger.info('Project updated', { id, title, user: req.session.user.username });

        res.redirect('/admin/projects?msg=Cập+nhật+dự+án+thành+công');
    } catch (err) {
        next(err);
    }
});

router.post('/projects/:id/delete', async (req, res, next) => {
    try {
        const { id } = req.params;
        const ipAddress = req.ip || '127.0.0.1';

        const [proj] = await db.query('SELECT title FROM projects WHERE id = ?', [id]);
        const title = proj ? proj.title : `ID ${id}`;

        await db.query('DELETE FROM projects WHERE id = ?', [id]);
        await db.addAuditLog(req.session.user.username, 'DELETE_PROJECT', 'project', id, `Xóa dự án: ${title}`, ipAddress);
        logger.info('Project deleted', { id, title, user: req.session.user.username });

        res.redirect('/admin/projects?msg=Đã+xóa+dự+án+thành+công');
    } catch (err) {
        next(err);
    }
});

// 7. Admin Skills Management
router.get('/skills', async (req, res, next) => {
    try {
        const skills = await db.query('SELECT * FROM skills ORDER BY category, sort_order ASC');
        res.render('admin/skills_list', {
            title: 'Quản Lý Kỹ Năng | Portfolio System',
            skills,
            message: req.query.msg || null,
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
});

router.post('/skills/new', async (req, res, next) => {
    try {
        const { name, category, proficiency, icon_class, sort_order } = req.body;
        const ipAddress = req.ip || '127.0.0.1';

        const result = await db.query(
            'INSERT INTO skills (name, category, proficiency, icon_class, sort_order) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), category, parseInt(proficiency, 10), icon_class.trim() || 'fas fa-code', parseInt(sort_order || 0, 10)]
        );

        await db.addAuditLog(req.session.user.username, 'CREATE_SKILL', 'skill', result.insertId, `Thêm kỹ năng: ${name}`, ipAddress);
        res.redirect('/admin/skills?msg=Thêm+kỹ+năng+mới+thành+công');
    } catch (err) {
        next(err);
    }
});

router.post('/skills/:id/delete', async (req, res, next) => {
    try {
        const { id } = req.params;
        const ipAddress = req.ip || '127.0.0.1';

        await db.query('DELETE FROM skills WHERE id = ?', [id]);
        await db.addAuditLog(req.session.user.username, 'DELETE_SKILL', 'skill', id, `Xóa kỹ năng ID: ${id}`, ipAddress);

        res.redirect('/admin/skills?msg=Đã+xóa+kỹ+năng');
    } catch (err) {
        next(err);
    }
});

// 8. Admin Inquiries / Contacts Management
router.get('/contacts', async (req, res, next) => {
    try {
        const contacts = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.render('admin/contacts_list', {
            title: 'Quản Lý Tin Nhắn Liên Hệ | Portfolio System',
            contacts,
            message: req.query.msg || null,
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
});

router.post('/contacts/:id/toggle-read', async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE contacts SET is_read = 1 - is_read WHERE id = ?', [id]);
        res.redirect('/admin/contacts?msg=Đã+cập+nhật+trạng+thái+tin+nhắn');
    } catch (err) {
        next(err);
    }
});

router.post('/contacts/:id/delete', async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM contacts WHERE id = ?', [id]);
        await db.addAuditLog(req.session.user.username, 'DELETE_CONTACT', 'contact', id, `Xóa tin nhắn liên hệ ID ${id}`, req.ip);
        res.redirect('/admin/contacts?msg=Đã+xóa+tin+nhắn');
    } catch (err) {
        next(err);
    }
});

// 9. Admin Audit Logs
router.get('/audit', async (req, res, next) => {
    try {
        const filterAction = req.query.action || '';
        let sql = 'SELECT * FROM audit_logs';
        const params = [];

        if (filterAction) {
            sql += ' WHERE action = ?';
            params.push(filterAction);
        }

        sql += ' ORDER BY created_at DESC LIMIT 100';
        const logs = await db.query(sql, params);

        res.render('admin/audit_logs', {
            title: 'Nhật Ký Kiểm Toán Hệ Thống | Portfolio System',
            logs,
            filterAction,
            user: req.session.user
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
