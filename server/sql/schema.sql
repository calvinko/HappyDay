-- HappyDay server: user login schema (MySQL / InnoDB)

CREATE TABLE IF NOT EXISTS users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)  NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  display_name   VARCHAR(100) NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at  TIMESTAMP    NULL,
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
