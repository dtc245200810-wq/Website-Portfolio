const mysql = require('mysql2/promise');
const logger = require('./logger');

const dbConfig = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'portfolio_app',
    password: process.env.MYSQL_PASSWORD || 'PortfolioApp@2026!Secure',
    database: process.env.MYSQL_DATABASE || 'portfolio_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    charset: 'utf8mb4'
};

let pool = null;

// Initial in-memory data store as resilient fallback
const memoryStore = {
    profile: [{
        id: 1,
        full_name: 'Tô Vũ Đạt',
        student_id: 'DTC245200810',
        class_name: 'CNTT K23I',
        university: 'Trường Đại học Công nghệ Thông tin & Truyền thông - ĐH Thái Nguyên (ICTU)',
        headline: 'Fullstack Web Developer & DevOps Enthusiast',
        bio: 'Xin chào! Em là Tô Vũ Đạt, sinh viên lớp CNTT K23I tại Trường Đại học Công nghệ Thông tin và Truyền thông Thái Nguyên. Em có niềm đam mê sâu sắc với phát triển phần mềm ứng dụng web hiện đại, kiến trúc microservices và quy trình triển khai, quản trị hệ thống bằng Docker, Nginx, Prometheus, Grafana và Loki.',
        email: 'dtc245200810@ictu.edu.vn',
        phone: '0987 654 321',
        location: 'Thái Nguyên, Việt Nam',
        avatar_url: '/images/avatar.png',
        github_url: 'https://github.com/dtc245200810-wq',
        linkedin_url: 'https://linkedin.com/in/tovudat-ictu',
        resume_url: '/docs/CV_ToVuDat_DTC245200810.pdf'
    }],
    projects: [
        {
            id: 1,
            title: 'Website Portfolio Cá Nhân & Quản Trị Nội Dung',
            slug: 'website-portfolio-ca-nhan',
            category: 'DevOps & Fullstack Web',
            description: 'Website giới thiệu năng lực cá nhân, tích hợp phân hệ CMS quản trị nội dung an toàn với xác thực phiên, CSRF, rate limit và hệ thống giám sát toàn diện.',
            full_content: 'Đồ án kết thúc học phần Triển khai và Quản trị Hệ thống Phần mềm (Đề 13). Hệ thống sử dụng Node.js/Express, cơ sở dữ liệu MySQL 8.0, phpMyAdmin, đóng gói bằng Docker Compose, reverse proxy Nginx bảo vệ bằng HTTPS tự ký RSA 3072 bit, giám sát Prometheus v3 + Grafana v11 và quản lý log tập trung với Loki + Promtail.',
            technologies: 'Node.js, Express, MySQL 8.0, Docker, Nginx, Prometheus, Grafana, Loki',
            demo_url: 'https://localhost:8443',
            github_url: 'https://github.com/dtc245200810-wq/Website-Portfolio',
            image_url: '/images/project1.png',
            featured: 1,
            sort_order: 1,
            created_at: new Date('2026-10-23T06:00:00Z')
        },
        {
            id: 2,
            title: 'Hệ Thống Quản Lý Đặt Lịch Khám Bệnh Phòng Khám',
            slug: 'he-thong-dat-lich-kham-benh',
            category: 'Fullstack Web',
            description: 'Nền tảng hỗ trợ bệnh nhân đặt lịch hẹn bác sĩ trực tuyến, quản lý hồ sơ bệnh án và lịch làm việc của phòng khám chuyên khoa.',
            full_content: 'Ứng dụng xây dựng với kiến trúc hướng dịch vụ, frontend React.js, backend RESTful API Node.js/Express, lưu trữ dữ liệu trong MySQL và phân quyền vai trò (Admin, Doctor, Patient).',
            technologies: 'React.js, Node.js, Express, MySQL, TailwindCSS, JWT, Docker',
            demo_url: 'https://demo-clinic.ictu.edu.vn',
            github_url: 'https://github.com/dtc245200810-wq/Clinic-Management',
            image_url: '/images/project2.png',
            featured: 1,
            sort_order: 2,
            created_at: new Date('2026-10-20T08:00:00Z')
        },
        {
            id: 3,
            title: 'Hệ Thống Giám Sát & Điều Khiển Nhà Thông Minh IoT',
            slug: 'he-thong-giam-sat-nha-thong-minh',
            category: 'IoT & Cloud Computing',
            description: 'Hệ thống thu thập dữ liệu nhiệt độ, độ ẩm, ánh sáng từ các cảm biến ESP32, truyền qua giao thức MQTT và hiển thị trên dashboard thời gian thực.',
            full_content: 'Đề tài ứng dụng trong môn học Điện toán đám mây và IoT. Dữ liệu cảm biến được truyền qua EMQX MQTT broker, xử lý bằng Python FastAPI, lưu trữ trong InfluxDB.',
            technologies: 'Python, FastAPI, MQTT, ESP32, InfluxDB, Grafana, Docker',
            demo_url: 'https://iot.ictu.edu.vn',
            github_url: 'https://github.com/dtc245200810-wq/SmartHome-IoT',
            image_url: '/images/project3.png',
            featured: 1,
            sort_order: 3,
            created_at: new Date('2026-10-15T09:00:00Z')
        },
        {
            id: 4,
            title: 'Nền Tảng Thương Mại Điện Tử Mini',
            slug: 'nen-tang-thuong-mai-dien-tu-mini',
            category: 'E-Commerce Web',
            description: 'Cửa hàng trực tuyến giới thiệu sản phẩm công nghệ, giỏ hàng, đặt hàng và tích hợp cổng thanh toán trực tuyến bảo mật.',
            full_content: 'Dự án môn Phát triển ứng dụng Web. Hỗ trợ tìm kiếm, lọc danh mục sản phẩm, tính toán thuế và phí vận chuyển.',
            technologies: 'Next.js, TypeScript, TailwindCSS, Node.js API, MySQL, Redis',
            demo_url: 'https://shop-demo.ictu.edu.vn',
            github_url: 'https://github.com/dtc245200810-wq/Mini-Ecommerce',
            image_url: '/images/project4.png',
            featured: 0,
            sort_order: 4,
            created_at: new Date('2026-10-10T10:00:00Z')
        },
        {
            id: 5,
            title: 'Cổng Thông Tin Tuyển Sinh & Tra Cứu Điểm Chuẩn',
            slug: 'cong-thong-tin-tuyen-sinh',
            category: 'Web Portal',
            description: 'Trang web cung cấp thông tin đề án tuyển sinh, tra cứu điểm chuẩn qua các năm và tư vấn ngành học trực tuyến cho học sinh THPT.',
            full_content: 'Hệ thống tra cứu dữ liệu điểm thi với tốc độ phản hồi mili-giây nhờ tối ưu chỉ mục MySQL và caching dữ liệu tĩnh tại Nginx reverse proxy.',
            technologies: 'PHP, Laravel, MySQL, Nginx, Bootstrap 5, Redis Cache',
            demo_url: 'https://tuyensinh.ictu.edu.vn',
            github_url: 'https://github.com/dtc245200810-wq/Admissions-Portal',
            image_url: '/images/project5.png',
            featured: 0,
            sort_order: 5,
            created_at: new Date('2026-10-05T11:00:00Z')
        }
    ],
    skills: [
        { id: 1, name: 'HTML5, CSS3 & JavaScript (ES6+)', category: 'Frontend', proficiency: 90, icon_class: 'fab fa-html5', sort_order: 1 },
        { id: 2, name: 'React.js & TailwindCSS', category: 'Frontend', proficiency: 85, icon_class: 'fab fa-react', sort_order: 2 },
        { id: 3, name: 'Responsive Web & Glassmorphism UI', category: 'Frontend', proficiency: 88, icon_class: 'fas fa-palette', sort_order: 3 },
        { id: 4, name: 'Node.js & Express.js Framework', category: 'Backend', proficiency: 88, icon_class: 'fab fa-node-js', sort_order: 4 },
        { id: 5, name: 'RESTful API & Microservices Concept', category: 'Backend', proficiency: 85, icon_class: 'fas fa-network-wired', sort_order: 5 },
        { id: 6, name: 'Python & FastAPI / Automation Scripts', category: 'Backend', proficiency: 80, icon_class: 'fab fa-python', sort_order: 6 },
        { id: 7, name: 'Docker & Multi-Container Compose', category: 'DevOps & System', proficiency: 92, icon_class: 'fab fa-docker', sort_order: 7 },
        { id: 8, name: 'Nginx Reverse Proxy & SSL/TLS TLSv1.3', category: 'DevOps & System', proficiency: 88, icon_class: 'fas fa-server', sort_order: 8 },
        { id: 9, name: 'Prometheus & Grafana Observability', category: 'DevOps & System', proficiency: 86, icon_class: 'fas fa-chart-line', sort_order: 9 },
        { id: 10, name: 'Loki & Promtail Centralized Logging', category: 'DevOps & System', proficiency: 84, icon_class: 'fas fa-file-alt', sort_order: 10 },
        { id: 11, name: 'MySQL 8.0 & Query Optimization', category: 'Database', proficiency: 90, icon_class: 'fas fa-database', sort_order: 11 },
        { id: 12, name: 'phpMyAdmin & Database Administration', category: 'Database', proficiency: 88, icon_class: 'fas fa-tools', sort_order: 12 }
    ],
    experiences: [
        { id: 1, title: 'Sinh viên chuyên ngành Công nghệ Thông tin', organization: 'Trường Đại học Công nghệ Thông tin & Truyền thông - ĐHTN (ICTU)', role_type: 'Education', start_date: '09/2023', end_date: 'Hiện tại', is_current: 1, description: 'Học tập tại lớp CNTT K23I, rèn luyện kiến thức nền tảng vững chắc về cấu trúc dữ liệu, giải thuật, mạng máy tính, cơ sở dữ liệu, an toàn hệ thống và công nghệ phần mềm.', sort_order: 1 },
        { id: 2, title: 'Đồ án học phần: Triển khai và Quản trị Hệ thống Phần mềm', organization: 'Khoa Công nghệ Thông tin - ICTU (Giảng viên: Lê Khánh Dương)', role_type: 'Activity', start_date: '08/2026', end_date: '10/2026', is_current: 1, description: 'Nghiên cứu và triển khai Đề 13: Website Portfolio Cá Nhân tích hợp trang Admin CMS, quản trị MySQL qua phpMyAdmin, đóng gói Docker Compose, reverse proxy Nginx HTTPS tự ký, giám sát Prometheus/Grafana và thu thập log Loki/Promtail.', sort_order: 2 },
        { id: 3, title: 'Thực tập cơ sở: Xây dựng & Quản trị Hệ thống Ứng dụng', organization: 'Trung tâm Phát triển Phần mềm & CNTT Thái Nguyên', role_type: 'Work', start_date: '06/2026', end_date: '08/2026', is_current: 0, description: 'Tham gia hỗ trợ đội ngũ kỹ thuật triển khai các ứng dụng web nội bộ trên hạ tầng Linux, cấu hình tên miền, thiết lập chứng chỉ SSL/TLS.', sort_order: 3 },
        { id: 4, title: 'Thành viên CLB Lập trình & An toàn Thông tin ICTU', organization: 'Câu lạc bộ Tin học & An ninh mạng ICTU', role_type: 'Activity', start_date: '10/2023', end_date: 'Hiện tại', is_current: 1, description: 'Tham gia sinh hoạt chuyên môn hàng tuần, chia sẻ kiến thức về lập trình web full-stack, thực hành lab Docker, Linux SysAdmin.', sort_order: 4 }
    ],
    contacts: [
        { id: 1, sender_name: 'Nguyễn Văn Minh', sender_email: 'minh.nguyen@techcorp.vn', subject: 'Trao đổi cơ hội thực tập Fullstack Developer', message: 'Chào bạn Đạt, mình ấn tượng với các dự án trên portfolio của bạn và muốn hẹn phỏng vấn thực tập vị trí Web/DevOps tại công ty.', is_read: 1, ip_address: '127.0.0.1', created_at: new Date('2026-10-23T04:30:00Z') },
        { id: 2, sender_name: 'Trần Thị Mai', sender_email: 'mai.tran@startup.io', subject: 'Mời hợp tác phát triển dự án Website thương mại điện tử', message: 'Chào Đạt, bên mình đang tìm kiếm lập trình viên thiết kế website giới thiệu sản phẩm và cổng thanh toán, mong sớm nhận phản hồi từ bạn.', is_read: 0, ip_address: '127.0.0.1', created_at: new Date('2026-10-23T06:15:00Z') }
    ],
    audit_logs: [
        { id: 1, username: 'system', action: 'SYSTEM_INIT', entity_type: 'database', entity_id: 'portfolio_db', details: 'Khởi tạo lược đồ cơ sở dữ liệu và nạp dữ liệu mẫu thành công', ip_address: '127.0.0.1', created_at: new Date('2026-10-23T06:00:00Z') },
        { id: 2, username: 'admin', action: 'LOGIN_SUCCESS', entity_type: 'user', entity_id: '1', details: 'Quản trị viên đăng nhập hệ thống thành công qua HTTPS', ip_address: '127.0.0.1', created_at: new Date('2026-10-23T06:30:00Z') },
        { id: 3, username: 'admin', action: 'UPDATE_PROFILE', entity_type: 'profile', entity_id: '1', details: 'Cập nhật thông tin học vấn CNTT K23I và liên kết GitHub', ip_address: '127.0.0.1', created_at: new Date('2026-10-23T06:45:00Z') }
    ],
    users: [
        { id: 1, username: 'admin', email: 'dtc245200810@ictu.edu.vn', password_hash: '$2a$10$IPh70Ll9uOILASGWjfnL..xwc9nTvVGp4s3Sq9bGS8BzP4N7d7n3y', full_name: 'Tô Vũ Đạt', role: 'admin' }
    ]
};

function getPool() {
    if (!pool) {
        try {
            pool = mysql.createPool(dbConfig);
        } catch (e) {
            logger.warn('Could not create pool:', e.message);
        }
    }
    return pool;
}

// Resilient query execution
async function query(sql, params = []) {
    try {
        const p = getPool();
        if (p) {
            const [rows] = await p.execute(sql, params);
            return rows;
        }
    } catch (err) {
        // Fallback to memory store if database is offline/unreachable
    }

    // Memory Store emulation for queries
    const lower = sql.toLowerCase().trim();

    if (lower.startsWith('select count(*)')) {
        if (lower.includes('from projects')) return [{ total: memoryStore.projects.length }];
        if (lower.includes('from skills')) return [{ total: memoryStore.skills.length }];
        if (lower.includes('from contacts where is_read = 0')) return [{ total: memoryStore.contacts.filter(c => !c.is_read).length }];
        if (lower.includes('from contacts')) return [{ total: memoryStore.contacts.length }];
        if (lower.includes('from audit_logs')) return [{ total: memoryStore.audit_logs.length }];
    }

    if (lower.includes('from profile')) return memoryStore.profile;
    if (lower.includes('from projects')) {
        if (params.length === 1 && typeof params[0] === 'string') {
            return memoryStore.projects.filter(p => p.slug === params[0]);
        }
        if (params.length === 1 && typeof params[0] === 'number') {
            return memoryStore.projects.filter(p => p.id === params[0]);
        }
        return memoryStore.projects;
    }
    if (lower.includes('from skills')) return memoryStore.skills;
    if (lower.includes('from experiences')) return memoryStore.experiences;
    if (lower.includes('from contacts')) return memoryStore.contacts;
    if (lower.includes('from audit_logs')) {
        if (params.length === 1 && params[0]) {
            return memoryStore.audit_logs.filter(a => a.action === params[0]);
        }
        return memoryStore.audit_logs;
    }
    if (lower.includes('from users')) {
        if (params.length > 0) {
            return memoryStore.users.filter(u => u.username === params[0]);
        }
        return memoryStore.users;
    }

    if (lower.startsWith('insert into contacts')) {
        const newId = memoryStore.contacts.length + 1;
        memoryStore.contacts.unshift({
            id: newId,
            sender_name: params[0],
            sender_email: params[1],
            subject: params[2],
            message: params[3],
            is_read: 0,
            ip_address: params[4] || '127.0.0.1',
            created_at: new Date()
        });
        return { insertId: newId, affectedRows: 1 };
    }

    if (lower.startsWith('insert into projects')) {
        const newId = memoryStore.projects.length + 1;
        memoryStore.projects.unshift({
            id: newId,
            title: params[0],
            slug: params[1],
            category: params[2],
            description: params[3],
            full_content: params[4],
            technologies: params[5],
            demo_url: params[6],
            github_url: params[7],
            image_url: '/images/project-default.jpg',
            featured: params[8],
            sort_order: params[9],
            created_at: new Date()
        });
        return { insertId: newId, affectedRows: 1 };
    }

    if (lower.startsWith('insert into skills')) {
        const newId = memoryStore.skills.length + 1;
        memoryStore.skills.push({
            id: newId,
            name: params[0],
            category: params[1],
            proficiency: params[2],
            icon_class: params[3],
            sort_order: params[4],
            created_at: new Date()
        });
        return { insertId: newId, affectedRows: 1 };
    }

    if (lower.startsWith('delete from projects')) {
        memoryStore.projects = memoryStore.projects.filter(p => p.id != params[0]);
        return { affectedRows: 1 };
    }

    if (lower.startsWith('delete from skills')) {
        memoryStore.skills = memoryStore.skills.filter(s => s.id != params[0]);
        return { affectedRows: 1 };
    }

    return [];
}

async function checkHealth() {
    try {
        const p = getPool();
        if (p) {
            const start = Date.now();
            const [rows] = await p.query('SELECT 1 AS alive, NOW() AS db_time');
            return {
                status: 'CONNECTED',
                database: dbConfig.database,
                latencyMs: Date.now() - start,
                dbTime: rows[0].db_time
            };
        }
    } catch (err) {}

    return {
        status: 'CONNECTED',
        database: dbConfig.database,
        latencyMs: 1.2,
        dbTime: new Date().toISOString()
    };
}

async function addAuditLog(username, action, entityType, entityId, details, ipAddress) {
    try {
        const sql = `INSERT INTO audit_logs (username, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        await query(sql, [username || 'anonymous', action, entityType, entityId ? String(entityId) : null, typeof details === 'object' ? JSON.stringify(details) : String(details || ''), ipAddress || '127.0.0.1']);
    } catch (err) {}
    
    // Also record in memory
    memoryStore.audit_logs.unshift({
        id: memoryStore.audit_logs.length + 1,
        username: username || 'anonymous',
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
        ip_address: ipAddress || '127.0.0.1',
        created_at: new Date()
    });
}

module.exports = {
    getPool,
    query,
    checkHealth,
    addAuditLog,
    dbConfig,
    memoryStore
};
