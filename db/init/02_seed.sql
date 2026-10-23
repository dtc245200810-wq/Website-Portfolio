-- ========================================================
-- 02_seed.sql: Initial Seed Data for Website Portfolio
-- Author: To Vu Dat (DTC245200810 - CNTT K23I)
-- ========================================================

USE `portfolio_db`;

-- 1. Seed Admin User
-- Password: Admin@2026!Secure (Bcrypt hash: $2a$10$IPh70Ll9uOILASGWjfnL..xwc9nTvVGp4s3Sq9bGS8BzP4N7d7n3y)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`)
VALUES
(1, 'admin', 'dtc245200810@ictu.edu.vn', '$2a$10$IPh70Ll9uOILASGWjfnL..xwc9nTvVGp4s3Sq9bGS8BzP4N7d7n3y', 'Tô Vũ Đạt', 'admin')
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- 2. Seed Personal Profile
INSERT INTO `profile` (`id`, `full_name`, `student_id`, `class_name`, `university`, `headline`, `bio`, `email`, `phone`, `location`, `avatar_url`, `github_url`, `linkedin_url`, `resume_url`)
VALUES
(1, 
 'Tô Vũ Đạt', 
 'DTC245200810', 
 'CNTT K23I', 
 'Trường Đại học Công nghệ Thông tin & Truyền thông - ĐH Thái Nguyên (ICTU)', 
 'Fullstack Web Developer & DevOps Enthusiast', 
 'Xin chào! Em là Tô Vũ Đạt, sinh viên lớp CNTT K23I tại Trường Đại học Công nghệ Thông tin và Truyền thông Thái Nguyên. Em có niềm đam mê sâu sắc với phát triển phần mềm ứng dụng web hiện đại, kiến trúc microservices và quy trình triển khai, quản trị hệ thống bằng Docker, Nginx, Prometheus, Grafana và Loki. Mục tiêu của em là trở thành một kỹ sư phần mềm chuyên nghiệp, có khả năng xây dựng các hệ thống an toàn, hiệu năng cao và có tính sẵn sàng cao.', 
 'dtc245200810@ictu.edu.vn', 
 '0987 654 321', 
 'Thái Nguyên, Việt Nam', 
 '/images/avatar.png', 
 'https://github.com/dtc245200810-wq', 
 'https://linkedin.com/in/tovudat-ictu', 
 '/docs/CV_ToVuDat_DTC245200810.pdf')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 3. Seed Portfolio Projects
INSERT INTO `projects` (`id`, `title`, `slug`, `category`, `description`, `full_content`, `technologies`, `demo_url`, `github_url`, `image_url`, `featured`, `sort_order`)
VALUES
(1, 
 'Website Portfolio Cá Nhân & Quản Trị Nội Dung', 
 'website-portfolio-ca-nhan', 
 'DevOps & Fullstack Web', 
 'Website giới thiệu năng lực cá nhân, tích hợp phân hệ CMS quản trị nội dung an toàn với xác thực phiên, CSRF, rate limit và hệ thống giám sát toàn diện.', 
 'Đồ án kết thúc học phần Triển khai và Quản trị Hệ thống Phần mềm (Đề 13). Hệ thống sử dụng Node.js/Express, cơ sở dữ liệu MySQL 8.0, phpMyAdmin, đóng gói bằng Docker Compose, reverse proxy Nginx bảo vệ bằng HTTPS tự ký RSA 3072 bit, giám sát Prometheus v3 + Grafana v11 và quản lý log tập trung với Loki + Promtail.', 
 'Node.js, Express, MySQL 8.0, Docker, Nginx, Prometheus, Grafana, Loki', 
 'https://localhost:8443', 
 'https://github.com/dtc245200810-wq/Website-Portfolio', 
 '/images/project1.png', 
 1, 1),

(2, 
 'Hệ Thống Quản Lý Đặt Lịch Khám Bệnh Phòng Khám', 
 'he-thong-dat-lich-kham-benh', 
 'Fullstack Web', 
 'Nền tảng hỗ trợ bệnh nhân đặt lịch hẹn bác sĩ trực tuyến, quản lý hồ sơ bệnh án và lịch làm việc của phòng khám chuyên khoa.', 
 'Ứng dụng xây dựng với kiến trúc hướng dịch vụ, frontend React.js, backend RESTful API Node.js/Express, lưu trữ dữ liệu trong MySQL và phân quyền vai trò (Admin, Doctor, Patient). Tích hợp gửi email xác nhận và thông báo lịch hẹn tự động.', 
 'React.js, Node.js, Express, MySQL, TailwindCSS, JWT, Docker', 
 'https://demo-clinic.ictu.edu.vn', 
 'https://github.com/dtc245200810-wq/Clinic-Management', 
 '/images/project2.png', 
 1, 2),

(3, 
 'Hệ Thống Giám Sát & Điều Khiển Nhà Thông Minh IoT', 
 'he-thong-giam-sat-nha-thong-minh', 
 'IoT & Cloud Computing', 
 'Hệ thống thu thập dữ liệu nhiệt độ, độ ẩm, ánh sáng từ các cảm biến ESP32, truyền qua giao thức MQTT và hiển thị trên dashboard thời gian thực.', 
 'Đề tài ứng dụng trong môn học Điện toán đám mây và IoT. Dữ liệu cảm biến được truyền qua EMQX MQTT broker, xử lý bằng Python FastAPI, lưu trữ trong time-series database InfluxDB và trực quan hóa cảnh báo qua Grafana dashboard.', 
 'Python, FastAPI, MQTT, ESP32, InfluxDB, Grafana, Docker', 
 'https://iot.ictu.edu.vn', 
 'https://github.com/dtc245200810-wq/SmartHome-IoT', 
 1, 3),

(4, 
 'Nền Tảng Thương Mại Điện Tử Mini', 
 'nen-tang-thuong-mai-dien-tu-mini', 
 'E-Commerce Web', 
 'Cửa hàng trực tuyến giới thiệu sản phẩm công nghệ, giỏ hàng, đặt hàng và tích hợp cổng thanh toán trực tuyến bảo mật.', 
 'Dự án môn Phát triển ứng dụng Web. Hỗ trợ tìm kiếm, lọc danh mục sản phẩm, tính toán thuế và phí vận chuyển, quản lý đơn hàng cho chủ shop và theo dõi trạng thái giao hàng cho khách hàng.', 
 'Next.js, TypeScript, TailwindCSS, Node.js API, MySQL, Redis', 
 'https://shop-demo.ictu.edu.vn', 
 'https://github.com/dtc245200810-wq/Mini-Ecommerce', 
 0, 4),

(5, 
 'Cổng Thông Tin Tuyển Sinh & Tra Cứu Điểm Chuẩn', 
 'cong-thong-tin-tuyen-sinh', 
 'Web Portal', 
 'Trang web cung cấp thông tin đề án tuyển sinh, tra cứu điểm chuẩn qua các năm và tư vấn ngành học trực tuyến cho học sinh THPT.', 
 'Hệ thống tra cứu dữ liệu điểm thi với tốc độ phản hồi mili-giây nhờ tối ưu chỉ mục MySQL và caching dữ liệu tĩnh tại Nginx reverse proxy. Giao diện thân thiện trên cả điện thoại di động và máy tính bảng.', 
 'PHP, Laravel, MySQL, Nginx, Bootstrap 5, Redis Cache', 
 'https://tuyensinh.ictu.edu.vn', 
 'https://github.com/dtc245200810-wq/Admissions-Portal', 
 0, 5)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 4. Seed Technical Skills
INSERT INTO `skills` (`id`, `name`, `category`, `proficiency`, `icon_class`, `sort_order`)
VALUES
(1, 'HTML5, CSS3 & JavaScript (ES6+)', 'Frontend', 90, 'fab fa-html5', 1),
(2, 'React.js & TailwindCSS', 'Frontend', 85, 'fab fa-react', 2),
(3, 'Responsive Web & Glassmorphism UI', 'Frontend', 88, 'fas fa-palette', 3),
(4, 'Node.js & Express.js Framework', 'Backend', 88, 'fab fa-node-js', 4),
(5, 'RESTful API & Microservices Concept', 'Backend', 85, 'fas fa-network-wired', 5),
(6, 'Python & FastAPI / Automation Scripts', 'Backend', 80, 'fab fa-python', 6),
(7, 'Docker & Multi-Container Compose', 'DevOps & System', 92, 'fab fa-docker', 7),
(8, 'Nginx Reverse Proxy & SSL/TLS TLSv1.3', 'DevOps & System', 88, 'fas fa-server', 8),
(9, 'Prometheus & Grafana Observability', 'DevOps & System', 86, 'fas fa-chart-line', 9),
(10, 'Loki & Promtail Centralized Logging', 'DevOps & System', 84, 'fas fa-file-alt', 10),
(11, 'MySQL 8.0 & Query Optimization', 'Database', 90, 'fas fa-database', 11),
(12, 'phpMyAdmin & Database Administration', 'Database', 88, 'fas fa-tools', 12)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 5. Seed Experience & Education
INSERT INTO `experiences` (`id`, `title`, `organization`, `role_type`, `start_date`, `end_date`, `is_current`, `description`, `sort_order`)
VALUES
(1, 
 'Sinh viên chuyên ngành Công nghệ Thông tin', 
 'Trường Đại học Công nghệ Thông tin & Truyền thông - ĐHTN (ICTU)', 
 'Education', 
 '09/2023', 
 'Hiện tại', 
 1, 
 'Học tập tại lớp CNTT K23I, rèn luyện kiến thức nền tảng vững chắc về cấu trúc dữ liệu, giải thuật, mạng máy tính, cơ sở dữ liệu, an toàn hệ thống và công nghệ phần mềm.', 
 1),

(2, 
 'Đồ án học phần: Triển khai và Quản trị Hệ thống Phần mềm', 
 'Khoa Công nghệ Thông tin - ICTU (Giảng viên: Lê Khánh Dương)', 
 'Activity', 
 '08/2026', 
 '10/2026', 
 1, 
 'Nghiên cứu và triển khai Đề 13: Website Portfolio Cá Nhân tích hợp trang Admin CMS, quản trị MySQL qua phpMyAdmin, đóng gói Docker Compose, reverse proxy Nginx HTTPS tự ký, giám sát Prometheus/Grafana và thu thập log Loki/Promtail.', 
 2),

(3, 
 'Thực tập cơ sở: Xây dựng & Quản trị Hệ thống Ứng dụng', 
 'Trung tâm Phát triển Phần mềm & CNTT Thái Nguyên', 
 'Work', 
 '06/2026', 
 '08/2026', 
 0, 
 'Tham gia hỗ trợ đội ngũ kỹ thuật triển khai các ứng dụng web nội bộ trên hạ tầng Linux, cấu hình tên miền, thiết lập chứng chỉ SSL/TLS và viết tài liệu hướng dẫn vận hành hệ thống.', 
 3),

(4, 
 'Thành viên CLB Lập trình & An toàn Thông tin ICTU', 
 'Câu lạc bộ Tin học & An ninh mạng ICTU', 
 'Activity', 
 '10/2023', 
 'Hiện tại', 
 1, 
 'Tham gia sinh hoạt chuyên môn hàng tuần, chia sẻ kiến thức về lập trình web full-stack, thực hành lab Docker, Linux SysAdmin và tham gia các cuộc thi học thuật cấp trường.', 
 4)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 6. Seed Sample Contacts
INSERT INTO `contacts` (`id`, `sender_name`, `sender_email`, `subject`, `message`, `is_read`, `ip_address`)
VALUES
(1, 'Nguyễn Văn Minh', 'minh.nguyen@techcorp.vn', 'Trao đổi cơ hội thực tập Fullstack Developer', 'Chào bạn Đạt, mình ấn tượng với các dự án trên portfolio của bạn và muốn hẹn phỏng vấn thực tập vị trí Web/DevOps tại công ty.', 1, '127.0.0.1'),
(2, 'Trần Thị Mai', 'mai.tran@startup.io', 'Mời hợp tác phát triển dự án Website thương mại điện tử', 'Chào Đạt, bên mình đang tìm kiếm lập trình viên thiết kế website giới thiệu sản phẩm và cổng thanh toán, mong sớm nhận phản hồi từ bạn.', 0, '127.0.0.1')
ON DUPLICATE KEY UPDATE `sender_name` = VALUES(`sender_name`);

-- 7. Seed Initial Audit Logs
INSERT INTO `audit_logs` (`id`, `username`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`)
VALUES
(1, 'system', 'SYSTEM_INIT', 'database', 'portfolio_db', 'Khởi tạo lược đồ cơ sở dữ liệu và nạp dữ liệu mẫu thành công', '127.0.0.1'),
(2, 'admin', 'LOGIN_SUCCESS', 'user', '1', 'Quản trị viên đăng nhập hệ thống thành công qua HTTPS', '127.0.0.1'),
(3, 'admin', 'UPDATE_PROFILE', 'profile', '1', 'Cập nhật thông tin học vấn CNTT K23I và liên kết GitHub', '127.0.0.1')
ON DUPLICATE KEY UPDATE `action` = VALUES(`action`);
