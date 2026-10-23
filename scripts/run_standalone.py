# -*- coding: utf-8 -*-
"""
Standalone Runner cho Website Portfolio & Admin CMS (Đề 13)
Cho phép chạy thử nghiệm và demo trực tiếp trên Windows khi chưa có Docker Desktop.
Sinh viên: Tô Vũ Đạt - DTC245200810 - Lớp CNTT K23I
"""

import os
import sys
import subprocess
import webbrowser
import time

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(ROOT_DIR, "app")
PORT = 8080

def check_node():
    try:
        res = subprocess.run(["node", "-v"], capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except Exception:
        return None

def main():
    print("=" * 70)
    print(" WEBSITE PORTFOLIO & ADMIN CMS - STANDALONE RUNNER (ĐỀ 13)")
    print(" Sinh viên: Tô Vũ Đạt | MSSV: DTC245200810 | Lớp: CNTT K23I")
    print(" GVHD: Thầy Lê Khánh Dương")
    print("=" * 70)
    
    node_ver = check_node()
    if not node_ver:
        print("[!] LỖI: Không tìm thấy Node.js trên máy tính.")
        print("    Vui lòng cài đặt Node.js từ https://nodejs.org/")
        sys.exit(1)
        
    print(f"[*] Node.js phát hiện: {node_ver}")
    print(f"[*] Thư mục ứng dụng: {APP_DIR}")
    print(f"[*] Cổng chạy cục bộ: {PORT}")
    
    # Kiểm tra node_modules
    nm_dir = os.path.join(APP_DIR, "node_modules")
    if not os.path.exists(nm_dir):
        print("[*] Đang cài đặt thư viện phụ thuộc (npm ci)...")
        subprocess.run(["npm", "ci", "--omit=dev"], cwd=APP_DIR, check=True)
        
    # Thiết lập biến môi trường chạy standalone
    env = os.environ.copy()
    env["PORT"] = str(PORT)
    env["NODE_ENV"] = "development"
    env["USE_MEMORY_SESSION"] = "true"
    env["SESSION_SECRET"] = "portfolio_standalone_secret_dat_2026"
    
    print("-" * 70)
    print(f"[*] ĐANG KHỞI ĐỘNG ỨNG DỤNG TẠI CỔNG {PORT}...")
    print(f"    - Trang chủ Portfolio : http://localhost:{PORT}/")
    print(f"    - Trang quản trị CMS : http://localhost:{PORT}/admin/login")
    print(f"    - Endpoint Healthcheck: http://localhost:{PORT}/health")
    print("    - Tài khoản Admin     : admin")
    print("    - Mật khẩu Admin      : Admin@Portfolio2026!")
    print("-" * 70)
    print("[*] Nhấn Ctrl+C để dừng hệ thống.")
    print("=" * 70)
    
    # Mở trình duyệt sau 2 giây
    def open_browser():
        time.sleep(2)
        try:
            webbrowser.open(f"http://localhost:{PORT}/")
        except Exception:
            pass
            
    import threading
    threading.Thread(target=open_browser, daemon=True).start()
    
    server_js = os.path.join(APP_DIR, "src", "server.js")
    try:
        proc = subprocess.run(["node", server_js], cwd=APP_DIR, env=env)
    except KeyboardInterrupt:
        print("\n[*] Đã dừng ứng dụng Standalone an toàn.")

if __name__ == "__main__":
    main()
