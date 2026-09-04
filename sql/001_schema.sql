-- bigProject schema — MySQL 5.7+/8, utf8mb4, InnoDB
-- Compatible with cPanel shared hosting. Run via backend/install.php or mysql import.
-- PHP 8.1 + PDO, no framework required.

CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'نئون',
  image TEXT NOT NULL,
  portrait TINYINT(1) NOT NULL DEFAULT 0,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  tags JSON NULL,
  lat DOUBLE NULL,
  lng DOUBLE NULL,
  address VARCHAR(500) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_featured (featured),
  INDEX idx_sort (sort_order),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_likes (
  project_id VARCHAR(64) NOT NULL,
  visitor_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, visitor_id),
  INDEX idx_visitor (visitor_id),
  CONSTRAINT fk_likes_project FOREIGN KEY (project_id)
    REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_content (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` LONGTEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
  `key` VARCHAR(128) PRIMARY KEY,
  attempts INT NOT NULL DEFAULT 1,
  reset_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dedicated single-row table for the About Us section (one section, one table).
CREATE TABLE IF NOT EXISTS about_content (
  id TINYINT UNSIGNED PRIMARY KEY,
  eyebrow VARCHAR(255) NOT NULL DEFAULT '',
  headline1 VARCHAR(255) NOT NULL DEFAULT '',
  headline2 VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_about_single CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dedicated single-row table for the Contact section (one section, one table).
CREATE TABLE IF NOT EXISTS contact_content (
  id TINYINT UNSIGNED PRIMARY KEY,
  eyebrow VARCHAR(255) NOT NULL DEFAULT '',
  headline1 VARCHAR(255) NOT NULL DEFAULT '',
  headline2 VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  whatsapp VARCHAR(20) NOT NULL DEFAULT '',
  instagram TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_contact_single CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
