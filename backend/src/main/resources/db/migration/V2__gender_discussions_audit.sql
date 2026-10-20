-- Permanent gender selection (set once by the user; NULL only until they choose) and gender-separated discussions.
ALTER TABLE users
  ADD COLUMN gender VARCHAR(10) NULL AFTER role,
  ADD CONSTRAINT chk_users_gender CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE'));
CREATE INDEX idx_users_gender ON users (gender);

CREATE TABLE discussion_rooms (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  gender VARCHAR(10) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT chk_room_gender CHECK (gender IN ('MALE', 'FEMALE')),
  INDEX idx_rooms_gender (gender, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE discussion_posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  parent_id BIGINT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'VISIBLE',
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_post_room FOREIGN KEY (room_id) REFERENCES discussion_rooms(id),
  CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_post_parent FOREIGN KEY (parent_id) REFERENCES discussion_posts(id),
  INDEX idx_posts_room (room_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admin_audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id VARCHAR(36) NOT NULL,
  action VARCHAR(200) NOT NULL,
  target VARCHAR(300),
  http_status INT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_user_id) REFERENCES users(id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO discussion_rooms (gender, title, description, status, created_at) VALUES
  ('MALE', 'Brothers’ general discussion', 'A space for brothers to discuss lessons and share benefits.', 'ACTIVE', UTC_TIMESTAMP(6)),
  ('FEMALE', 'Sisters’ general discussion', 'A space for sisters to discuss lessons and share benefits.', 'ACTIVE', UTC_TIMESTAMP(6));
