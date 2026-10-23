import os
import sys
import secrets
import string
import datetime

# Fix stdout encoding
sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("PORTFOLIO SYSTEM SETUP & CERTIFICATE GENERATION")
print("Topic 13: Website Portfolio / Personal Introduction")
print("Student: To Vu Dat (DTC245200810 - CNTT K23I)")
print("=" * 60)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ENV_FILE = os.path.join(BASE_DIR, '.env')
CERTS_DIR = os.path.join(BASE_DIR, 'certs')
os.makedirs(CERTS_DIR, exist_ok=True)

def generate_strong_password(length=24):
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(chars) for _ in range(length))

# 1. Setup .env file
if not os.path.exists(ENV_FILE):
    print("[1/2] Creating .env file with secure generated secrets...")
    root_pw = generate_strong_password()
    app_pw = generate_strong_password()
    exporter_pw = generate_strong_password()
    session_sec = generate_strong_password(48)
    grafana_pw = generate_strong_password()

    env_content = f"""# Auto-generated Production Secrets - Do NOT commit to Git
NODE_ENV=production
PORT=3000
SESSION_SECRET={session_sec}

# MySQL Database
MYSQL_ROOT_PASSWORD={root_pw}
MYSQL_DATABASE=portfolio_db
MYSQL_USER=portfolio_app
MYSQL_PASSWORD={app_pw}
MYSQL_HOST=mysql
MYSQL_PORT=3306

# MySQL Monitoring Exporter
MYSQL_EXPORTER_USER=mysqld_exporter
MYSQL_EXPORTER_PASSWORD={exporter_pw}

# phpMyAdmin
PMA_HOST=mysql
PMA_PORT=3306
PMA_USER=portfolio_app
PMA_PASSWORD={app_pw}

# Admin Account
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@2026!Secure
ADMIN_EMAIL=dtc245200810@ictu.edu.vn
ADMIN_FULL_NAME=To Vu Dat

# Grafana Admin
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD={grafana_pw}

# Host Ports
HOST_HTTP_PORT=8080
HOST_HTTPS_PORT=8443
HOST_PHPMYADMIN_PORT=8081
HOST_PROMETHEUS_PORT=9090
HOST_GRAFANA_PORT=3002
"""
    with open(ENV_FILE, 'w', encoding='utf-8') as f:
        f.write(env_content)
    print("✓ .env generated successfully.")
else:
    print("[1/2] .env file already exists. Preserving current secrets.")

# 2. Generate RSA 3072-bit Self-Signed Certificate
crt_path = os.path.join(CERTS_DIR, 'server.crt')
key_path = os.path.join(CERTS_DIR, 'server.key')

if not (os.path.exists(crt_path) and os.path.exists(key_path)):
    print("[2/2] Generating RSA 3072-bit self-signed TLS certificate with SAN...")
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import ipaddress

        key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=3072
        )

        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "VN"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Thai Nguyen"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Thai Nguyen City"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "ICTU - CNTT K23I"),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "To Vu Dat Portfolio System"),
            x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
        ])

        cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.datetime.now(datetime.timezone.utc))
            .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365))
            .add_extension(
                x509.SubjectAlternativeName([
                    x509.DNSName("localhost"),
                    x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
                ]),
                critical=False,
            )
            .sign(key, hashes.SHA256())
        )

        with open(key_path, "wb") as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            ))

        with open(crt_path, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))

        print(f"✓ RSA 3072-bit certificate and key generated successfully:")
        print(f"  Certificate: {crt_path}")
        print(f"  Private Key: {key_path}")

    except Exception as err:
        print(f"✗ Failed to generate certificate via python-cryptography: {err}")
        sys.exit(1)
else:
    print("[2/2] TLS Certificate and Key already exist in certs/ directory.")

print("\nSetup completed successfully! Ready for Docker Compose launch.")
