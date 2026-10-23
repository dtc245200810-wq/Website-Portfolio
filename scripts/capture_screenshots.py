import subprocess
import time
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
EVIDENCE_DIR = os.path.join(BASE_DIR, 'docs', 'evidence')
os.makedirs(EVIDENCE_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

print(f"[*] Using browser: {CHROME_PATH}")

# 1. Start Node.js server
node_proc = subprocess.Popen(
    ["node", "src/server.js"],
    cwd=os.path.join(BASE_DIR, 'app'),
    env=dict(os.environ, PORT="3000", NODE_ENV="production")
)

print("[*] Started Node.js server (PID: {})".format(node_proc.pid))
time.sleep(3)

def capture(url, out_name, width=1280, height=850):
    out_path = os.path.join(EVIDENCE_DIR, out_name)
    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        f"--window-size={width},{height}",
        f"--screenshot={out_path}",
        "--hide-scrollbars",
        url
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(out_path):
        size = os.path.getsize(out_path)
        print(f"✓ Captured: {out_name} ({size:,} bytes)")
    else:
        print(f"✗ Failed to capture: {out_name}")

try:
    print("\n--- Capturing Web & Admin Screens ---")
    capture("http://localhost:3000/", "fig2_3_portfolio_home.png", 1366, 850)
    capture("http://localhost:3000/#projects", "fig2_4_projects_skills.png", 1366, 850)
    capture("http://localhost:3000/project/website-portfolio-ca-nhan", "fig2_5_project_detail.png", 1366, 850)
    capture("http://localhost:3000/admin/login", "fig2_6_admin_login.png", 1280, 800)
    capture("http://localhost:3000/health", "api_health_response.png", 1000, 600)
finally:
    node_proc.terminate()
    try:
        node_proc.wait(timeout=3)
    except:
        node_proc.kill()
    print("[*] Node.js server terminated.")
