# ĐỒ ÁN HỌC PHẦN: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM

## ĐỀ 13: WEBSITE PORTFOLIO / GIỚI THIỆU CÁ NHÂN & TRANG ADMIN QUẢN LÝ NỘI DUNG

- **Sinh viên thực hiện:** Tô Vũ Đạt
- **Mã sinh viên:** DTC245200810
- **Lớp:** CNTT K23I
- **Khoa:** Công nghệ Thông tin
- **Trường:** Đại học Công nghệ Thông tin & Truyền thông - Đại học Thái Nguyên (ICTU)
- **Giảng viên hướng dẫn:** ThS. Lê Khánh Dương
- **Repository GitHub:** [https://github.com/dtc245200810-wq/Website-Portfolio](https://github.com/dtc245200810-wq/Website-Portfolio)

---

## 1. TỔNG QUAN HỆ THỐNG

Hệ thống Website Portfolio cá nhân là ứng dụng web hiện đại giới thiệu năng lực chuyên môn, quá trình học tập và danh mục dự án phần mềm của sinh viên Tô Vũ Đạt. Ứng dụng tích hợp phân hệ CMS quản trị nội dung an toàn (`/admin`), kết nối trực tiếp cơ sở dữ liệu **MySQL 8.0**, quản trị qua **phpMyAdmin**, tiếp nhận lưu lượng qua reverse proxy **Nginx HTTPS**, giám sát tài nguyên qua **Prometheus v3 + Grafana v11** và quản lý nhật ký tập trung với **Loki + Promtail**.

### Các dịch vụ thành phần:

| Dịch vụ | Nền tảng / Docker Image | Cổng Host (127.0.0.1) | Vai trò trong hệ thống |
| :--- | :--- | :--- | :--- |
| **app** | Node 22 Alpine (`portfolio-app:latest`) | Không publish (nội bộ :3000) | Ứng dụng Portfolio & Admin CMS, xác thực Bcrypt, CSRF, metrics |
| **mysql** | `mysql:8.0` | Không publish (nội bộ :3306) | Lưu trữ 8 bảng dữ liệu nghiệp vụ và phiên đăng nhập |
| **phpmyadmin** | `phpmyadmin/phpmyadmin:latest` | `127.0.0.1:8081` | Giao diện quản trị cơ sở dữ liệu MySQL trực quan |
| **nginx** | `nginx:1.27-alpine` | `127.0.0.1:8080`, `127.0.0.1:8443` | Reverse proxy, HTTPS TLS 1.2/1.3 RSA 3072 bit, security headers |
| **prometheus** | `prom/prometheus:v3.2.1` | `127.0.0.1:9090` | Thu thập và lưu trữ metrics chuỗi thời gian (time-series) |
| **cadvisor** | `ghcr.io/google/cadvisor:0.55.1` | Không publish (nội bộ :8080) | Thu thập metrics CPU, RAM, mạng của các container |
| **nginx-exporter** | `nginx/nginx-prometheus-exporter:1.4.1` | Không publish (nội bộ :9113) | Thu thập chỉ số lưu lượng và kết nối Nginx stub_status |
| **mysqld-exporter** | `prom/mysqld-exporter:v0.16.0` | Không publish (nội bộ :9104) | Thu thập chỉ số hiệu năng và truy vấn MySQL |
| **grafana** | `grafana/grafana:11.5.0` | `127.0.0.1:3002` | Trực quan hóa Dashboard tài nguyên container, web và database |
| **loki** | `grafana/loki:3.4.2` | Không publish (nội bộ :3100) | Lưu trữ và lập chỉ mục nhật ký tập trung |
| **promtail** | `grafana/promtail:3.4.2` | Không publish (nội bộ :9080) | Thu gom log JSON từ named volumes của Nginx và App |
| **init-logs** | `busybox:1.37.0` | Không nối mạng | Khởi tạo thư mục log và phân quyền UID (Exited 0) |

---

## 2. HƯỚNG DẪN TÁI LẬP VÀ KHỞI CHẠY (QUICKSTART)

### Yêu cầu tiên quyết:
- Hệ điều hành: Windows 10/11, Linux (Ubuntu/Debian) hoặc macOS.
- Đã cài đặt **Git**, **Python 3.10+** và **Docker Desktop / Docker Compose v2**.

### Bước 1: Clone Repository
```bash
git clone git@github.com:dtc245200810-wq/Website-Portfolio.git
cd Website-Portfolio
```

### Bước 2: Tự động khởi tạo Biến môi trường và Chứng chỉ TLS
Chạy kịch bản tự động hóa để sinh file `.env` với các mật khẩu ngẫu nhiên an toàn và cặp chứng chỉ tự ký RSA 3072 bit trong thư mục `certs/`:
```bash
python scripts/setup.py
```

### Bước 3: Khởi chạy toàn bộ hệ thống bằng Docker Compose
```bash
# Khởi chạy đồng bộ 3 file compose (Core + Monitoring + Logging)
docker compose -f compose.yaml -f compose.monitoring.yaml -f compose.logging.yaml up -d --build

# Kiểm tra trạng thái các container đang chạy
docker compose -f compose.yaml -f compose.monitoring.yaml -f compose.logging.yaml ps
```

---

## 3. DANH SÁCH URL TRUY CẬP VÀ THÔNG TIN ĐĂNG NHẬP

| Dịch vụ | Địa chỉ URL | Tài khoản đăng nhập mặc định |
| :--- | :--- | :--- |
| **Website Portfolio** | `https://127.0.0.1:8443/` | Khách truy cập công khai |
| **Admin CMS Panel** | `https://127.0.0.1:8443/admin/login` | User: `admin` &bull; Password: `Admin@2026!Secure` |
| **Endpoint Healthcheck** | `https://127.0.0.1:8443/health` | Không yêu cầu xác thực (JSON response) |
| **Prometheus Metrics** | `https://127.0.0.1:8443/metrics` | Endpoint nội bộ trỏ tới App metrics |
| **Quản trị phpMyAdmin** | `http://127.0.0.1:8081/` | User: `portfolio_app` &bull; Password xem trong `.env` (`MYSQL_PASSWORD`) |
| **Prometheus Web UI** | `http://127.0.0.1:9090/targets` | Xem 5 mục tiêu giám sát (Targets UP) |
| **Grafana Dashboard** | `http://127.0.0.1:3002/` | User: `admin` &bull; Password xem trong `.env` (`GF_SECURITY_ADMIN_PASSWORD`) |

> **Lưu ý bảo mật:** Mật khẩu chi tiết của database root, application user, exporter và Grafana được lưu trữ cục bộ trong file `.env` (được loại trừ khỏi Git theo quy chuẩn an toàn).

---

## 4. BỘ KỊCH BẢN KIỂM THỬ VÀ VẬN HÀNH TỰ ĐỘNG

Trong thư mục `scripts/`, dự án cung cấp đầy đủ các công cụ kiểm chứng thực nghiệm:

```bash
# 1. Chạy bộ 15 ca kiểm thử tích hợp (HTTP 301, HTTPS, Headers, CSRF, Login, CRUD, Metrics, Health)
python scripts/smoke_test.py

# 2. Kiểm chứng 8 biện pháp Hardening bảo mật container và cơ sở dữ liệu
python scripts/verify_hardening.py

# 3. Thực hiện sao lưu toàn bộ cấu trúc và dữ liệu MySQL
python scripts/backup.py

# 4. Phục hồi thử nghiệm vào database độc lập (portfolio_restore_test) và đối chiếu số bản ghi
python scripts/restore_test.py
```

Kết quả kiểm thử được lưu trữ minh bạch dưới dạng JSON trong thư mục `docs/evidence/`.

---

## 5. TRUY VẤN NHẬT KÝ LOGQL (LOKI + GRAFANA EXPLORE)

Dự án thiết lập 3 truy vấn LogQL phục vụ phân tích nhật ký thực tế:

1. **Xem toàn bộ access log Nginx:**
   ```logql
   {job="nginx"}
   ```

2. **Lọc các request phát sinh lỗi HTTP (status >= 400):**
   ```logql
   {job="nginx"} | json | status >= 400
   ```

3. **Tìm các sự kiện đăng nhập thất bại của ứng dụng (login_failed):**
   ```logql
   {job="app"} | json | event="login_failed"
   ```

---

## 6. CÁC BIỆN PHÁP HARDENING ĐÃ ÁP DỤNG

1. **Tiến trình Non-Root:** Container ứng dụng thực thi dưới quyền `USER node` (UID 1000, GID 1000); Nginx chạy UID 101; Promtail/Loki chạy UID 10001.
2. **Read-Only Root Filesystem:** Container app bật `read_only: true`; thư mục `/tmp` gắn qua `tmpfs` (`size=64m, noexec, nosuid`).
3. **Thu hồi Linux Capabilities:** Thiết lập `cap_drop: [ALL]` và `security_opt: [no-new-privileges:true]`.
4. **Cô lập mạng Database:** Mạng `portfolio_database_network` được đánh dấu `internal: true`, MySQL không mở cổng 3306 ra máy chủ host.
5. **Localhost Binding:** Tất cả cổng công bố (8080, 8443, 8081, 9090, 3002) đều bind chặt vào `127.0.0.1`.
6. **Least Privilege MySQL:** Tài khoản `portfolio_app` chỉ được cấp quyền `SELECT, INSERT, UPDATE, DELETE`; tài khoản `mysqld_exporter` chỉ có quyền read-only trên `performance_schema`.
7. **Bảo vệ Secrets:** Toàn bộ mật khẩu và khóa phiên lưu trữ trong `.env` cục bộ; `.gitignore` chặn `.env`, `certs/*.key` và `backups/*.sql`.
8. **Bảo mật ứng dụng Web:** Băm mật khẩu bằng Bcrypt (cost 10), xác thực CSRF token cho mọi mutation, rate limit chống Brute-Force, cookie flags `Secure, HttpOnly, SameSite=Lax` và Nginx Security Headers (`nosniff, DENY, HSTS, CSP`).

---

## 7. LỊCH SỬ COMMIT KỸ THUẬT

Lịch sử Git được tổ chức theo đúng quy chuẩn 3 mốc kỹ thuật của đề bài:
- **Commit 1:** `feat(core): ung dung Portfolio, MySQL 8.0, phpMyAdmin, Nginx reverse proxy va hardening co ban`
- **Commit 2:** `feat(monitoring): Prometheus v3, Grafana v11, cAdvisor, Nginx va MySQL exporters`
- **Commit 3:** `feat(logging): Loki v3, Promtail, thu thap JSON logs va cau hinh 3 truy van LogQL`
- **Commit bổ sung:** `docs(evidence): them bo kich ban kiem thu, backup restore, minh chung va bao cao nghiem thu`
