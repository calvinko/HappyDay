-- HappyDay server: user login schema (MySQL / InnoDB)

CREATE TABLE IF NOT EXISTS users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)  NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  display_name   VARCHAR(100) NOT NULL,
  group_id       VARCHAR(50)  NOT NULL DEFAULT 'sj_senior',
  user_role      ENUM('user', 'groupadmin', 'appadmin') NOT NULL DEFAULT 'user',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at  TIMESTAMP    NULL,
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- For future use, currently list of groups hardcoded in the frontend (see src/App.tsx). This table is not used yet.
CREATE TABLE IF NOT EXISTS church_groups (
  name           VARCHAR(50)  UNIQUE NOT NULL,
  description    VARCHAR(255) NOT NULL DEFAULT '',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed the groups already hardcoded in src/App.tsx, so daily_content's FK below has
-- something to point at. Keep this in sync if that list changes.
INSERT INTO church_groups (name, description) VALUES
  ('sj_senior', 'SJ 長者'),
  ('sf_senior', 'SF 長者'),
  ('bra_senior', '巴西長者')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- One row of devotional content for a single day, assigned to exactly one
-- user OR one group (never both, never neither — see the CHECK constraint).
-- A group row applies to every member of that group. A user row lets one
-- person's day differ instead (e.g. a personalized plan or a make-up reading).
CREATE TABLE IF NOT EXISTS daily_content (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NULL,
  group_id       VARCHAR(50)  NULL,
  content_date   DATE         NOT NULL,
  passage        TEXT         NOT NULL,
  song           TEXT         NULL,
  song_url       VARCHAR(500) NULL,
  supplementary  TEXT         NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_daily_content_date (content_date),
  UNIQUE KEY uq_daily_content_user_date (user_id, content_date),
  UNIQUE KEY uq_daily_content_group_date (group_id, content_date),
  CONSTRAINT chk_daily_content_one_target CHECK (
    (user_id IS NULL) <> (group_id IS NULL)
  ),
  CONSTRAINT fk_daily_content_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_daily_content_group FOREIGN KEY (group_id)
    REFERENCES church_groups (name) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
