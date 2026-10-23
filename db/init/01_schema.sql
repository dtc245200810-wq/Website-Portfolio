-- ========================================================
-- 01_schema.sql: Database Schema for Website Portfolio
-- Author: To Vu Dat (DTC245200810 - CNTT K23I)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `portfolio_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `portfolio_db`;

-- 1. Table users (Admin authentication)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'admin',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_username` (`username`),
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table profile (Personal Information & Hero/About section)
CREATE TABLE IF NOT EXISTS `profile` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(100) NOT NULL,
    `student_id` VARCHAR(20) NOT NULL DEFAULT 'DTC245200810',
    `class_name` VARCHAR(50) NOT NULL DEFAULT 'CNTT K23I',
    `university` VARCHAR(150) NOT NULL DEFAULT 'Trường Đại học CNTT & Truyền thông Thái Nguyên (ICTU)',
    `headline` VARCHAR(255) NOT NULL,
    `bio` TEXT NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) DEFAULT NULL,
    `location` VARCHAR(100) DEFAULT 'Thái Nguyên, Việt Nam',
    `avatar_url` VARCHAR(255) DEFAULT '/images/avatar.jpg',
    `github_url` VARCHAR(255) DEFAULT 'https://github.com/dtc245200810-wq',
    `linkedin_url` VARCHAR(255) DEFAULT 'https://linkedin.com/in/tovudat',
    `resume_url` VARCHAR(255) DEFAULT '/docs/CV_ToVuDat.pdf',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table projects (Portfolio Showcase & Detail)
CREATE TABLE IF NOT EXISTS `projects` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL UNIQUE,
    `category` VARCHAR(50) NOT NULL DEFAULT 'Fullstack Web',
    `description` VARCHAR(300) NOT NULL,
    `full_content` TEXT DEFAULT NULL,
    `technologies` VARCHAR(255) NOT NULL,
    `demo_url` VARCHAR(255) DEFAULT NULL,
    `github_url` VARCHAR(255) DEFAULT NULL,
    `image_url` VARCHAR(255) DEFAULT '/images/project-default.jpg',
    `featured` TINYINT(1) NOT NULL DEFAULT 1,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_slug` (`slug`),
    INDEX `idx_featured` (`featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table skills (Technical Skills grouped by category)
CREATE TABLE IF NOT EXISTS `skills` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL,
    `category` ENUM('Frontend', 'Backend', 'DevOps & System', 'Database') NOT NULL,
    `proficiency` INT NOT NULL DEFAULT 80,
    `icon_class` VARCHAR(50) DEFAULT 'fas fa-code',
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table experiences (Work Experience & Education History)
CREATE TABLE IF NOT EXISTS `experiences` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(150) NOT NULL,
    `organization` VARCHAR(150) NOT NULL,
    `role_type` ENUM('Education', 'Work', 'Activity') NOT NULL DEFAULT 'Education',
    `start_date` VARCHAR(30) NOT NULL,
    `end_date` VARCHAR(30) NOT NULL,
    `is_current` TINYINT(1) NOT NULL DEFAULT 0,
    `description` TEXT NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table contacts (Inquiries sent by visitors)
CREATE TABLE IF NOT EXISTS `contacts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sender_name` VARCHAR(100) NOT NULL,
    `sender_email` VARCHAR(100) NOT NULL,
    `subject` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table audit_logs (Security and admin operations tracking)
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(50) DEFAULT NULL,
    `details` TEXT DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_action` (`action`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table sessions (Express session store in MySQL)
CREATE TABLE IF NOT EXISTS `sessions` (
    `session_id` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
    `expires` INT(11) UNSIGNED NOT NULL,
    `data` MEDIUMTEXT COLLATE utf8mb4_bin,
    INDEX `idx_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
