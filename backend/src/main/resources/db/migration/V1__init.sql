CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE password_reset_tokens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME(6) NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE courses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  level VARCHAR(40) NOT NULL DEFAULT 'Beginner',
  cover_image_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  position INT NOT NULL DEFAULT 0,
  created_by VARCHAR(36),
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  INDEX idx_courses_status (status, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lessons (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  video_provider VARCHAR(20) NOT NULL DEFAULT 'YOUTUBE',
  video_url VARCHAR(500),
  duration_minutes INT,
  position INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  published_at DATETIME(6),
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id),
  UNIQUE KEY uq_lesson_slug (course_id, slug),
  INDEX idx_lessons_course (course_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lesson_resources (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  lesson_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  resource_type VARCHAR(20) NOT NULL DEFAULT 'LINK',
  content_or_url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_res_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lesson_completions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  lesson_id BIGINT NOT NULL,
  completed_at DATETIME(6) NOT NULL,
  UNIQUE KEY uq_completion (user_id, lesson_id),
  CONSTRAINT fk_comp_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_comp_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE questions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  lesson_id BIGINT NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_q_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_q_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  INDEX idx_q_user (user_id, created_at),
  INDEX idx_q_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE question_replies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT NOT NULL,
  admin_user_id VARCHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_qr_q FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_qr_admin FOREIGN KEY (admin_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quizzes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  lesson_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  instructions TEXT,
  pass_percentage INT NOT NULL DEFAULT 60,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  version INT NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_quiz_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  INDEX idx_quiz_lesson (lesson_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_questions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT NOT NULL,
  type VARCHAR(20) NOT NULL,
  prompt TEXT NOT NULL,
  points INT NOT NULL DEFAULT 1,
  position INT NOT NULL DEFAULT 0,
  model_answer TEXT,
  grading_mode VARCHAR(20) NOT NULL DEFAULT 'AUTO',
  CONSTRAINT fk_qq_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_options (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_question_id BIGINT NOT NULL,
  text VARCHAR(500) NOT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  position INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_qo_q FOREIGN KEY (quiz_question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_attempts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  quiz_id BIGINT NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
  started_at DATETIME(6) NOT NULL,
  submitted_at DATETIME(6),
  score_awarded INT,
  score_possible INT,
  percentage DECIMAL(5,2),
  passed TINYINT(1),
  CONSTRAINT fk_att_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  CONSTRAINT fk_att_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_att_user (user_id, quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_answers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT NOT NULL,
  quiz_question_id BIGINT NOT NULL,
  selected_option_id BIGINT,
  text_answer TEXT,
  awarded_points INT,
  feedback TEXT,
  UNIQUE KEY uq_answer (attempt_id, quiz_question_id),
  CONSTRAINT fk_ans_att FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ans_q FOREIGN KEY (quiz_question_id) REFERENCES quiz_questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT,
  lesson_id BIGINT,
  kind VARCHAR(20) NOT NULL DEFAULT 'NOTE',
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  created_by VARCHAR(36),
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_notes_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_notes_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  INDEX idx_notes_lesson (lesson_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
