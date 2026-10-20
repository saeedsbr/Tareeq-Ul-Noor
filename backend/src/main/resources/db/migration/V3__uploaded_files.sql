CREATE TABLE uploaded_files (
  id VARCHAR(36) PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(80) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_files_user FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE notes
  ADD COLUMN attachment_name VARCHAR(255) NULL,
  ADD COLUMN attachment_url VARCHAR(300) NULL;
