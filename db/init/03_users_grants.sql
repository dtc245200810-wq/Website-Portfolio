-- ========================================================
-- 03_users_grants.sql: Least Privilege Users & Access Control
-- Author: To Vu Dat (DTC245200810 - CNTT K23I)
-- ========================================================

-- 1. Create Application User with least privilege
-- The application only needs CRUD operations, never schema alterations (no CREATE, DROP, ALTER, GRANT)
CREATE USER IF NOT EXISTS 'portfolio_app'@'%' IDENTIFIED BY 'PortfolioApp@2026!Secure';
GRANT SELECT, INSERT, UPDATE, DELETE ON `portfolio_db`.* TO 'portfolio_app'@'%';

-- 2. Create Monitoring Exporter User for Prometheus mysqld_exporter
-- Least privilege for performance schema inspection only
CREATE USER IF NOT EXISTS 'mysqld_exporter'@'%' IDENTIFIED BY 'Exporter@2026!Secure' WITH MAX_USER_CONNECTIONS 3;
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'mysqld_exporter'@'%';
GRANT SELECT ON `performance_schema`.* TO 'mysqld_exporter'@'%';

-- 3. Flush privileges to ensure changes take effect immediately
FLUSH PRIVILEGES;
