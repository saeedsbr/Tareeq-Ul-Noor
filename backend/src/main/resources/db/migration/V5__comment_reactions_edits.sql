CREATE TABLE comment_reactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  target_type VARCHAR(10) NOT NULL,
  target_id BIGINT NOT NULL,
  value TINYINT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT chk_reaction_value CHECK (value IN (-1, 1)),
  CONSTRAINT chk_reaction_type CHECK (target_type IN ('QUESTION', 'REPLY')),
  CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uq_reaction (user_id, target_type, target_id),
  INDEX idx_reaction_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE questions ADD COLUMN edited_at DATETIME(6) NULL;
ALTER TABLE question_replies ADD COLUMN edited_at DATETIME(6) NULL;
